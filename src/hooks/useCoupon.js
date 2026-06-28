/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useApiGet } from './useApi';

/**
 * Fetch coupon metadata for a product by code.
 *
 * @param {number|string|null} productId  Freemius product ID.
 * @param {string|null}        couponCode Coupon code from scope settings.
 * @return {Object} Coupon data and request state.
 */
const useCoupon = ( productId, couponCode ) => {
	const enabled = Boolean( productId && couponCode );

	const { data, isLoading, error, isApiAvailable } = useApiGet(
		enabled ? `products/${ productId }/coupons.json` : null,
		enabled ? { code: couponCode } : {},
		{ enabled }
	);

	const coupon = useMemo( () => {
		if ( ! enabled || ! data?.coupons?.length ) return null;

		return data.coupons[ 0 ];
	}, [ data, enabled ] );

	const notFound = enabled && ! isLoading && ! error && ! coupon;

	return {
		coupon,
		isLoading: enabled && isApiAvailable && isLoading,
		isError: Boolean( error ),
		notFound,
	};
};

export default useCoupon;
