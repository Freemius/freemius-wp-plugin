/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */

export const CURRENCIES = {
	usd: {
		symbol: '$',
		code: 'USD',
		name: __('US Dollar', 'freemius'),
	},
	eur: {
		symbol: '€',
		code: 'EUR',
		name: __('Euro', 'freemius'),
	},
	gbp: {
		symbol: '£',
		code: 'GBP',
		name: __('British Pound', 'freemius'),
	},
};
