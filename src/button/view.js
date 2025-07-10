/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */

domReady(() => {
	const buttons = document.querySelectorAll('.freemius-button-data');

	Array.prototype.forEach.call(buttons, (button, i) => {
		const freemius = JSON.parse(button.textContent);
		const { product_id, public_key } = freemius;
		if (!product_id || !public_key) {
			console.error('Please fill in product_id and public_key');
			return;
		}
		const button_el = button.nextElementSibling.querySelector('a');

		// do not modify the original object
		const freemius_copy = { ...freemius };

		const handler = new FS.Checkout({
			product_id: product_id,
			public_key: public_key,
		});

		if (freemius.cancel) {
			freemius_copy.cancel = function () {
				new Function(freemius.cancel).apply(this);
			};
		}
		if (freemius.purchaseCompleted) {
			freemius_copy.purchaseCompleted = function (data) {
				new Function('data', freemius.purchaseCompleted).apply(this, [data]);
			};
		}
		if (freemius.success) {
			freemius_copy.success = function (data) {
				new Function('data', freemius.success).apply(this, [data]);
			};
		}
		if (freemius.track) {
			freemius_copy.track = function (event, data) {
				new Function('event', 'data', freemius.track).apply(this, [
					event,
					data,
				]);
			};
		}
		button_el.addEventListener('click', (e) => {
			e.preventDefault();
			handler.open(freemius_copy);
		});
	});
});
