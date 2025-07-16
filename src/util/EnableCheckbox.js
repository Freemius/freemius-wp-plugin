/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { CheckboxControl, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */

const EnableCheckbox = (props) => {
	const { label, attributes, setAttributes } = props;

	const { freemius_enabled, freemius_modifications, freemius, metadata } =
		attributes;

	const setEnabled = (val) => {
		const blockName = metadata?.name || '';
		const suffix = `(${__('FS Scope', 'freemius')})`;
		const cleanName = blockName.replace(suffix, '');
		const newName = cleanName + (val ? ' ' + suffix : '');

		setAttributes({
			freemius_enabled: val,
			metadata: {
				...metadata,
				name: newName ? newName.trim() : undefined,
			},
		});

		if (!val) {
			setAttributes({
				freemius_modifications: undefined,
				freemius: undefined,
			});
		}
	};

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={label}
			help={__('Scopes will pass down settings to child blocks.', 'freemius')}
			checked={freemius_enabled || false}
			onChange={setEnabled}
		/>
	);

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={label}
			checked={freemius_enabled || false}
			onChange={setEnabled}
		/>
	);
};

export default EnableCheckbox;
