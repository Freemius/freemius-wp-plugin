/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

import {
	Button,
	__experimentalSpacer as Spacer,
	BaseControl,
	ToggleControl,
	Flex,
	FlexBlock,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData } from '../hooks';
import MappingSettings from './MappingSettings';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const ButtonSettings = (props) => {
	const { context, attributes, setAttributes, name } = props;

	const { freemius_enabled, freemius, freemius_modifications } = attributes;

	const [preview, setPreview] = useState(false);
	const [live, setLive] = useState(false);
	const [FS, setFS] = useState();
	const [handler, setHandler] = useState();
	const [isLoading, setLoading] = useState(false);

	const { data, isLoading: isLoadingData } = useData();

	const getDocument = () => {
		const iframe = document.querySelector('iframe[name="editor-canvas"]');
		if (!iframe) {
			return document;
		}
		return iframe.contentDocument;
	};
	const getWindow = () => {
		const iframe = document.querySelector('iframe[name="editor-canvas"]');
		if (!iframe) {
			return window;
		}
		return iframe.contentWindow;
	};

	// load script in the iframe so the popup is displayed within the iframe
	useEffect(() => {
		const iframeDoc = getDocument();
		const s = iframeDoc.createElement('script');
		s.type = 'text/javascript';
		s.src = 'https://checkout.freemius.com/js/v1/';
		s.onload = () => setFS(getWindow().FS);

		iframeDoc.body.appendChild(s);
	}, []);

	useEffect(() => {
		if (!preview) return;
		if (!live) return;
		if (isLoadingData) return;

		const t = setTimeout(() => {
			closeCheckout();
			openCheckout();
		}, 850); // 850ms is the time it takes for the preview to load

		return () => {
			clearTimeout(t);
		};
	}, [isLoadingData, freemius]);

	const closeCheckout = () => {
		if (!handler) return;

		handler && handler.close();
		handler && handler.destroy();

		const iframeDoc = getDocument();

		// close doesn't seem to work in an iframe :()
		iframeDoc.getElementById('fs-checkout-page-' + handler.guid)?.remove();
		iframeDoc.getElementById('fs-loader-' + handler.guid)?.remove();
		iframeDoc.getElementById('fs-exit-intent-' + handler.guid)?.remove();
		iframeDoc.querySelector('div[data-testid]')?.remove();

		//remove class from the body
		document.body.classList.remove('freemius-checkout-preview');

		setPreview(false);
	};

	const openCheckout = () => {
		// build arguments starting from scope and current button
		const merged = { ...data, ...freemius };

		const { product_id } = merged;
		if (!product_id) {
			setLoading(false);
			alert(__('Please fill in product_id', 'freemius'));
			return;
		}

		// do not modify the original object
		const data_copy = { ...merged };

		// add class to the body
		document.body.classList.add('freemius-checkout-preview');

		const handler = new FS.Checkout({
			product_id: product_id,
			//public_key: public_key,
		});

		// close the preview if cancel is clicked
		data_copy.cancel = function () {
			setPreview(false);
			setLoading(false);
			if (merged.cancel) {
				new Function(merged.cancel).apply(this);
			}
		};

		if (merged.purchaseCompleted) {
			data_copy.purchaseCompleted = function (data) {
				new Function('data', merged.purchaseCompleted).apply(this, [data]);
			};
		}
		if (merged.success) {
			data_copy.success = function (data) {
				new Function('data', merged.success).apply(this, [data]);
			};
		}

		// store a flag to check if popup is loaded successfully
		let popup_success = false;

		data_copy.track = function (event, data) {
			if (event === 'load') {
				popup_success = true;
				setLoading(false);
			}

			if (merged.track) {
				new Function('event', 'data', merged.track).apply(this, [event, data]);
			}
		};

		handler.open(data_copy);

		//loader is finished
		handler.checkoutPopup.checkoutIFrame.iFrame.onload = () => {
			if (popup_success) return;

			createNotice(
				'warning',
				__(
					'Freemius Checkout is not available with your current settings!',
					'freemius'
				),
				{
					id: 'freemius-checkout-not-available',
					isDismissible: true,
				}
			);

			closeCheckout();
			setLoading(false);
			setPreview(false);
		};

		setHandler(handler);
		setPreview(true);
		setLoading(true);
	};

	return (
		<>
			<PanelDescription>
				<BaseControl
					__nextHasNoMarginBottom
					help={__(
						'Auto update the checkout when properties are changed.',
						'freemius'
					)}
				>
					<Flex>
						<FlexBlock>
							<Button
								__next40pxDefaultSize
								onClick={() => {
									//setPreview(!preview);
									if (!preview) {
										openCheckout();
									} else {
										closeCheckout();
									}
								}}
								icon={'visibility'}
								isBusy={isLoading || isLoadingData}
								disabled={isLoading || isLoadingData}
								isPressed={preview}
								variant="secondary"
							>
								{__('Preview', 'freemius')}
							</Button>
						</FlexBlock>
						<FlexBlock>
							<ToggleControl
								__nextHasNoMarginBottom
								label={__('Auto Refresh', 'freemius')}
								checked={live}
								onChange={(val) => setLive(!live)}
							/>
						</FlexBlock>
					</Flex>
				</BaseControl>
				<MappingSettings {...props} />
			</PanelDescription>
		</>
	);
};

export default ButtonSettings;
