/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

const Dump = ({ props, title = '', visible = true }) => {
	if (!visible) return null;

	const style = {
		background: '#fff',
		fontSize: '52%',
		position: '_absolute',
		padding: '0.6em',
		border: '1px solid #ddd',
		borderRadius: '3px',
		margin: '0',
	};

	return (
		<pre style={style}>
			{title && <strong>{title}: </strong>} {JSON.stringify(props, null, 2)}
		</pre>
	);
};

export default Dump;
