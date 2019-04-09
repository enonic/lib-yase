import {connect, FieldArray, getIn} from 'formik';

import {InsertButton} from '../../buttons/InsertButton';
import {MoveUpButton} from '../../buttons/MoveUpButton';
import {MoveDownButton} from '../../buttons/MoveDownButton';
import {RemoveButton} from '../../buttons/RemoveButton';
import {SetButton} from '../../buttons/SetButton';

import {Select} from '../../elements/Select';
import {Table} from '../../elements/Table';

import {Buttons} from '../../semantic-ui/Buttons';
import {Field} from '../../semantic-ui/Field';
import {Header} from '../../semantic-ui/Header';
import {Icon} from '../../semantic-ui/Icon';

import {FieldSelector} from '../../fields/FieldSelector';
import {ScrapeExpressionBuilder} from './ScrapeExpressionBuilder';
import {TagSelector} from '../../fields/TagSelector';

import {replaceIndexWithDigit} from './replaceIndexWithDigit';
import {replacePathWithDot} from './replacePathWithDot';

//import {toStr} from '../../utils/toStr';


export const Scrape = connect(({
	formik: {
		values
	},
	fields = {},
	name = 'scrape',
	parentPath,
	path = parentPath ? `${parentPath}.${name}` : name,
	value = getIn(values, path) || undefined
}) => {
	/*console.debug(toStr({
		component: 'Scrape',
		parentPath,
		value//,
		//values
	}));*/

	const tagsPath = `${parentPath}.tags`;
	//console.log(JSON.stringify({tagsPath}, null, 4));

	const tagsArray = getIn(values, tagsPath) || [{field: '', tags: []}];

	const level = replaceIndexWithDigit(replacePathWithDot(path).replace('.scrape', '')).replace(/\.$/, '');
	if(!(value && Array.isArray(value) && value.length)) {
		return <Field>
			<SetButton
				field={path}
				value={[{field: ''}]}
			><Icon className='green plus'/> Add scrape {level}</SetButton>
		</Field>
	}
	return <>
		<Header dividing>Scrape {level}</Header>
		<Table headers={['Fields', 'Actions']}>
			<FieldArray
				name={path}
				render={() => value.map(({
					field,
					option = 'scrape',
					tags: selectedTags = []
				}, index) => <tr key={`${path}[${index}]`}>
					<td>
						<FieldSelector
							name={`${path}[${index}].field`}
							fields={fields}
							value={field}
						/>
						<Select
							path={`${path}[${index}].option`}
							options={[{
								label: 'Scrape',
								value: 'scrape'
							}, {
								label: 'Tag',
								value: 'tag'
							}]}
							value={option}
						/>
						{option === 'scrape'
							? <ScrapeExpressionBuilder
								parentPath={`${path}[${index}]`}
							/>
							: field
								? <TagSelector
									label=""
									multiple={true}
									path={`${path}[${index}].tags`}
									tags={fields[field].values}
									value={selectedTags}
								/>
								: null
						}
					</td>
					<td>
						<Buttons icon vertical>
							<InsertButton index={index} path={path} value={{field: ''}}/>
							<RemoveButton index={index} path={path}/>
							<MoveDownButton disabled={index === value.length-1} index={index} path={path} visible={value.length > 1}/>
							<MoveUpButton index={index} path={path} visible={value.length > 1}/>
						</Buttons>
					</td>
				</tr>)}
			/>
		</Table>
	</>;
});