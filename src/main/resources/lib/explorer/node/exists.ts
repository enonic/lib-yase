import type {
	Name,
	ParentPath,
	Path
} from '/lib/explorer/types/index.d';
import type {RepoConnection} from '/lib/explorer/types.d';
//import {toStr} from '@enonic/js-utils';

//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (externals not webpacked)
//──────────────────────────────────────────────────────────────────────────────
//@ts-ignore
import {sanitize} from '/lib/xp/common';


//──────────────────────────────────────────────────────────────────────────────
// Local libs (Absolute path without extension so it doesn't get webpacked)
//──────────────────────────────────────────────────────────────────────────────
//import {dirname} from '/lib/explorer/path/dirname';
import {join} from '../path/join';


//──────────────────────────────────────────────────────────────────────────────
// Public function
//──────────────────────────────────────────────────────────────────────────────
export function exists({
	connection, // Connecting many places leeds to loss of control over principals, so pass a connection around.
	_name = '',
	_parentPath,// = _path ? dirname(_path) : '/',
	_path
} :{
	connection :RepoConnection
	_name? :Name
	_parentPath? :ParentPath
	_path? :Path
}) {
	if (!_path) {
		if (!_parentPath) {
			throw new Error('_path or _parentPath is a required parameter!');
		}
		if (!_name) {
			throw new Error('_path or _name is a required parameter!');
		}
		_path = join(_parentPath, sanitize(_name)) as Path;
	}
	//log.info(toStr({_path}));
	const queryParams = {
		count: 0,
		query: `_path = '${_path}'`
		//filters:
	}; //log.info(toStr({queryParams}));
	const result = connection.query(queryParams); //log.info(toStr({result}));
	return result.total;
}
