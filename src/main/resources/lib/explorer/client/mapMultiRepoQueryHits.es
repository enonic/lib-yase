//──────────────────────────────────────────────────────────────────────────────
// Node modules (webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {
	forceArray//,
	//toStr
} from '@enonic/js-utils';
//import highlightSearchResult from 'highlight-search-result';
//import {get, set} from 'lodash'; // Cannot read property "Array" from undefined
import getIn from 'get-value';
import set from 'set-value';
import striptags from 'striptags';

//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (externals not webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {dlv as get} from '/lib/util/object';

//──────────────────────────────────────────────────────────────────────────────
// Local libs (Absolute path without extension so it doesn't get webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {
	BRANCH_ID_EXPLORER,
	ELLIPSIS,
	PRINCIPAL_EXPLORER_READ,
	REPO_ID_EXPLORER
} from '/lib/explorer/model/2/constants';
import {connect} from '/lib/explorer/repo/connect';
import {cachedNode} from '/lib/explorer/client/cachedNode';
//import {highlight as highlightSearchResult} from '/lib/explorer/client/highlight';

//const {currentTimeMillis} = Java.type('java.lang.System');


export function mapMultiRepoQueryHits({
	facets,
	hits,
	//locale,
	urlQueryParameterNameContainingSearchString,
	nodeCache,
	resultMappings = [{
		field: 'title',
		highlight: true,
		highlightFragmenter: 'span',
		highlightNumberOfFragments: 1,
		highlightOrder: 'none',
		highlightPostTag: '</b>',
		highlightPreTag: '<b>',
		lengthLimit: 255,
		to: 'title',
		type: 'string'
	}, {
		field: 'text',
		highlight: true,
		highlightFragmenter: 'span',
		highlightNumberOfFragments: 1,
		highlightOrder: 'none',
		highlightPostTag: '</b>',
		highlightPreTag: '<b>',
		lengthLimit: 255,
		to: 'text',
		type: 'string'
	}, {
		field: 'uri',
		highlight: false,
		to: 'href',
		type: 'string'
	}],
	searchString//,
	//times
}) {
	//times.push({label: 'mapMultiRepoQueryHits start', time: currentTimeMillis()});
	const connectionsObj = {};

	//log.info(toStr({searchString}));
	//const res = hits.map(hit => {
	return hits.map(hit => {
		const {
			repoId,
			branch,
			id,
			highlight: highlightedFields
		} = hit;
		//log.info(toStr({repoId, branch, id}));
		//log.info(`highlightedFields:${toStr({highlightedFields})}`);

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
		//log.info(`resultMappings:${toStr(resultMappings)}`);
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

			//log.info(`node:${toStr({node})}`);
			//log.info(`field:${toStr({field})}`);
			const value = get(node, field);
			//log.info(`value:${toStr({value})}`);

			let mappedValue = value;
			if (type === 'string') {
				const maybeArray = value || '';
				const textToHighlight = striptags((join && Array.isArray(maybeArray))
					? maybeArray.join(separator)
					: maybeArray);
				//log.info(toStr({textToHighlight}));
				mappedValue = textToHighlight;

				if (highlight) {


					if (highlightedFields && Array.isArray(highlightedFields[field]) && highlightedFields[field][0]) {
						mappedValue = highlightedFields[field][0];

						const strippedText = mappedValue.replace(/<b>/g, '').replace(/<\/b>/g, '');
						//log.info(`strippedText:${strippedText}`);

						//log.info(`textToHighlight.length:${textToHighlight.length}`);

						const numCharsFromStartToCheck = Math.min(6,textToHighlight.length);
						//log.info(`numCharsFromStartToCheck:${numCharsFromStartToCheck}`);

						const startsWithText = textToHighlight.substring(0, numCharsFromStartToCheck);
						//log.info(`startsWithText:${startsWithText}`);

						if (!strippedText.startsWith(startsWithText)) {
							mappedValue = `${ELLIPSIS}${mappedValue}`;
						}

						const numCharsFromEndToCheck = Math.min(6,textToHighlight.length);
						//log.info(`numCharsFromEndToCheck:${numCharsFromEndToCheck}`);

						const endsWithText = textToHighlight.slice(0-numCharsFromEndToCheck);
						//log.info(`endsWithText:${endsWithText}`);

						if (!strippedText.endsWith(endsWithText)) {
							mappedValue = `${mappedValue}${ELLIPSIS}`;
						}
					} else if (lengthLimit) {
						if (mappedValue.length > lengthLimit) {
							mappedValue = `${mappedValue.substring(0, lengthLimit)}${ELLIPSIS}`;
						}
						//mappedValue = mappedValue.substring(0, lengthLimit);
						//times.push({label: 'highlight start', time: currentTimeMillis()});
						/*mappedValue = highlightSearchResult(
							textToHighlight,
							searchString,
							lengthLimit || textToHighlight.length,
							str => `<b>${str}</b>`
						);*/
						//times.push({label: 'highlight end', time: currentTimeMillis()});
						//log.info(toStr({mappedValue}));
					}
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
							log.error(`Could not find node ${REPO_ID_EXPLORER}:${BRANCH_ID_EXPLORER}:${path}`, e);
						}

						const activeFilters = {};

						//log.info(`facets:${toStr(facets)}`); // For some reason this logs {} even though it has properties???
						//log.info(`Object.keys(facets):${toStr(Object.keys(facets))}`);
						Object.keys(facets).forEach((category) => {
							//log.info(`facets['${category}']:${toStr(facets[category])}`);
							//facets[category] && // NOTE This was only needed when the facets Object contained properties with the special value undefined
							facets[category].forEach((facet) => {
								set(activeFilters,`${category}.${facet}`, true);
							});
						});
						if (getIn(activeFilters, `${field}.${name}`, false)) {
							delete(activeFilters[field][name]);
						} else {
							set(activeFilters,`${field}.${name}`, true);
						}

						return {
							displayName: tagNode.displayName,
							href: `?${urlQueryParameterNameContainingSearchString}=${searchString}${Object.keys(activeFilters)
								.map(key => Object.keys(activeFilters[key])
									.map(value => `&${key}=${value}`)
									.join(''))
								.join('')}`,
							name,
							path,
							field
						};
					});
				//times.push({label: 'tag end', time: currentTimeMillis()});
			}
			set(obj, to, mappedValue);
			//times.push({label: 'resultMappings end', time: currentTimeMillis()});
		}); // resultMappings.forEach
		//log.info(toStr({obj}));
		return obj;
	}).filter(x => x); // Remove missing nodes
	//times.push({label: 'mapMultiRepoQueryHits end', time: currentTimeMillis()});
	//return res;
} // function mapMultiRepoQueryHits
