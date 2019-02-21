import {Field, FieldArray} from 'formik';
import {get} from 'lodash';

import {InsertButton} from '../buttons/InsertButton';
import {MoveUpButton} from '../buttons/MoveUpButton';
import {MoveDownButton} from '../buttons/MoveDownButton';
import {RemoveButton} from '../buttons/RemoveButton';

import {Fieldset} from '../elements/Fieldset';
import {Radio} from '../elements/Radio';
import {Select} from '../elements/Select';
import {Table} from '../elements/Table';

import {OperatorSelector} from '../fields/OperatorSelector';


//import {toStr} from '../utils/toStr';


export const Fulltext = ({
	defaultBoost = '',
	defaultValue = {
		fields: [{
			field: '',
			boost: defaultBoost
		}],
		operator: 'or'
	},
	fields,
	name = 'fulltext',
	legend = null,
	parentPath,
	path = parentPath ? `${parentPath}.${name}` : name,
	setFieldValue,
	values,
	value = values ? get(values, path, defaultValue) : defaultValue
}) => {
	/*console.debug(toStr({
		//defaultValue,
		//fields,
		name,
		//parentPath,
		path,
		//values,
		value
	}));*/
	const fragment = <>
		<OperatorSelector parentPath={path} setFieldValue={setFieldValue} values={values}/>
		<Table headers={['Field', 'Boost', `Action${value.fields.length > 1 ? 's' : ''}`]}>
			<FieldArray
				name={`${path}.fields`}
				render={({insert, swap, remove}) => value.fields
					.map(({field = '', boost = defaultBoost}, index) => {
						const key = `${path}.fields[${index}]`;
						return <tr key={key}>
							<td><Select
								parentPath={key}
								name="field"
								options={fields}
								placeholder='Select field'
								setFieldValue={setFieldValue}
								values={values}
							/></td>
							<td><Field autoComplete="off" name={`${key}.boost`} value={boost}/></td>
							<td>
								<InsertButton index={index} insert={insert} value={{field: '', boost: defaultBoost}}/>
								<RemoveButton index={index} remove={remove} visible={value.fields.length > 1}/>
								<MoveDownButton disabled={index === value.fields.length-1} index={index} swap={swap} visible={value.fields.length > 1}/>
								<MoveUpButton index={index} swap={swap} visible={value.fields.length > 1}/>
							</td>
						</tr>
					})}
			/>
		</Table>
	</>;
	return legend ? <Fieldset legend={legend}>{fragment}</Fieldset> : fragment;
}
