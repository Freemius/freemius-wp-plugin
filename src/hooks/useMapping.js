/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useData } from './';

const useMapping = (props) => {
	const { attributes, setAttributes } = props;

	const { freemius_mapping } = attributes;

	const isPrice = freemius_mapping?.field === 'price';

	const { data, isLoading } = useData();

	const {
		field = '',
		prefix = '',
		suffix = '',
		show_currency = isPrice,
	} = freemius_mapping || {};

	const setMapping = (key, value) => {
		setAttributes({
			freemius_mapping: {
				...freemius_mapping,
				[key]: value,
			},
		});
	};

	const errorMessage = [];

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

	const is = (check) => {
		return field === check;
	};

	return {
		field,
		prefix,
		suffix,
		show_currency,
		setMapping,
		isPrice,
		isError,
		errorMessage: errorMessage.join(', '),
	};
};

export default useMapping;
