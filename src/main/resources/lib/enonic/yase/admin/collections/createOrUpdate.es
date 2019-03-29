//import {toStr} from '/lib/enonic/util';
import {
	NT_COLLECTION,
	TOOL_PATH
} from '/lib/enonic/yase/constants';
import {createOrModify} from '/lib/enonic/yase/node/createOrModify';
//import {list} from '/lib/enonic/yase/admin/collections/list';


export const createOrUpdate = ({
	params//,
	//path
}) => {
	/*log.info(toStr({
		params,
		path
	}));*/

	const {json} = params;
	//log.info(toStr({json}));

	const obj = JSON.parse(json);
	//log.info(toStr({obj}));

	obj._indexConfig = {default: 'byType'};
	obj._name = obj.name;
	obj._parentPath = '/collections';
	obj.displayName = obj.name;
	obj.type = NT_COLLECTION;
	//log.info(toStr({obj}));

	let status = 200;
	const messages = [];
	const node = createOrModify(obj);
	return {
		redirect: `${TOOL_PATH}/collections/list?${
			messages.map(m => `messages=${m}`).join('&')
		}&status=${status}`
	}
	/*return list({
		path
	}, {
		messages: node
			? [`Collection ${obj.name} saved.`]
			: [`Something went wrong when saving collection ${obj.name}!`],
		statue: node ? 200 : 500
	});*/
};