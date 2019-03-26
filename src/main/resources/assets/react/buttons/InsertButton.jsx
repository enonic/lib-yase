import {connect, getIn} from 'formik';
import {Button} from './Button';
import {Icon} from '../icons/Icon';
//import {toStr} from '../utils/toStr';


const myInsert = (array, index, value) => {
	const copy = [...(array || [])];
	copy.splice(index, 0, value);
	return copy;
};


export const InsertButton = connect(({
	formik: {
		setFieldValue,
		values
	},
	index,
	insert,
	path,
	text = '',
	value,
	currentValue = values && path && getIn(values, path),
	...rest
}) => {
	//console.debug(toStr({component: 'InsertButton', path, text, currentValue, value}));
	const nextIndex = index+1;

	return <Button
		className={text ? '' : 'icon'}
		onClick={() => (path && currentValue)
			? setFieldValue(path, myInsert(currentValue, nextIndex, value))
			: insert(nextIndex, value)
		}
		{...rest}
	><Icon className='green plus'/>{text}</Button>;
});
