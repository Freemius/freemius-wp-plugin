/**
 * Whether a coupon applies to the given plan.
 *
 * @param {Object}      coupon Coupon metadata from the Freemius API.
 * @param {number|null} planId Plan ID from scope data.
 * @return {boolean} True when the coupon applies to the plan.
 */
export function couponAppliesToPlan( coupon, planId ) {
	if ( ! coupon?.plans ) return true;

	const planIds = coupon.plans
		.split( ',' )
		.map( ( id ) => id.trim() )
		.filter( Boolean );

	return planIds.includes( String( planId ) );
}

/**
 * Apply coupon discount to a base price.
 *
 * @param {number}      basePrice List price before discount.
 * @param {Object}      coupon    Coupon metadata from the Freemius API.
 * @param {Object}      options   Options.
 * @param {string}      options.currency Currency code for fixed discounts.
 * @return {number} Discounted price, floored at zero.
 */
export function applyCouponDiscount( basePrice, coupon, { currency } ) {
	const price = Number( basePrice );

	if ( ! coupon || isNaN( price ) ) return price;

	let discounted = price;

	if ( coupon.discount_type === 'percentage' )
		discounted = price * ( 1 - Number( coupon.discount ) / 100 );
	else {
		const currencyKey = currency?.toLowerCase();
		const amount =
			coupon.discounts?.[ currencyKey ] ?? Number( coupon.discount );

		discounted = price - amount;
	}

	return Math.max( 0, discounted );
}

/**
 * Format a numeric price for mapping output.
 *
 * @param {number} value   Numeric price.
 * @param {Object} options Formatting options.
 * @param {string} options.currency        Currency code.
 * @param {string} options.currency_symbol show | hide | symbol.
 * @return {string} Formatted price string.
 */
export function formatMappingPrice( value, { currency, currency_symbol } ) {
	const symbol = currency_symbol ?? 'show';

	let content = new Intl.NumberFormat( 'en-US', {
		style: symbol !== 'hide' ? 'currency' : 'decimal',
		currency: symbol !== 'hide' ? currency : undefined,
		minimumFractionDigits: 0,
	} ).format( value );

	if ( symbol === 'symbol' )
		content = content.replace( /[\d\s.,]/g, '' ).trim();

	return content;
}

/**
 * Read embedded coupon metadata from the page.
 *
 * @param {number|string} productId  Product ID.
 * @param {string}        couponCode Coupon code from scope.
 * @return {Object|null} Coupon metadata or null when not embedded.
 */
export function getCouponData( productId, couponCode ) {
	const nodes = document.querySelectorAll( '.freemius-coupon-data' );

	for ( const node of nodes )
		if (
			node.dataset.freemiusProductId == productId &&
			node.dataset.freemiusCouponCode === couponCode
		)
			return JSON.parse( node.textContent );

	return null;
}
