/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSettings } from '.';

const useBillingCycle = (product_id) => {
	const isLoading = false;
	const error = null;

	const { settings, structure } = useSettings('freemius_editor_settings');

	const defaultOptions =
		settings?.billing_cycle ||
		structure?.properties?.billing_cycle?.default ||
		null;

	const options = useMemo(() => {
		return [
			{
				name: __('Monthly', 'freemius'),
				id: 'monthly',
			},
			{
				name: __('Annual', 'freemius'),
				id: 'annual',
			},
			{
				name: __('Lifetime', 'freemius'),
				id: 'lifetime',
			},
		];
	}, []);

	return {
		options,
		defaultOptions,
		isLoading,
		error,
	};
};

export default useBillingCycle;
