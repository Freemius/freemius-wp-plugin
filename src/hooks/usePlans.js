/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useApiGet, useSettings } from '.';

const usePlans = (product_id) => {
	const {
		data: plans,
		isLoading,
		error,
		isApiAvailable,
		refetch,
	} = useApiGet(product_id ? `products/${product_id}/pricing.json` : null);

	// force refetch when product_id changes
	useEffect(() => {
		if (product_id) {
			refetch();
		}
	}, [product_id]);

	const { settings, structure } = useSettings('freemius_defaults');

	let defaultOptions =
		settings?.plan_id || structure?.properties?.plan_id?.default || null;

	const options = useMemo(() => {
		if (!plans) return [];

		const options = plans.plans.map((plan) => {
			if (!defaultOptions && !plan.is_hidden) {
				defaultOptions = plan.id;
			}

			return {
				name: plan.title,
				id: parseInt(plan.id),
			};
		});

		return options;
	}, [plans]);

	return {
		plans: plans?.plans || [],
		refetch,
		options,
		defaultOptions,
		isLoading,
		error,
		isApiAvailable,
	};
};

export default usePlans;
