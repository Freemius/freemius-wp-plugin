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
import { useData, useApiGet, useSettings } from '.';

const usePlans = (product_id) => {
	const {
		data: plans,
		isLoading,
		error,
	} = useApiGet(product_id ? `products/${product_id}/pricing.json` : null);

	const { settings, structure } = useSettings('freemius_editor_settings');

	let defaultOptions =
		settings?.plan_id || structure?.properties?.plan_id?.default || null;

	const options = useMemo(() => {
		if (!plans) return [];

		return plans.plans.map((plan) => {
			if (!defaultOptions && !plan.is_hidden) {
				defaultOptions = plan.id;
			}

			return {
				name: plan.title,
				id: parseInt(plan.id),
			};
		});
	}, [plans]);

	return {
		plans: plans?.plans || [],
		options,
		defaultOptions,
		isLoading,
		error,
	};
};

export default usePlans;
