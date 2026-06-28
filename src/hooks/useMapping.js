/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData, usePlans, useLicenses, useCoupon } from './';
import {
	applyCouponDiscount,
	couponAppliesToPlan,
	formatMappingPrice,
} from '../util/discountedPrice';

const useMapping = ( props ) => {
	const { attributes, setAttributes } = props;

	const { freemius_mapping } = attributes;

	const { data, isLoading } = useData();

	const { licenses, isLoading: isLicensesLoading } = useLicenses(
		data?.product_id
	);

	const needsCoupon = freemius_mapping?.field === 'discounted_price';

	const {
		coupon,
		isLoading: isCouponLoading,
		isError: isCouponError,
		notFound: isCouponNotFound,
	} = useCoupon(
		needsCoupon ? data?.product_id : null,
		needsCoupon ? data?.coupon : null
	);

	const defaultLabels = useMemo( () => {
		return {
			licenses: licenses.reduce( ( acc, license ) => {
				const key = license || 0; // 0 is unlimited
				acc[ key ] = license || __( 'Unlimited', 'freemius' );
				return acc;
			}, {} ),
			billing_cycle: {
				monthly: __( 'Monthly', 'freemius' ),
				annual: __( 'Annually', 'freemius' ),
				lifetime: __( 'Lifetime', 'freemius' ),
			},
		};
	}, [ licenses ] );

	// defined default options
	const options = {
		prefix: '',
		suffix: '',
		currency_symbol: 'show',
		format_price: true,
		show_currency: true,
		labels: defaultLabels[ freemius_mapping?.field ] || {},
		...freemius_mapping,
	};

	const setMapping = ( key, value ) => {
		const newMapping = {
			freemius_mapping: {
				...freemius_mapping,
				[ key ]:
					typeof value === 'object' && value !== null
						? { ...freemius_mapping?.[ key ], ...value }
						: value,
			},
		};
		// update labels when field is changed
		if ( key === 'field' )
			newMapping.freemius_mapping.labels =
				defaultLabels[ value ] || undefined;

		setAttributes( newMapping );
	};

	const couponContext = useMemo(
		() => ( {
			coupon,
			isCouponLoading,
			isCouponError,
			isCouponNotFound,
		} ),
		[ coupon, isCouponLoading, isCouponError, isCouponNotFound ]
	);

	const value = getMappingValue( options, couponContext );

	const errorMessage = [];

	if ( options.field === 'discounted_price' )
		if ( ! data?.coupon )
			errorMessage.push(
				__( 'Coupon is required in scope settings', 'freemius' )
			);
		else if ( isCouponError || isCouponNotFound )
			errorMessage.push( __( 'Coupon not found', 'freemius' ) );
		else if ( coupon && ! couponAppliesToPlan( coupon, data?.plan_id ) )
			errorMessage.push(
				__( 'Coupon does not apply to this plan', 'freemius' )
			);

	if ( value === undefined && errorMessage.length === 0 )
		errorMessage.push(
			sprintf(
				__( 'No value found for field %s', 'freemius' ),
				options.field
			)
		);

	const isError =
		! isLoading &&
		! isLicensesLoading &&
		! isCouponLoading &&
		errorMessage.length > 0;

	return {
		value,
		options,
		setMapping,
		defaultLabels,
		isLoading: isLicensesLoading || isLoading || isCouponLoading,
		isError,
		errorMessage: errorMessage.join( ', ' ),
	};
};

const getMappingValue = ( options, couponContext = {} ) => {
	const { data, isLoading: isDataLoading } = useData();
	const { plans, isLoading: isPlansLoading } = usePlans( data?.product_id );
	const { coupon, isCouponLoading, isCouponError, isCouponNotFound } =
		couponContext;

	const currentPlan = useMemo( () => {
		return plans?.find( ( plan ) => plan.id == data?.plan_id );
	}, [ plans, data ] );

	const currentPricing = useMemo( () => {
		return currentPlan?.pricing?.find( ( pricing ) => {
			return (
				pricing.currency == data?.currency &&
				pricing.licenses == data?.licenses
			);
		} );
	}, [ currentPlan, data ] );

	const currency =
		data?.currency && data?.currency !== 'auto' ? data?.currency : 'usd';

	const mappingData = useMemo( () => {
		const basePrice =
			currentPricing?.[ data?.billing_cycle + '_price' ] || undefined;

		let discountedPrice;

		if (
			options.field === 'discounted_price' &&
			basePrice !== undefined &&
			coupon &&
			couponAppliesToPlan( coupon, data?.plan_id )
		)
			discountedPrice = applyCouponDiscount( basePrice, coupon, {
				currency,
			} );

		return {
			price: basePrice,
			discounted_price: discountedPrice,
			currency,
			title: currentPlan?.title || null,
			licenses:
				currentPricing?.licenses === null
					? 0
					: currentPricing?.licenses,
			billing_cycle: data?.billing_cycle,
			description: currentPlan?.description || null,
		};
	}, [ currentPricing, currentPlan, data, options.field, coupon, currency ] );

	const newContent = useMemo( () => {
		if ( options.field === 'discounted_price' ) {
			if ( ! data?.coupon ) return undefined;

			if (
				isCouponLoading ||
				isCouponError ||
				isCouponNotFound ||
				( coupon && ! couponAppliesToPlan( coupon, data?.plan_id ) )
			)
				return undefined;
		}

		let content = mappingData[ options.field ];

		if ( typeof content === 'undefined' ) {
			// plans are loaded, but no pricing found => free plan
			if ( isPlansLoading ) return undefined;

			if ( options.field === 'discounted_price' ) return undefined;

			content = '0';
		}

		if (
			( options.field === 'price' ||
				options.field === 'discounted_price' ) &&
			! isNaN( content )
		)
			content = formatMappingPrice( content, {
				currency: mappingData.currency,
				currency_symbol: options.currency_symbol,
			} );
		else if ( options.field === 'billing_cycle' )
			content =
				options.labels[ mappingData.billing_cycle ] ??
				mappingData.billing_cycle;
		else if ( options.field === 'licenses' )
			content =
				options.labels[ mappingData.licenses || data.licenses || 0 ];
		// 0 is unlimited
		else if ( content === null )
			// description could be null
			content = '';

		content = options.prefix + content + options.suffix;

		return content;
	}, [
		mappingData,
		options,
		isPlansLoading,
		data,
		coupon,
		isCouponLoading,
		isCouponError,
		isCouponNotFound,
	] );

	if ( isPlansLoading || isDataLoading || isCouponLoading ) return undefined;

	return newContent;
};

export default useMapping;
