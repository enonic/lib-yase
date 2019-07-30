//──────────────────────────────────────────────────────────────────────────────
// Node modules (webpacked)
//──────────────────────────────────────────────────────────────────────────────
//import highlightSearchResult from 'highlight-search-result';
//import {get, set} from 'lodash'; // Cannot read property "Array" from undefined
import set from 'set-value';
import striptags from 'striptags';

//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (externals not webpacked)
//──────────────────────────────────────────────────────────────────────────────
//import {toStr} from '/lib/util';
import {forceArray} from '/lib/util/data';
import {dlv as get} from '/lib/util/object';

//──────────────────────────────────────────────────────────────────────────────
// Local libs (Absolute path without extension so it doesn't get webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {
	BRANCH_ID_EXPLORER,
	PRINCIPAL_EXPLORER_READ,
	REPO_ID_EXPLORER
} from '/lib/explorer/model/2/constants';
import {connect} from '/lib/explorer/repo/connect';
import {cachedNode} from '/lib/explorer/client/cachedNode';
import {highlight as highlightSearchResult} from '/lib/explorer/client/highlight';

const {currentTimeMillis} = Java.type('java.lang.System');


export function mapMultiRepoQueryHits({
	hits,
	locale,
	nodeCache,
	resultMappings,
	searchString,
	times
}) {
	//times.push({label: 'mapMultiRepoQueryHits start', time: currentTimeMillis()});
	const connectionsObj = {};

	//log.info(toStr({searchString}));
	//const res = hits.map(hit => {
	return hits.map(hit => {
		const {repoId, branch, id} = hit;
		//log.info(toStr({repoId, branch, id}));

		// Connections aren't really cached
		const connectionKey = `${repoId}:${branch}`;
		if (!connectionsObj[connectionKey]) {
			connectionsObj[connectionKey] = connect({
				repoId,
				branch,
				principals: [PRINCIPAL_EXPLORER_READ]
			});
		}

		// Hits vary a lot and as such should not be cached!
		const node = connectionsObj[connectionKey].get(id);
		if (!node) { return null; }
		//log.info(toStr({node}));

		const obj={};
		resultMappings.forEach(({
			field,
			highlight,
			join = true,
			lengthLimit,
			separator = ' ',
			to,
			type = 'string'
		}) => {
			//times.push({label: 'resultMappings start', time: currentTimeMillis()});
			/*log.info(toStr({
				field,
				highlight,
				lengthLimit,
				to,
				type
			}));*/

			const value = get(node, field);
			//log.info(toStr({value}));

			let mappedValue = value;
			if (type === 'string') {
				const maybeArray = value || '';
				const textToHighlight = striptags((join && Array.isArray(maybeArray))
					? maybeArray.join(separator)
					: maybeArray);
				//log.info(toStr({textToHighlight}));

				if (highlight) {
					//times.push({label: 'highlight start', time: currentTimeMillis()});
					mappedValue = highlightSearchResult(
						textToHighlight,
						searchString,
						lengthLimit || textToHighlight.length,
						str => `<b>${str}</b>`
					);
					//times.push({label: 'highlight end', time: currentTimeMillis()});
					//log.info(toStr({mappedValue}));
				} else {
					mappedValue = lengthLimit
						? textToHighlight.substring(0, lengthLimit)
						: textToHighlight;
					//log.info(toStr({v}));
				}
			} else if (type === 'tags') {
				//times.push({label: 'tag start', time: currentTimeMillis()});
				mappedValue = (value ? forceArray(value) : [])
					.map(name => {
						const path = `/fields/${field}/${name}`;
						let tagNode = {displayName: name};
						try {
							tagNode = cachedNode({
								cache: nodeCache, repoId: REPO_ID_EXPLORER, branch: BRANCH_ID_EXPLORER, id: path
							});
						} catch (e) {
							log.error(`Could not find node ${REPO_ID_EXPLORER}:${BRANCH_ID_EXPLORER}:${path}`);
						}
						return {
							displayName: tagNode.displayName,
							name,
							path,
							field
						}
					});
					//times.push({label: 'tag end', time: currentTimeMillis()});
			}
			set(obj, to, mappedValue);
			//times.push({label: 'resultMappings end', time: currentTimeMillis()});
		}) // resultMappings.forEach
		//log.info(toStr({obj}));
		return obj;
	}).filter(x => x); // Remove missing nodes
	//times.push({label: 'mapMultiRepoQueryHits end', time: currentTimeMillis()});
	//return res;
} // function mapMultiRepoQueryHits
