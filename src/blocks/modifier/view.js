/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */

/**
 * Get the scope data from the element and all its ancestors
 *
 * @param {HTMLElement} element - The element to get the scope data from
 * @returns {Object} The scope data
 */
function getScopeData(element) {
	const scope = element.closest('[data-freemius-scope]');
	const data = JSON.parse(scope.dataset.freemiusScope || '{}');

	const parent = scope.parentNode.closest('[data-freemius-scope]');

	if (parent) {
		const parentData = getScopeData(parent);
		return { ...parentData, ...data };
	} else {
		const globalScope = JSON.parse(
			document.querySelector('.freemius-scope-data').textContent
		);
		return { ...globalScope, ...data };
	}
}

/**
 * Get the mapping content based on the mapping type and data
 *
 * @param {Object} scopeData - The scope data
 * @param {Object} mappingData - The mapping data
 * @returns {string} The mapping content
 */
function getMappingContent(scopeData, mappingData) {
	const matrix = JSON.parse(
		document.querySelector('.freemius-matrix-data').textContent
	);

	const sd = {
		currency: 'usd',
		licenses: '1',
		billing_cycle: 'annual',
		...scopeData,
	};

	const md = {
		field: null,
		prefix: '',
		suffix: '',
		currency_symbol: 'show',
		...mappingData,
	};

	let content = '';

	switch (md.field) {
		case 'billing_cycle':
			content = md.labels?.[sd.billing_cycle] ?? sd.billing_cycle;
			break;
		case 'price':
			content =
				matrix[sd.plan_id]?.pricing?.[sd.currency]?.[sd.billing_cycle]?.[
					sd.licenses || 'unlimited'
				] ?? 0;

			// it's an invalid plan
			if (!content && matrix[sd.plan_id]?.pricing?.length === undefined) {
				content = '-';
				break;
			}

			const symbol = md.currency_symbol;

			content = new Intl.NumberFormat('en-US', {
				style: symbol !== 'hide' ? 'currency' : 'decimal',
				currency: symbol !== 'hide' ? sd.currency : undefined,
				minimumFractionDigits: 0,
			}).format(content);

			// extract the currency symbol
			if (symbol === 'symbol') {
				content = content.replace(/[\d\s.,]/g, '').trim();
			}

			break;
		default:
			content = matrix[sd.plan_id]?.[md.field] ?? '';
			break;
	}

	content = md.prefix + content + md.suffix;

	return content;
}

store('freemius/modifier', {
	state: {
		get current() {
			return getContext().current;
		},
	},
	actions: {
		switchModifier: (event) => {
			const context = getContext();
			const { optionId } = context;

			// Update the current value
			context.current = optionId;

			const globalScope = JSON.parse(
				document.querySelector('.freemius-scope-data').textContent
			);

			const modifierContainer = event.target.closest('[data-wp-interactive]');

			// get the scope data and update it with the changes
			const scope = event.target.closest('[data-freemius-scope]');

			const scopeData = JSON.parse(scope?.dataset?.freemiusScope || '{}');
			const newScopeData = {
				...globalScope,
				...scopeData,
				[context.type]: optionId,
			};

			scope.setAttribute('data-freemius-scope', JSON.stringify(newScopeData));

			const mappings = scope.querySelectorAll('.has-freemius-mapping');

			mappings.forEach((mapping) => {
				const scopeData = getScopeData(mapping);

				const mappingData = JSON.parse(mapping.dataset.freemiusMapping || '{}');

				const mappingContent = getMappingContent(scopeData, mappingData);

				if (mapping.classList.contains('wp-block-button')) {
					mapping.querySelector('a').innerHTML = mappingContent;
				} else {
					mapping.innerHTML = mappingContent;
				}
			});

			if (modifierContainer) {
				const buttons = modifierContainer.querySelectorAll(
					'[data-wp-on--click]'
				);
				buttons.forEach((button) => {
					const buttonOptionId = button.dataset.optionId;
					if (buttonOptionId == optionId) {
						button.classList.add('is-active');
					} else {
						button.classList.remove('is-active');
						//button.removeAttribute('href');
					}
				});
			}
		},
	},
	callbacks: {
		init: (event) => {
			const ctx = getContext();
			// This is called by the core/cover blocks inside this block.
			// Adds the element reference to the `slides` array.
			const { ref } = getElement();
		},
	},
});
