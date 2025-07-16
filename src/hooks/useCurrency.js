/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useApiGet, useSettings } from '.';
import { CURRENCIES } from '../constants';

const useCurrency = (product_id) => {
	const {
		data: availableCurrencies,
		isLoading,
		error,
	} = useApiGet(
		product_id ? `products/${product_id}/plans/currencies.json` : null
	);

	const { settings, structure } = useSettings('freemius_button');

	const defaultOptions =
		settings?.currency || structure?.properties?.currency?.default || null;

	const currencies = useMemo(() => {
		return Object.fromEntries(
			Object.entries(CURRENCIES).filter(([key]) =>
				(availableCurrencies?.currencies || ['usd']).includes(key)
			)
		);
	}, [availableCurrencies?.currencies]);

	const options = useMemo(() => {
		return Object.entries(currencies).map(([key, currency]) => ({
			name: currency.name,
			id: key,
		}));
	}, [currencies]);

	return {
		currencies,
		options,
		defaultOptions,
		isLoading,
		error,
	};
};

export default useCurrency;
