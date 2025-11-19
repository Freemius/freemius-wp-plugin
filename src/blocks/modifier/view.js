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
 * Get the mapping content based on the mapping type and data
 *
 * @param {Object} scopeData - The scope data
 * @param {Object} mappingData - The mapping data
 * @returns {string} The mapping content
 */
function getMappingContent(scopeData, mappingData) {
	const allMatrix = document.querySelectorAll('.freemius-matrix-data');

	let matrix = JSON.parse(allMatrix[0].textContent);

	for (const m of allMatrix) {
		if (m.dataset.freemiusProductId == scopeData.product_id) {
			matrix = JSON.parse(m.textContent);
			break;
		}
	}

	// get the default plan if not defined in the scope data
	const plan_id =
		scopeData.plan_id ??
		Object.values(matrix).find((plan) => plan.pricing !== null)?.id;

	const sd = {
		currency: 'usd',
		licenses: '1',
		billing_cycle: 'annual',
		plan_id: plan_id,
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
		case 'licenses':
			content = md.labels?.[sd.licenses] ?? sd.licenses;
			break;
		case 'price':
			content =
				matrix[sd.plan_id]?.pricing?.[sd.currency]?.[sd.billing_cycle]?.[
					sd.licenses || 'unlimited'
				] ?? 0;

			// it's an invalid plan
			if (!content && matrix[sd.plan_id]?.pricing !== null) {
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

			// get the option id from the event target or the context
			const optionId =
				event.target.tagName === 'SELECT'
					? JSON.parse(event.target.selectedOptions[0]?.dataset?.wpContext)
							?.optionId
					: context.optionId;

			// Update the current value
			context.current = optionId;

			// get the scope data and update it with the changes
			const scope = event.target.closest('[data-freemius-scope]');

			const scopeData = JSON.parse(scope?.dataset?.freemiusScope || '{}');
			const newScopeData = {
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
					mapping.querySelector('.wp-element-button').innerHTML =
						mappingContent;
				} else {
					mapping.innerHTML = mappingContent;
				}
			});

			const modifierContainer = event.target.closest(
				'[data-freemius-modifier-type]'
			);

			const buttons = modifierContainer.querySelectorAll('[data-wp-on--click]');
			buttons.forEach((button) => {
				const buttonOptionId = button.dataset.optionId;
				if (buttonOptionId == optionId) {
					button.classList.add('is-active');
				} else {
					button.classList.remove('is-active');
				}
			});

			//modifierContainer.querySelector('select').value = optionId;
		},
	},
	callbacks: {
		init: (event) => {
			const ctx = getContext();
			const { ref } = getElement();
		},
	},
});

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
		const globalScope = document.querySelector('.freemius-global-scope-data');

		if (!globalScope) {
			return data;
		}
		const globalScopeData = JSON.parse(globalScope.textContent);

		return { ...globalScopeData, ...data };
	}
}
