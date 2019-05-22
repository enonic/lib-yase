import {join}  from '/lib/enonic/yase/path/join';


export const get = ({
	connection, // Connecting many places leeds to loss of control over principals, so pass a connection around.
	_parentPath = '/',
	_name = '',
	path = join(_parentPath, _name),
	key = path,
	keys = [key]
}) => {
	return connection.get(...keys);
} // get
