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

import './style.scss';
import { ModifierButtons } from './ModifierButtons';

export default function Save(props) {
	const { attributes, setAttributes, isSelected, scopeData } = props;

	const {
		type,
		options = [],
		labels = {},
		current = '',
		className = '',
	} = attributes;

	const blockProps = useBlockProps.save({
		className: classnames({}, ''),
		'data-wp-interactive': 'freemius/modifier',
		'data-wp-init': 'callbacks.init',
		'data-wp-context': JSON.stringify({
			current: current,
			type: type,
		}),
	});

	if (!type) {
		return null;
	}

	return (
		<div {...blockProps}>
			<ModifierButtons {...props} />
		</div>
	);
}
