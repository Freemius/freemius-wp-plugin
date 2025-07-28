/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */

const EnableCheckbox = (props) => {
	const { label, help, attributes, setAttributes } = props;

	const { freemius_enabled, metadata } = attributes;

	const setEnabled = (val) => {
		const blockName = metadata?.name || '';
		const suffix = `(Freemius)`;
		const cleanName = blockName.replace(/\(.*\)$/, '');
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
			help={help}
			checked={freemius_enabled || false}
			onChange={setEnabled}
		/>
	);
};

export default EnableCheckbox;
