import {
	PRINCIPAL_YASE_READ,
	RT_JSON
} from '/lib/explorer/constants';
import {exists} from '/lib/explorer/interface/exists';
import {connect} from '/lib/explorer/repo/connect';


export function get({
	params: {
		name
	}
}) {
	return {
		body: {
			exists: exists({
				connection: connect({principals: [PRINCIPAL_YASE_READ]}),
				name
			})
		},
		contentType: RT_JSON
	};
}