//import {toStr} from '@enonic/js-utils';

import {request as httpClientRequest} from '/lib/http-client';
import {sleep} from '/lib/xp/task';


const {currentTimeMillis} = Java.type('java.lang.System');


export function smartRequest({
	auth,
	body,
	connectionTimeout = 20000,
	contentType,
	delay = 1000,
	headers = {},
	method = 'GET',
	multipart,
	params = {},
	proxy,
	readTimeout = 5000,
	retryCount = 0, // Gets incremented on recursion
	retries = 0,
	stateRef = { prevReqFinishedAtMillis: null },
	url
}) {
	//log.info(toStr({delay, retries, retryCount}));
	const reqParams = {
		connectionTimeout,
		contentType,
		headers,
		method,
		params,
		readTimeout,
		url
	};
	//log.info(toStr({body, headers, url}));
	if (auth) { reqParams.auth = auth; }
	if (body) { reqParams.body = body; }
	if (contentType) { reqParams.contentType = contentType; }
	if (multipart) { reqParams.multipart = multipart; }
	if (proxy) { reqParams.proxy = proxy; }
	//log.info(toStr({reqParams}));

	let response;
	try {
		if (stateRef && stateRef.prevReqFinishedAtMillis && delay) {
			const msToSleep = delay - (currentTimeMillis() - stateRef.prevReqFinishedAtMillis);
			//log.info(toStr({msToSleep}));
			if (msToSleep) { sleep(msToSleep); }
		}
		//const sentRequestAtMillis = currentTimeMillis();
		response = httpClientRequest(reqParams);
		stateRef.prevReqFinishedAtMillis = currentTimeMillis();
		//const latency = stateRef.prevReqFinishedAtMillis - sentRequestAtMillis;
		//log.info(toStr({latency}));
	} catch (e) {
		stateRef.prevReqFinishedAtMillis = currentTimeMillis();
		if (e instanceof java.net.ConnectException) {
			log.error(e.message + ': on url:' + url/*, e*/); // Don't want stacktrace
		} else if (e instanceof java.net.SocketTimeoutException) {
			if(e.message === 'connect timed out') {
				log.error(e.message + ': connectionTimeout ' + connectionTimeout + 'ms exceeded on url ' + url/*, e*/); // Don't want stacktrace
			} else if (e.message === 'timeout') {
				log.error(e.message + ': readTimeout ' + readTimeout + 'ms exceeded on url ' + url/*, e*/); // Don't want stacktrace
			} else {
				log.error('java.net.SocketTimeoutException with unknown message:' + e.message, e);
			}
		} else if (e instanceof java.lang.NullPointerException) {
			log.error('java.lang.NullPointerException with message:' + e.message, e);
		} else {
			// TODO java.lang.RuntimeException: SSL peer shut down incorrectly
			log.error(e.message + ': unhandled error on url:' + url, e);
		}
		if(retries && retryCount < retries) {
			reqParams.connectionTimeout = connectionTimeout * 2; // Double on each retry
			reqParams.delay = delay;
			reqParams.readTimeout = readTimeout * 2; // Double on each retry
			reqParams.retries = retries;
			reqParams.retryCount = retryCount + 1; // Increment before recursion
			reqParams.stateRef = stateRef; // Pass on reference
			response = smartRequest(reqParams); // Recursion
		} else {
			throw e;
		}
	} // catch

	//log.info(toStr({response}));
	return response;
} // function smartRequest