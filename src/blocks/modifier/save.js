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
	const { attributes } = props;

	const { type, current = '' } = attributes;

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
