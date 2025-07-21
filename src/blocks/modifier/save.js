/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ModifierButtons } from './ModifierButtons';

import './style.scss';

export default function Save(props) {
	const { attributes, setAttributes, isSelected, scopeData } = props;

	const { type, options } = attributes;

	const blockProps = useBlockProps.save({
		className: classnames({}, ''),
	});

	return (
		<div {...blockProps}>
			<ModifierButtons {...props} />
		</div>
	);
}
