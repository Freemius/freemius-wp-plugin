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
import { useSettings, useMultipleApi } from '.';

const useProducts = () => {
	const {
		settings,
		isLoading: productsIsLoading,
		error: productsError,
		isApiAvailable: productsIsApiAvailable,
	} = useSettings('freemius_products');

	const productIds = settings?.map((product) => product.product_id);

	const response = useMultipleApi(
		productIds.map((id) => {
			return {
				endpoint: `products/${id}.json`,
				options: {},
			};
		})
	);

	let isProductsLoading = true;
	let isProductsError = true;

	const options = useMemo(() => {
		if (!response) return [];

		return Object.values(response).map((product) => {
			const { data, isLoading, error } = product;
			isProductsLoading = isLoading;
			isProductsError = error;
			if (!data) return null;
			return {
				name: data.title,
				id: parseInt(data.id),
			};
		});
	}, [response]);

	const products = useMemo(() => {
		if (!response) return [];

		return Object.values(response).map((product) => {
			const { data, isLoading, error } = product;
			isProductsLoading = isLoading;
			isProductsError = error;
			if (!data) return null;
			return data;
		});
	}, [response]);

	return {
		products: products,
		options,
		isLoading: productsIsLoading || isProductsLoading,
		error: productsError || isProductsError,
		isApiAvailable: productsIsApiAvailable,
	};
};

export default useProducts;
