import {forceArray} from '/lib/enonic/util/data';
import {assetUrl} from '/lib/xp/portal';

import {TOOL_PATH} from '/lib/enonic/yase/constants';
import {connectRepo} from '/lib/enonic/yase/connectRepo';
import {htmlResponse} from '/lib/enonic/yase/admin/htmlResponse';
import {queryCollections} from '/lib/enonic/yase/admin/collections/queryCollections';
import {getFields} from '/lib/enonic/yase/admin/fields/getFields';
import {getTags} from '/lib/enonic/yase/admin/tags/getTags';
import {getThesauri} from '/lib/enonic/yase/admin/thesauri/getThesauri';


const ID_REACT_INTERFACE_CONTAINER = 'reactInterfaceContainer';


export function createOrEditInterfacePage({
	path
}) {
	const relPath = path.replace(TOOL_PATH, '');
	const pathParts = relPath.match(/[^/]+/g); //log.info(toStr({pathParts}));

	let initialValues;
	if (pathParts[1] !== 'createform') {
		const interfaceName = pathParts[1];
		const connection = connectRepo();
		const node = connection.get(`/interfaces/${interfaceName}`)
		const name = node.name || '';
		const collections = node.collections ? forceArray(node.collections) : []
		const thesauri = node.thesauri ? forceArray(node.thesauri) : []
		const {
			facets = [],
			query,
			resultMappings,
			pagination
		} = node;
		initialValues = {
			name,
			collections,
			query,
			resultMappings,
			facets,
			pagination,
			thesauri
		};
	}


	const propsObj = {
		action: `${TOOL_PATH}/interfaces`,
		collections: queryCollections().hits.map(({displayName: label, _name: value}) => ({label, value})),
		fields: getFields().hits.map(({displayName, key}) => ({label: displayName, value: key})),
		tags: getTags().hits.map(({displayName, _path}) => ({label: displayName, value: _path.replace(/^\/tags\//, '')})),
		thesauri: getThesauri().map(({displayName, name}) => ({label: displayName, value: name})),
		initialValues
	};

	const propsJson = JSON.stringify(propsObj);

	return htmlResponse({
		bodyEnd: [
			//`<script type="text/javascript" src="${assetUrl({path: 'react/react.production.min.js'})}"></script>`,
			`<script type="text/javascript" src="${assetUrl({path: 'react/react.development.js'})}"></script>`,
			//`<script type="text/javascript" src="${assetUrl({path: 'react-dom/react-dom.production.min.js'})}"></script>`,
			`<script type="text/javascript" src="${assetUrl({path: 'react-dom/react-dom.development.js'})}"></script>`,
			`<script type="text/javascript" src="${assetUrl({path: 'yase.js'})}"></script>`,
			`<script type="text/javascript">
	ReactDOM.render(
		React.createElement(window.yase.Interface, ${propsJson}),
		document.getElementById('${ID_REACT_INTERFACE_CONTAINER}')
	);
</script>`
		],
		main: `<div id="${ID_REACT_INTERFACE_CONTAINER}"/>`,
		path,
		title: 'Create or edit interface'
	});
} // function createOrEditInterfacePage