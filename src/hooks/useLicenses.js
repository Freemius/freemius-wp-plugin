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
import { useApiGet, useSettings } from '.';

const useLicenses = (product_id) => {
	const {
		data: plans,
		isLoading,
		error,
	} = useApiGet(product_id ? `products/${product_id}/pricing.json` : null);

	const { settings, structure } = useSettings('freemius_button');

	const defaultOptions =
		settings?.licenses || structure?.properties?.licenses?.default || null;

	const licenses = useMemo(() => {
		let licenses = [];

		if (!plans) return [];

		plans.plans.forEach((plan) => {
			if (!plan.pricing) return;

			plan.pricing.forEach((pricing) => {
				if (licenses.includes(pricing.licenses)) return;
				licenses.push(pricing.licenses);
			});
		});

		return licenses;
	}, [plans]);

	const options = useMemo(() => {
		return licenses.map((option) => {
			return {
				name: option ? option : __('Unlimited', 'freemius'),
				id: option ? option : null,
			};
		});
	}, [licenses]);

	return {
		licenses,
		options,
		defaultOptions,
		isLoading,
		error,
	};
};

export default useLicenses;
