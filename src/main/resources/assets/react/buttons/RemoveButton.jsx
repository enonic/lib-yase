export const RemoveButton = ({
	index,
	remove,
	text = '-',
	type,
	visible = true,
	...rest}) => {
	if(!visible) { return null; }
	//console.log(JSON.stringify({index, rest}, null, 4));
	return <button onClick={() => remove(index)} type="button" {...rest}>{text}</button>
};
