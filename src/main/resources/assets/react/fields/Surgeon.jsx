// Buttons
import {InsertButton} from '../buttons/InsertButton';
import {MoveUpButton} from '../buttons/MoveUpButton';
import {MoveDownButton} from '../buttons/MoveDownButton';
import {RemoveButton} from '../buttons/RemoveButton';
import {SetFieldValueButton} from '../buttons/SetFieldValueButton';

// Elements
import {Fieldset} from '../elements/Fieldset';
import {Label} from '../elements/Label';
import {LabeledField} from '../elements/LabeledField';
import {Table} from '../elements/Table';

// Fields
import {CrawlField} from './CrawlField';
import {DelayField} from './DelayField';
import {DownloadField} from './DownloadField';
import {HeadersField} from './HeadersField';
import {PathRangeField} from './PathRangeField';
import {QueryRangeField} from './QueryRangeField';
import {ScrapeField} from './ScrapeField';
import {UrlsField} from './UrlsField';


export const Surgeon = ({
	fields,
	handleBlur,
	handleChange,
	path,
	setFieldValue,
	values: {
		collector: {
			name: collectorName,
			config: {
				crawl,
				delay,
				download,
				pathRange,
				queryRange,
				headers,
				scrape,
				urls
			}
		}
	}
}) => /*{
	console.log(JSON.stringify({
		fields,
		path,
		collectorName,
		crawl,
		delay,
		download,
		pathRange,
		queryRange,
		headers,
		scrape,
		urls
	}, null, 4));
	return */<><Fieldset legend="Request">
		<UrlsField path={`${path}.urls`} value={urls}/>
		<PathRangeField path={`${path}.pathRange`} pathRange={pathRange} setFieldValue={setFieldValue}/>
		<QueryRangeField path={`${path}.queryRange`} queryRange={queryRange} setFieldValue={setFieldValue}/>
		<HeadersField path={`${path}.headers`} headers={headers} setFieldValue={setFieldValue}/>
		<DelayField path={`${path}.delay`} value={delay}/>
	</Fieldset>
	<ScrapeField fields={fields} handleBlur={handleBlur} handleChange={handleChange} path={`${path}.scrape`} value={scrape} setFieldValue={setFieldValue}/>
	<DownloadField path={`${path}.download`} value={download} setFieldValue={setFieldValue}/>
	<CrawlField fields={fields} handleBlur={handleBlur} handleChange={handleChange} path={`${path}.crawl`} value={crawl} setFieldValue={setFieldValue}/>
</>/*}*/;
