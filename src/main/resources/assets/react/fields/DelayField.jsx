import {LabeledField} from '../elements/LabeledField';

export const DelayField = ({path, value = 1000}) =>
	<LabeledField label={`Delay (${path})`} name={path} value={value}/>
