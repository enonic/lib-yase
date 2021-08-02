import {
	forceArray,
	isString,
	toStr
} from '@enonic/js-utils';

//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (externals not webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {newCache} from '/lib/cache';
import {getLocale} from '/lib/xp/admin';

//──────────────────────────────────────────────────────────────────────────────
// Local libs (Absolute path without extension so it doesn't get webpacked)
//──────────────────────────────────────────────────────────────────────────────
import {
	//COLLECTION_REPO_PREFIX,
	PRINCIPAL_EXPLORER_READ
} from '/lib/explorer/model/2/constants';

//import {get as getInterface} from '/lib/explorer/interface/get';
import {removeStopWords} from '/lib/explorer/query/removeStopWords';
import {wash} from '/lib/explorer/query/wash';
import {connect} from '/lib/explorer/repo/connect';
import {multiConnect} from '/lib/explorer/repo/multiConnect';
import {get as getStopWordsList} from '/lib/explorer/stopWords/get';
import {hash} from '/lib/explorer/string/hash';

//import {addCommonTermsFilter} from '/lib/explorer/client/addCommonTermsFilter';
//import {buildFacets} from '/lib/explorer/client/buildFacets';
import {buildFiltersFromParams} from '/lib/explorer/client/buildFiltersFromParams';
//import {buildHighlights} from '/lib/explorer/client/buildHighlights';
import {buildPagination} from '/lib/explorer/client/buildPagination';
import {buildQuery} from '/lib/explorer/client/buildQuery';
//import {flattenSynonyms} from '/lib/explorer/client/flattenSynonyms';
//import {getCachedActiveNode} from '/lib/explorer/client/getCachedActiveNode';
import {getCachedConfigFromInterface} from '/lib/explorer/client/getCachedConfigFromInterface';
//import {localizeFacets} from '/lib/explorer/client/localizeFacets';
import {mapMultiRepoQueryHits} from '/lib/explorer/client/mapMultiRepoQueryHits';

import {query as queryThesauri} from '/lib/explorer/thesaurus/query';

//import {pad} from '/lib/explorer/string/pad';

//const {currentTimeMillis} = Java.type('java.lang.System');

//──────────────────────────────────────────────────────────────────────────────
// Private constants
//──────────────────────────────────────────────────────────────────────────────

// Used for:
// * fields
// * fieldValues
const NODE_CACHE = newCache({
	expire: 60 * 60, // 1 hour
	size: 100
});

// Stop-words and synonyms are not currently cached :)


//──────────────────────────────────────────────────────────────────────────────
// Public function
//──────────────────────────────────────────────────────────────────────────────
export function search(params) {
	log.debug(`params:${toStr({params})}`);
	//const times = [{label: 'start', time: currentTimeMillis()}];

	if (!params.interface) {
		throw new Error('Missing required parameter interface!');
	}

	const {
		clearCache = false,
		explain = false,
		facets: facetsParam = {},
		interface: interfaceName,
		locale = getLocale(),
		logQuery = false,
		logQueryResults = false,
		//logSynonyms = false,
		name = 'q',
		searchString = params[name] || '',
		showSynonyms = false
	} = params;
	log.debug(`clearCache:${toStr({clearCache})}`);
	log.debug(`explain:${toStr({explain})}`);

	//log.info(`facetsParam:${toStr(facetsParam)}`);
	Object.keys(facetsParam).forEach((facet) => {
		// Falsy (false, 0, -0, 0n, "", null, undefined, and NaN)
		// Truthy !Falsy
		//log.info(`facetsParam['${facet}']:${toStr(facetsParam[facet])}`); // NOTE For some reason the Object contains properties whose valuse is the special value undefined!
		if (Array.isArray(facetsParam[facet])) {
			// no_op
		} else if (isString(facetsParam[facet]) && facetsParam[facet].length) {
			facetsParam[facet] = forceArray(facetsParam[facet]);
		} else {
			delete facetsParam[facet]; // NOTE This should not be needed, but see the previous NOTE.
		}
		//log.info(`facetsParam['${facet}']:${toStr(facetsParam[facet])}`);
	});
	log.debug(`facetsParam:${toStr({facetsParam})}`);

	log.debug(`interfaceName:${toStr({interfaceName})}`);
	log.debug(`locale:${toStr({locale})}`);
	log.debug(`logQuery:${toStr({logQuery})}`);
	log.debug(`logQueryResults:${toStr({logQueryResults})}`);
	log.debug(`name:${toStr({name})}`);
	log.debug(`searchString:${toStr({searchString})}`);

	if (clearCache) {
		log.info('Clearing node cache.');
		NODE_CACHE.clear();
	}

	const explorerRepoReadConnection = connect({
		principals: [PRINCIPAL_EXPLORER_READ]
	});

	const config = getCachedConfigFromInterface({interfaceName});
	log.debug(`config:${toStr({config})}`);

	const {
		stopWords//,
		//thesauri
	} = config.interfaceNode;
	log.debug(`stopWords:${toStr({stopWords})}`);

	let page = params.page ? parseInt(params.page, 10) : 1; // NOTE First index is 1 not 0
	log.debug(`page:${toStr({page})}`);

	const count = params.count ? parseInt(params.count, 10) : 10;
	//const count = 1; // DEBUG
	log.debug(`count:${toStr({count})}`);

	const start = params.start ? parseInt(params.start, 10) : (page - 1) * count; // NOTE First index is 0 not 1
	log.debug(`start:${toStr({start})}`);

	if (!page) { page = Math.floor(start / count) + 1; }
	log.debug(`page:${toStr({page})}`);

	const washedSearchString = wash({string: searchString});
	log.debug(`washedSearchString:${toStr({washedSearchString})}`);

	//times.push({label: 'various', time: currentTimeMillis()});

	// TODO stopWords could be cached:
	const listOfStopWords = [];
	if (stopWords && stopWords.length) {
		stopWords.forEach((name) => {
			const {words} = getStopWordsList({ // Not a query
				connection: explorerRepoReadConnection,
				name
			});
			//log.info(toStr({words}));
			words.forEach((word) => {
				if (!listOfStopWords.includes(word)) {
					listOfStopWords.push(word);
				}
			});
		});
	}
	log.debug(`listOfStopWords:${toStr({listOfStopWords})}`);

	const removedStopWords = [];
	const searchStringWithoutStopWords = removeStopWords({
		removedStopWords,
		stopWords: listOfStopWords,
		string: washedSearchString
	});
	log.debug(`searchStringWithoutStopWords:${toStr({searchStringWithoutStopWords})}`);
	/*log.info(toStr({
		washedSearchString,
		removedStopWords
	}));*/
	//times.push({label: 'stopwords', time: currentTimeMillis()});

	const synonyms = []; // Gets modified
	const expand = false;
	//if (logSynonyms) { log.info(`expand:${toStr(expand)}`); }

	//log.info(`facetsParam:${toStr(facetsParam)}`);
	// Falsy (false, 0, -0, 0n, "", null, undefined, and NaN)
	// Truthy !Falsy
	const languages = facetsParam.language || [];
	//log.info(`languages:${toStr(languages)}`);

	const query = buildQuery({
		connection: explorerRepoReadConnection,
		expand,
		explain,
		expression: { // TODO Hardcode
			type: 'group',
			operator: 'or',
			params: {
				expressions: [{
					type: 'fulltext',
					operator: 'and',
					params: {
						fields: [{
							field: 'title',
							boost: 2
						}, {
							field: 'uri',
							boost: 2
						}, {
							field: 'text',
							boost: 2
						}]
					}
				}, {
					type: 'ngram',
					operator: 'and',
					params: {
						fields: [{
							field: 'title'//,
							//boost: 1
						}, {
							field: 'text'//,
							//boost: 1
						}]
					}
				}]
			}
		},
		languages,
		logQuery,
		logQueryResults,
		//logSynonyms,
		//searchString: washedSearchString,
		searchString: searchStringWithoutStopWords,
		showSynonyms,
		synonyms//, // Gets modified
		//times
	});
	log.debug(`query:${toStr({query})}`);

	//if (logSynonyms) { log.info(`synonyms:${toStr(synonyms)}`); }
	//log.info(toStr({query}));
	//times.push({label: 'query', time: currentTimeMillis()});

	const thesauriMap = {};
	queryThesauri({
		connection: explorerRepoReadConnection,
		explain,
		logQuery,
		logQueryResults,
		getSynonymsCount: false
	}).hits.forEach(({name, displayName}) => {
		thesauriMap[name] = displayName;
	});
	log.debug(`thesauriMap:${toStr({thesauriMap})}`);
	//times.push({label: 'thesauri', time: currentTimeMillis()});

	/*const flattenedSynonyms = [searchString];
	flattenSynonyms({
		array: flattenedSynonyms,
		expand,
		synonyms
	});*/

	const synonymsObj = {};
	if (showSynonyms) {
		synonyms.forEach(({
			highlight,
			thesaurus,
			score,
			from,
			to
		}) => {
			const thesaurusName = thesauriMap[thesaurus];
			if(!synonymsObj[thesaurusName]) {
				synonymsObj[thesaurusName] = {};
			}
			if (highlight && highlight.to) {
				to = highlight.to;
			}
			if (highlight && highlight.from) {
				synonymsObj[thesaurusName][highlight.from] = {
					from: highlight.from,
					score,
					to
				};
			} else {
				synonymsObj[thesaurusName][forceArray(from)] = {
					from: forceArray(from),
					score,
					to
				};
			}
		});
		//log.info(`synonymsObj:${toStr({synonymsObj})}`);
		//times.push({label: 'synonyms', time: currentTimeMillis()});
	} // if (showSynonyms)

	const filters = buildFiltersFromParams({
		facetsParam,
		facetsObj: config.facetsObj,
		staticFilters: config.filters
	});
	log.debug(`filters:${toStr({filters})}`);
	//times.push({label: 'buildFiltersFromParams', time: currentTimeMillis()});

	/*addCommonTermsFilter({
		commonWords: listOfStopWords,
		filtersObjToModify: filters,
		searchString: washedSearchString
	});
	log.info(toStr({filters}));*/

	const multiConnectParams = {
		principals: [PRINCIPAL_EXPLORER_READ],
		sources: config.sources
	};
	if(logQuery) {
		log.info(`multiConnectParams:${toStr(multiConnectParams)}`);
	} else {
		log.debug(`multiConnectParams:${toStr(multiConnectParams)}`);
	}

	const readConnections = multiConnect(multiConnectParams);
	//times.push({label: 'multiConnect', time: currentTimeMillis()});

	const numberOfActiveFacetCategories = Object.keys(facetsParam).filter(k => facetsParam[k]).length;
	log.debug(`numberOfActiveFacetCategories:${toStr({numberOfActiveFacetCategories})}`);

	const queryParams = {
		count,
		explain,
		filters,
		query,
		start
	};
	queryParams.aggregations = config.aggregations;
	//log.info(toStr({count}));
	if (logQuery) {
		log.info(`queryParams:${toStr(queryParams)}`);
	} else {
		log.debug(`queryParams:${toStr({queryParams})}`);
	}

	const queryRes = readConnections.query(queryParams);
	if (logQueryResults) {
		log.info(`queryRes:${toStr(queryRes)}`);
	} else {
		log.debug(`queryRes:${toStr({queryRes})}`);
	}

	const aggregationsCacheObj = {};
	if (Object.keys(queryRes.aggregations).length) {
		const aggregationCacheKey = hash(filters, 52);
		aggregationsCacheObj[aggregationCacheKey] = queryRes.aggregations;
	}
	log.debug(`aggregationsCacheObj:${toStr({aggregationsCacheObj})}`);

	const {hits, total} = queryRes;
	//log.info(toStr({total}));
	//times.push({label: 'result', time: currentTimeMillis()});

	// If there are no selected facets we can fetch all facet numbers from main query.
	//
	// If there is a selected facet in one category (A) we need two queries:
	// Main query is filtered on A and produce numbers for B and C.
	// Numbers for category A can be fetched from a query without filters
	//
	// If there is a selected facet in two categories (A, B) we need three queries:
	// Main query is filtered on A and B and produce numbers for C.
	// Numbers for category A can be fetched from a query with filter on B.
	// Numbers for category B can be fetched from a query with filter on A.
	//
	// If there is a selected facet in all three categories (A, B, C) we need four queries:
	// Main query is filtered on A, B and C, and cannot be used for numbers.
	// Numbers for category A can be fetched from a query with filter on B and C.
	// Numbers for category B can be fetched from a query with filter on A and C.
	// Numbers for category C can be fetched from a query with filter on A and B.

	const pages = Math.ceil(total / count);
	log.debug(`pages:${toStr({pages})}`);

	const pagination = buildPagination({
		facets: facetsParam,
		locale,
		name,
		page,
		pages,
		//paginationConfig,
		searchString: washedSearchString
	});
	log.debug(`pagination:${toStr({pagination})}`);
	//times.push({label: 'pagination', time: currentTimeMillis()});

	//const response = {
	return {
		params: {
			count,
			facets: facetsParam,
			interface: interfaceName,
			locale,
			name,
			page,
			searchString: washedSearchString,
			start
		},
		count: queryRes.count,
		expand,
		pages,
		total,
		removedStopWords,
		synonymsObj,
		hits: mapMultiRepoQueryHits({
			facets: facetsParam,
			hits,
			locale,
			urlQueryParameterNameContainingSearchString: name,
			nodeCache: NODE_CACHE,
			searchString: washedSearchString
			//times
		}),
		pagination
	};
	/*times.push({label: 'mapMultiRepoQueryHits', time: currentTimeMillis()});
	for (let i = 0; i < times.length - 1; i += 1) {
		const dur = times[i + 1].time - times[i].time;
		log.info(`${searchStringWithoutStopWords} ${pad(dur, 4)} ${pad(times[i + 1].time - times[0].time, 4)} ${times[i + 1].label}`);
	}
	//const dur = times[times.length - 1].time - times[0].time;
	//log.info(`${searchStringWithoutStopWords} ${pad(dur, 4)} total`);
	log.info('────────────────────────────────────────────────────────────────────────────────');
	return response;*/
} // function search
