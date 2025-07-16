/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMapping } from '../hooks';

const MappedBlockEdit = (props) => {
	const { BlockEdit, attributes, setAttributes, clientId, name } = props;

	const { value } = useMapping(props);

	useEffect(() => {
		if (typeof value === 'undefined') {
			return;
		}

		// buttons need a different property name
		const property = name === 'core/button' ? 'text' : 'content';

		if (attributes?.[property]?.toString() !== value) {
			setAttributes({
				[property]: value,
			});
		}
	}, [value]);

	return <BlockEdit key="edit" {...props} />;
};

export default MappedBlockEdit;
