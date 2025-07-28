/**
 * External dependencies
 */

import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { MODIFIERS } from '../../constants';

export default function Label(attributes, { context }) {
	const { type, metadata } = attributes;

	const customName = metadata?.name;

	let returnValue = null;

	if (customName) {
		returnValue = customName;
	} else {
		returnValue =
			MODIFIERS.find((modifier) => modifier.id === type)?.name || null;
	}

	return returnValue;
}
