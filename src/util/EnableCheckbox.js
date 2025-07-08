/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */

const EnableCheckbox = (props) => {
	const { label, attributes, setAttributes } = props;

	const { freemius_enabled } = attributes;

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={label}
			checked={freemius_enabled}
			onChange={(val) => setAttributes({ freemius_enabled: val })}
		/>
	);
};

export default EnableCheckbox;
