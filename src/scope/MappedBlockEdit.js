/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData, useApiGet, useMapping } from '../hooks';

const MappedBlockEdit = (props) => {
	const { BlockEdit, attributes, setAttributes, clientId } = props;

	const { content, freemius_mapping_error } = attributes;
	const { data } = useData();

	const { field, prefix, suffix, show_currency, setMapping } =
		useMapping(props);

	const {
		product_id,
		currency = 'usd',
		licenses = 1,
		billing_cycle = 'annual',
	} = data;

	const {
		data: plans,
		isLoading,
		error,
	} = useApiGet(product_id ? `products/${product_id}/pricing.json` : null);

	useEffect(() => {
		if (!product_id) return;
		if (!plans) return;
		if (!data) return;

		// get the plan
		const plan = plans.plans.find((plan) => plan.id == data.plan_id); // no strict comparison

		if (!plan) return;

		// get the pricing
		const pricing = plan.pricing?.find(
			(pricing) => pricing.currency == currency && pricing.licenses == licenses
		);

		const mappingData = {
			price: pricing ? pricing?.[billing_cycle + '_price'] : 0, // Free plan has no pricing
			currency: currency,
			title: plan.title,
			licenses: licenses,
			billing_cycle: billing_cycle,
			description: plan.description,
		};

		const currencySymbol = show_currency
			? getCurrentCurrencySymbol(currency)
			: '';

		let newContent = mappingData[field];

		console.log('newContent', newContent);

		if (typeof newContent === 'undefined' || newContent === null) {
			!freemius_mapping_error &&
				setAttributes({
					freemius_mapping_error: true,
				});
			newContent = '';
		} else {
			freemius_mapping_error &&
				setAttributes({
					freemius_mapping_error: false,
				});
		}

		newContent = prefix + currencySymbol + newContent + suffix;

		if (newContent && content.toString() !== newContent) {
			setAttributes({
				content: newContent,
			});
		}
	}, [product_id, plans, data, field]);

	return <BlockEdit key="edit" {...props} />;
};

export default MappedBlockEdit;

const getCurrentCurrencySymbol = (currency) => {
	switch (currency) {
		case 'usd':
			return '$';
		case 'eur':
			return '€';
		case 'gbp':
			return '£';
	}
};
