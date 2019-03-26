import {serviceUrl} from '/lib/xp/portal';
import {htmlResponse} from '/lib/enonic/yase/admin/htmlResponse';

const ID_REACT_STATUS_CONTAINER = 'reactStatusContainer';


export const statusPage = ({
	path
}) => {
	const propsObj = {
		serviceUrl: serviceUrl({
			service: 'listCollectors'
		})
	};
	const propsJson = JSON.stringify(propsObj);
	return htmlResponse({
		bodyEnd: [
			`<script type="text/javascript">
	ReactDOM.render(
		React.createElement(window.yase.Status, ${propsJson}),
		document.getElementById('${ID_REACT_STATUS_CONTAINER}')
	);
</script>`
		],
		main: `<div id="${ID_REACT_STATUS_CONTAINER}"/>`,
		path,
		title: 'Status'
	})
} // statusPage