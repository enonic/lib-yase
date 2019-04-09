//import {toStr} from '/lib/enonic/util';
import {forceArray} from '/lib/enonic/util/data';

import {addFilter} from '/lib/enonic/yase/query/addFilter';
import {hasValue} from '/lib/enonic/yase/query/hasValue';
import {replaceSyntax} from '/lib/enonic/yase/query/replaceSyntax';
import {ws} from '/lib/enonic/yase/string/ws';
import {query as querySynonyms} from '/lib/enonic/yase/synonym/query';
import {wash} from '/lib/enonic/yase/search/synonyms/wash';
//import {mapSynonyms} from '/lib/enonic/yase/search/mapSynonyms';

const MAX_COUNT = 100;

export function getSynonyms({
	connection, // Connecting many places leeds to loss of control over principals, so pass a connection around.
	expand = false,
	searchString,
	thesauri,
	count = MAX_COUNT//thesauri.length
}) {
	//log.info(toStr({connection, expand, searchString, thesauri, count}));
	if (!searchString || !thesauri) { return []; }

	const fields = expand ? 'from,to' : 'from';
	const cleanSearchString = ws(replaceSyntax({string: searchString}));
	//log.info(toStr({cleanSearchString}));

	// ngram will quickly match a ton of synonyms, so don't use it.
	const query = `fulltext('${fields}', '${cleanSearchString}', 'OR', 'standard')`; // TODO Remove workaround in Enonic XP 7
	//log.info(toStr({query}));

	const params = {
		connection,
		count: count >= 1 && count <= MAX_COUNT ? count : MAX_COUNT,
		filters: addFilter({filter: hasValue('_parentPath', forceArray(thesauri).map(n => `/thesauri/${n}`))}),
		query,
		sort: '_score DESC'
	};
	//log.info(toStr({params}));

	const hits = querySynonyms(params).hits;
	//log.info(toStr({hits}));

	return hits.map(({from, score, thesaurus, to}) => {
		//log.info(toStr({from, score, thesaurus, to}));
		return {
			from: forceArray(from).map(s => wash(s)),
			score,
			thesaurus,
			to: forceArray(to).map(s => wash(s))
		};
	});
	/*const obj = mapSynonyms({
		expand,
		searchString: cleanSearchString,
		from,
		to
	});
	if (!obj) { return null; }
	obj.thesaurus = _path.match(/[^/]+/g)[1];
	return obj;
	}).filter(x => x);*/
} // getSynonyms