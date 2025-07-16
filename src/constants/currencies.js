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
		position: 'left',
	},
	eur: {
		symbol: '€',
		code: 'EUR',
		name: __('Euro', 'freemius'),
		position: 'left',
	},
	gbp: {
		symbol: '£',
		code: 'GBP',
		name: __('British Pound', 'freemius'),
		position: 'left',
	},
};
