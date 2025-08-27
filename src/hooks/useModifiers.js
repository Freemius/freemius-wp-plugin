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
import { MODIFIERS } from '../constants';
import { useCurrency, useBillingCycle, useLicenses, usePlans } from '.';

const useModifiers = (type = null, product_id) => {
	const { options: currencyOptions, isLoading: isCurrencyLoading } =
		useCurrency(product_id);
	const { options: billingCycleOptions, isLoading: isBillingCycleLoading } =
		useBillingCycle(product_id);
	const { options: licensesOptions, isLoading: isLicensesLoading } =
		useLicenses(product_id);
	const { options: plansOptions, isLoading: isPlansLoading } =
		usePlans(product_id);

	// Memoize default options to prevent recreation
	const defaultOptions = useMemo(
		() => [
			{
				name: __('Choose a modifier', 'freemius'),
				id: '',
			},
		],
		[]
	);

	// Calculate options based on type using useMemo instead of multiple useEffect
	const options = useMemo(() => {
		switch (type) {
			case 'currency':
				return currencyOptions || defaultOptions;
			case 'billing_cycle':
				return billingCycleOptions || defaultOptions;
			case 'licenses':
				return licensesOptions || defaultOptions;
			case 'plan_id':
				return plansOptions || defaultOptions;
			default:
				return defaultOptions;
		}
	}, [
		type,
		currencyOptions,
		billingCycleOptions,
		licensesOptions,
		plansOptions,
		defaultOptions,
	]);

	const currentModifier = useMemo(() => {
		return MODIFIERS.find((modifier) => modifier.id === type);
	}, [MODIFIERS, type]);

	return {
		options,
		modifiers: MODIFIERS,
		currentModifier,
		isLoading:
			isCurrencyLoading ||
			isBillingCycleLoading ||
			isLicensesLoading ||
			isPlansLoading,
	};
};

export default useModifiers;
