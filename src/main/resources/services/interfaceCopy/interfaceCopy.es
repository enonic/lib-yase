import {
	PRINCIPAL_YASE_WRITE,
	RT_JSON
} from '/lib/explorer/constants';
import {connect} from '/lib/explorer/repo/connect';
import {copy} from '/lib/explorer/interface/copy';


export function get({
	params: {
		from,
		to
	}
}) {
	try {
		copy({
			connection: connect({
				principals: [PRINCIPAL_YASE_WRITE]
			}),
			from,
			to
		});
		return {
			body: {
				from,
				to
			},
			contentType: RT_JSON
		}
	} catch (e) {
		return {
			body: {
				message: e.message
			},
			contentType: RT_JSON,
			status: 500
		}
	}
}