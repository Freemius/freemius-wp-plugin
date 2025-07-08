/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { registerBlockExtension } from '@10up/block-components';

import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	CheckboxControl,
	PanelBody,
	Button,
	ToolbarButton,
	ToolbarGroup,
	TabPanel,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { Icon, globe, page, button } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './editor.scss';
import FsToolItem from './fs-tool-item';
import EnableCheckbox from '../util/EnableCheckbox';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const BlockEdit = (props) => {
	const { attributes, setAttributes } = props;

	const { freemius_enabled, freemius } = attributes;

	const [preview, setPreview] = useState(false);
	const [live, setLive] = useState(false);
	const [FS, setFS] = useState();
	const [handler, setHandler] = useState();
	const [isLoading, setLoading] = useState(false);

	const [scope, setScope] = useState('button');
	const postType = useSelect((select) =>
		select('core/editor').getCurrentPostType()
	);
	const [pageMeta, setPageMeta] = useEntityProp('postType', postType, 'meta');
	const [settings, setSettings] = useEntityProp(
		'root',
		'site',
		'freemius_button'
	);

	const schema = freemius_button_schema;

	useEffect(() => {
		if (preview) {
			openCheckout();
		} else {
			closeCheckout();
		}
	}, [preview]);

	const resetAll = (scope) => {
		switch (scope) {
			case 'global':
				setSettings({});
				break;
			case 'page':
				setPageMeta({ freemius_button: {} });
				break;
			default:
				setAttributes({ freemius: undefined });
		}
	};

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

	// load script in the iframe
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

		const t = setTimeout(() => {
			closeCheckout();
			openCheckout();
		}, 850); // 850ms is the time it takes for the preview to load

		return () => clearTimeout(t);
	}, [settings, pageMeta?.freemius_button, freemius, live]);

	const closeCheckout = () => {
		if (!handler) return;

		handler && handler.close();

		const iframeDoc = getDocument();

		// close doesn't seem to work in an iframe :()
		iframeDoc.getElementById('fs-checkout-page-' + handler.guid)?.remove();
		iframeDoc.getElementById('fs-loader-' + handler.guid)?.remove();
		iframeDoc.getElementById('fs-exit-intent-' + handler.guid)?.remove();

		document.body.classList.remove('freemius-checkout-preview');

		setLoading(false);
	};

	const openCheckout = () => {
		// build arguments starting from global, page and button
		const args = {
			...settings,
			...pageMeta?.freemius_button,
			...freemius,
		};

		const { product_id, public_key } = args;
		if (!product_id || !public_key) {
			setLoading(false);
			alert(__('Please fill in product_id and public_key', 'freemius'));
			return;
		}

		// do not modify the original object
		const args_copy = { ...args };

		//add class to the body
		document.body.classList.add('freemius-checkout-preview');

		const handler = new FS.Checkout({
			product_id: product_id,
			public_key: public_key,
		});

		// close the privew if cancel is clicked
		args_copy.cancel = function () {
			setPreview(false);
			if (args.cancel) {
				new Function(args.cancel).apply(this);
			}
		};

		if (args.purchaseCompleted) {
			args_copy.purchaseCompleted = function (data) {
				new Function('data', args.purchaseCompleted).apply(this, [data]);
			};
		}
		if (args.success) {
			args_copy.success = function (data) {
				new Function('data', args.success).apply(this, [data]);
			};
		}

		// store a flag to check if popup is loaded successfully
		let popup_success = false;

		args_copy.track = function (event, data) {
			if (event === 'load') {
				popup_success = true;
			}
			setLoading(false);

			if (args.track) {
				new Function('event', 'data', args.track).apply(this, [event, data]);
			}
		};

		handler.open(args_copy);

		//loader is finished
		handler.checkoutPopup.checkoutIFrame.iFrame.onload = () => {
			if (popup_success) return;

			alert(
				__(
					'Freemius Checkout is not available with your current settings!',
					'freemius'
				)
			);

			setPreview(false);
		};

		setHandler(handler);
		setLoading(true);
	};

	const getValueFor = (key, scope) => {
		switch (scope) {
			case 'global':
				return settings?.[key];
			case 'page':
				return pageMeta?.freemius_button?.[key];
			case 'button':
			default:
				return freemius?.[key];
		}
	};

	const getPlaceholderFor = (key, scope) => {
		switch (scope) {
			case 'global':
				return '';
			case 'page':
				return getValueFor(key, 'global') || '';
			case 'button':
				return getValueFor(key, 'page') || getValueFor(key, 'global') || '';
			default:
				return '';
		}
	};

	const onChangeHandler = (scope, key, val) => {
		let newValue;

		switch (scope) {
			case 'global':
				newValue = { ...settings };
				break;
			case 'page':
				newValue = { ...pageMeta?.freemius_button };
				break;
			default:
				newValue = { ...freemius };
		}

		newValue[key] = val;

		// remove entries which are the default value from Attributes

		switch (scope) {
			case 'global':
				setSettings(newValue);
				break;
			case 'page':
				setPageMeta({ freemius_button: newValue });
				break;
			default:
				setAttributes({ freemius: newValue });
		}
	};

	if (!freemius_enabled) {
		return (
			<InspectorControls>
				<PanelBody title={__('Freemius Button', 'freemius')}>
					<EnableCheckbox
						label={__('Freemius Checkout', 'freemius')}
						{...props}
					/>
				</PanelBody>
			</InspectorControls>
		);
	}

	const ScopeInfo = (props) => {
		const { scope } = props;
		let text = '';
		let icon = button;
		switch (scope) {
			case 'global':
				text = __('Changes will affect the whole site.', 'freemius');
				icon = globe;
				break;
			case 'page':
				text = __('Changes will affect the whole page.', 'freemius');
				icon = page;
				break;
			case 'button':
				text = __('Changes will affect only this button.', 'freemius');
				icon = button;
				break;
		}

		const className =
			'components-scope-indicator components-scope-indicator-' + scope;

		return (
			<div className={className}>
				<Icon icon={icon} />
				<p>{text}</p>
			</div>
		);
	};

	const scopes = [
		{
			name: 'global',
			title: __('Global', 'freemius'),
		},
		{
			name: 'page',
			title: __('Page', 'freemius'),
		},
		{
			name: 'button',
			title: __('Button', 'freemius'),
		},
	];

	return (
		<InspectorControls>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						label={__('Preview Checkout', 'freemius')}
						icon={'visibility'}
						onClick={() => setPreview(true)}
					/>
				</ToolbarGroup>
			</BlockControls>
			<ToolsPanel
				className={'freemius-button-scope-' + scope}
				resetAll={() => resetAll(scope)}
				label={
					__('Freemius Button', 'freemius') +
					' - (' +
					scopes.filter((s) => s.name === scope)[0].title +
					')'
				}
			>
				<PanelDescription>
					<EnableCheckbox
						label={__('Freemius Checkout', 'freemius')}
						{...props}
					/>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={__('Auto Refresh', 'freemius')}
						checked={live}
						onChange={(val) => setLive(!live)}
					/>
					<Button
						onClick={() => setPreview(!preview)}
						icon={'visibility'}
						isBusy={isLoading}
						disabled={isLoading}
						isPressed={preview}
						variant="secondary"
					>
						{preview && !isLoading
							? __('Close Preview', 'freemius')
							: __('Preview Checkout', 'freemius')}
					</Button>
				</PanelDescription>
				<TabPanel
					className="freemius-button-scopes"
					activeClass="active-tab"
					initialTabName="button"
					onSelect={(val) => {
						setScope(val);
					}}
					tabs={scopes}
				>
					{(tab) => <ScopeInfo scope={scope} />}
				</TabPanel>

				<div className="freemius-button-scopes-wrap">
					{Object.keys(schema).map((key) => {
						const item = schema[key];

						const value = getValueFor(key, scope);
						const placeholder = getPlaceholderFor(key, scope);

						const onChangeHandlerHelper = (val) => {
							if (item.default === val) {
								val = undefined;
							}
							onChangeHandler(scope, key, val);
						};

						// do not show deprecated fields if they are not set
						if (item.isDeprecated && !value) {
							return null;
						}

						return (
							<FsToolItem
								key={key}
								label={item.label || key}
								options={item.options}
								id={key}
								scope={scope}
								help={item.help}
								code={item?.code}
								defaultValue={item.default}
								isDeprecated={item.isDeprecated}
								isRequired={item.isRequired}
								value={value}
								placeholder={placeholder}
								type={item.type || 'string'}
								onChange={onChangeHandlerHelper}
							/>
						);
					})}
				</div>
			</ToolsPanel>
		</InspectorControls>
	);
};

const generateClassName = (attributes) => {
	const { freemius_enabled } = attributes;
	if (!freemius_enabled) return '';
	return 'has-freemius-checkout';
};

registerBlockExtension(['core/button'], {
	extensionName: 'freemius-form-button',
	attributes: {
		freemius_enabled: {
			type: 'boolean',
			default: false,
		},
		freemius: {
			type: 'object',
		},
	},
	classNameGenerator: generateClassName,
	inlineStyleGenerator: () => null,
	Edit: BlockEdit,
});
