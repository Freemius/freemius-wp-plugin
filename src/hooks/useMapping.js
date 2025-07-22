/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData, usePlans } from './';
import { CURRENCIES } from '../constants/currencies';

const useMapping = (props) => {
	const { attributes, setAttributes } = props;

	const { freemius_mapping, content } = attributes;

	// defined default options
	const options = {
		prefix: '',
		suffix: '',
		currency_symbol: 'show',
		labels: {
			monthly: __('Monthly', 'freemius'),
			annual: __('Annually', 'freemius'),
			lifetime: __('Lifetime', 'freemius'),
		},
		format_price: true,
		show_currency: true,
		...freemius_mapping,
	};

	const { data, isLoading } = useData();

	const setMapping = (key, value) => {
		setAttributes({
			freemius_mapping: {
				...freemius_mapping,
				[key]:
					typeof value === 'object' && value !== null
						? { ...freemius_mapping?.[key], ...value }
						: value,
			},
		});
	};

	const value = getMappingValue(options);

	const errorMessage = [];

	if (value === undefined) {
		errorMessage.push(
			sprintf(__('No value found for field %s', 'freemius'), options.field)
		);
	}

	if (!data.public_key) {
		errorMessage.push(__('Public key is required', 'freemius'));
	}

	if (!data.product_id) {
		errorMessage.push(__('Product ID is required', 'freemius'));
	}

	if (!data.plan_id) {
		errorMessage.push(__('Plan ID is required', 'freemius'));
	}

	const isError = errorMessage.length > 0;

	return {
		value,
		options,
		setMapping,
		isError,
		errorMessage: errorMessage.join(', '),
	};
};

const getMappingValue = (options) => {
	const { data, isLoading: isDataLoading } = useData();
	const { plans, isLoading: isPlansLoading } = usePlans(data?.product_id);

	const currentPlan = useMemo(() => {
		return plans?.find((plan) => plan.id == data?.plan_id);
	}, [plans, data]);

	const currentPricing = useMemo(() => {
		return currentPlan?.pricing?.find((pricing) => {
			return (
				pricing.currency == data?.currency && pricing.licenses == data?.licenses
			);
		});
	}, [currentPlan, data]);

	const mappingData = useMemo(() => {
		return {
			price: currentPricing?.[data?.billing_cycle + '_price'] || undefined, // Free plan has no pricing
			currency: data?.currency,
			title: currentPlan?.title,
			licenses: currentPricing?.licenses,
			billing_cycle: data?.billing_cycle,
			description: currentPlan?.description,
		};
	}, [currentPricing, currentPlan, data]);

	const newContent = useMemo(() => {
		let content = mappingData[options.field];

		if (typeof content === 'undefined') {
			// plans are loaded, but no pricing found => free plan
			if (isPlansLoading) {
				return undefined;
			}
			content = '0';
		}

		if (options.field === 'price' && !isNaN(content)) {
			const symbol = options.currency_symbol;

			content = new Intl.NumberFormat('en-US', {
				style: symbol !== 'hide' ? 'currency' : 'decimal',
				currency: symbol !== 'hide' ? mappingData.currency : undefined,
				minimumFractionDigits: 0,
			}).format(content);

			// extract the currency symbol
			if (symbol === 'symbol') {
				content = content.replace(/[\d\s.,]/g, '').trim();
			}
		} else if (options.field === 'billing_cycle') {
			content = options.labels[mappingData.billing_cycle];
		}

		content = options.prefix + content + options.suffix;

		return content;
	}, [mappingData, options, isPlansLoading]);

	if (isPlansLoading || isDataLoading) {
		return undefined;
	}

	return newContent;
};

const mapCurrentCurrencySymbol = (content, currency) => {
	const currencySymbol = CURRENCIES[currency]?.symbol;
	const position = CURRENCIES[currency]?.position;

	return position === 'left'
		? currencySymbol + content
		: content + currencySymbol;
};

const formatPrice = (price) => {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(price);
};

export default useMapping;
