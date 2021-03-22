import Router from '/lib/router';

//import {get as getV1} from '/lib/explorer/api/v1';
import {all as v1DocumentsAll} from '/lib/explorer/api/v1/documents';

const router = Router();

/*router.all('/api', () => ({
	body: `<html>
	<head>
		<title>Versions - API documentation</title>
	</head>
	<body>
		<h1>API documentation</h1>
		<h2>Versions</h2>
		<ul>
			<li><a href="/api/v1">v1</a></li>
		</ul>
	</body>
	</html>`,
	contentType: 'text/html;charset=utf-8'
}));*/

//router.all('/api/v1', (r) => getV1(r));
//router.all('/api/v1/documents', (r) => v1DocumentsAll(r));

router.all('/api/v1/collections/{collection}', (r) => ({
	body: `<html>
	<head>
		<title>Endpoints - Version 1 - API documentation</title>
	</head>
	<body>
		<h1>API documentation</h1>
		<h2>Endpoints</h2>
		<ul>
			<li><a href="/api/v1/collections/${r.pathParams.collection}/documents">documents</a></li>
		</ul>
	</body>
	</html>`,
	contentType: 'text/html;charset=utf-8'
}));
router.all('/api/v1/collections/{collection}/documents', (r) => v1DocumentsAll(r));

export const all = (r) => router.dispatch(r);
