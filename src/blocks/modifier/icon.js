/**
 * External dependencies
 */

import { __, sprintf } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useModifiers } from '../../hooks';
import { MODIFIERS } from '../../constants';
import FreemiusLogo from '../../icons/Logo';

export default function Icon() {
	return <FreemiusLogo />;

	let returnValue = null;

	if (customName) {
		returnValue = customName;
	} else {
		returnValue =
			MODIFIERS.find((modifier) => modifier.id === type)?.name || null;
	}

	return returnValue;
}
