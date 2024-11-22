/**
 * External dependencies
 */
import styled from "@emotion/styled";
/**
 * WordPress dependencies
 */

import { __ } from "@wordpress/i18n";
import { registerBlockExtension, useScript } from "@10up/block-components";

import { InspectorControls, BlockControls } from "@wordpress/block-editor";
import {
	BaseControl,
	SelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
	TextControl,
	CheckboxControl,
	PanelBody,
	ExternalLink,
	Button,
	TextareaControl,
	ToolbarButton,
	ToolbarGroup,
	TabPanel,
	Tip,
} from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import { useState, useEffect, useRef } from "@wordpress/element";
import { useEntityProp } from "@wordpress/core-data";
import { Icon, globe, page, button } from "@wordpress/icons";

/**
 * Internal dependencies
 */

import "./editor.scss";
import { Attributes } from "./attributes";

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const BlockEdit = (props) => {
	const { attributes, setAttributes } = props;

	const { freemius_enabled, freemius } = attributes;

	const status = useScript("https://checkout.freemius.com/checkout.min.js", {
		removeOnUnmount: false,
	});

	const [scope, setScope] = useState("button");
	const postType = useSelect((select) =>
		select("core/editor").getCurrentPostType(),
	);
	const [pageMeta, setPageMeta] = useEntityProp("postType", postType, "meta");
	const [settings, setSettings] = useEntityProp(
		"root",
		"site",
		"freemius_button",
	);
	const schema = freemius_button_schema;

	const resetAll = () => {
		setAttributes({ freemius: undefined });
	};

	const EnableCheckbox = () => (
		<CheckboxControl
			label={__("Open a Freemius Checkout with this button.", "freemius")}
			checked={freemius_enabled}
			onChange={(val) => setAttributes({ freemius_enabled: val })}
		/>
	);

	const previewCheckout = () => {
		const args = {
			...settings,
			...pageMeta.freemius_button,
			...freemius,
		};

		console.log(args);
		const { plugin_id, public_key } = args;
		if (!plugin_id || !public_key) {
			alert("Please fill in plugin_id and public_key");
			return;
		}
		// do not modify the original object
		const args_copy = { ...args };

		// build arguments starting from global, page and button

		const handler = FS.Checkout.configure({
			plugin_id: plugin_id,
			public_key: public_key,
		});

		const errorTimeout = setTimeout(() => {
			alert(
				"Freemius Checkout is not available. It's most likely a settings is wrong.",
			);
			handler.clearOptions();
			handler.close();
		}, 5000);

		if (args.cancel) {
			args_copy.cancel = function () {
				new Function(args.cancel).apply(this);
			};
		}
		if (args.purchaseCompleted) {
			args_copy.purchaseCompleted = function (data) {
				new Function("data", args.purchaseCompleted).apply(this, [data]);
			};
		}
		if (args.success) {
			args_copy.success = function (data) {
				new Function("data", args.success).apply(this, [data]);
			};
		}

		args_copy.track = function (event, data) {
			errorTimeout && clearTimeout(errorTimeout);

			if (args.track) {
				new Function("event", "data", args.track).apply(this, [event, data]);
			}
		};

		handler.open(args_copy);
	};

	const getValueFor = (key, scope) => {
		switch (scope) {
			case "global":
				return settings?.[key];
			case "page":
				return pageMeta?.freemius_button?.[key];
			case "button":
			default:
				return freemius?.[key];
		}
	};

	const getPlaceholderFor = (key, scope) => {
		switch (scope) {
			case "global":
				return "";
			case "page":
				return getValueFor(key, "global") || "";
			case "button":
				return getValueFor(key, "page") || getValueFor(key, "global") || "";
			default:
				return "";
		}
	};

	const onChangeHandler = (scope, key, val) => {
		let newValue;

		switch (scope) {
			case "global":
				newValue = { ...settings };
				break;
			case "page":
				newValue = { ...pageMeta.freemius_button };
				break;
			default:
				newValue = { ...freemius };
		}

		newValue[key] = val;

		// remove entries which are the default value from Attributes

		switch (scope) {
			case "global":
				setSettings(newValue);
				break;
			case "page":
				setPageMeta({ freemius_button: newValue });
				break;
			default:
				setAttributes({ freemius: newValue });
		}
	};

	if (!freemius_enabled) {
		return (
			<InspectorControls>
				<PanelBody title={__("Freemius Button", "freemius")}>
					<EnableCheckbox />
				</PanelBody>
			</InspectorControls>
		);
	}

	const MyTip = (props) => {
		const { scope } = props;
		const { children } = props;
		let text = "";
		let icon = button;
		switch (scope) {
			case "global":
				text = __("Changes will affect the whole site.", "freemius");
				icon = globe;
				break;
			case "page":
				text = __("Changes will affect the whole page.", "freemius");
				icon = page;
				break;
			case "button":
				text = __("Changes will affect only this button.", "freemius");
				icon = button;
				break;
		}

		const className =
			"components-scope-indicator components-scope-indicator-" + scope;

		return (
			<div className={className}>
				<Icon icon={icon} />
				<p>{text}</p>
			</div>
		);
	};

	const scopes = [
		{
			name: "global",
			title: "Global",
		},
		{
			name: "page",
			title: "Page",
		},
		{
			name: "button",
			title: "Button",
		},
	];

	return (
		<InspectorControls>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						label={__("Preview Checkout", "freemius")}
						icon={"visibility"}
						onClick={previewCheckout}
					/>
				</ToolbarGroup>
			</BlockControls>
			<ToolsPanel
				className={"freemius-button-scope-" + scope}
				resetAll={resetAll}
				shouldRenderPlaceholderItems={true}
				label={
					__("Freemius Button", "freemius") +
					" - (" +
					scopes.filter((s) => s.name === scope)[0].title +
					")"
				}
			>
				<PanelDescription>
					<EnableCheckbox />
					<Button
						onClick={previewCheckout}
						icon={"visibility"}
						variant="secondary"
					>
						{__("Preview Checkout", "freemius")}
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
					{(tab) => <MyTip scope={scope} />}
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

						return (
							<FsToolItem
								key={key}
								label={item.label || key}
								options={item.options}
								id={key}
								scope={scope}
								help={item.help}
								isDeprecated={item.isDeprecated}
								isRequired={item.isRequired}
								value={value}
								placeholder={placeholder}
								type={item.type || "string"}
								onChange={onChangeHandlerHelper}
							/>
						);
					})}
				</div>
			</ToolsPanel>

			<ToolsPanel
				label={__("ToolsPanelFreemius Button", "freemius")}
				resetAll={resetAll}
				shouldRenderPlaceholderItems={true}
			>
				<PanelDescription>
					<EnableCheckbox />
					<Button onClick={previewCheckout} variant="secondary">
						{__("Preview Checkout", "freemius")}
					</Button>
				</PanelDescription>
			</ToolsPanel>
		</InspectorControls>
	);
};

const FsToolItem_OLD = (props) => {
	const {
		label,
		id,
		help,
		type,
		options,
		link,
		isDeprecated,
		isRequired,
		attributes,
		setAttributes,
		onChange,
		tab,
	} = props;

	const postType = useSelect((select) =>
		select("core/editor").getCurrentPostType(),
	);

	const [pageMeta, setPageMeta] = useEntityProp("postType", postType, "meta");
	const [settings, setSettings] = useEntityProp(
		"root",
		"site",
		"freemius_button",
	);

	const isGlobal = tab.name === "global";
	const isPage = tab.name === "page";

	const pageArgs = pageMeta?.freemius_button ? pageMeta?.freemius_button : {};
	const siteArgs = settings || {};

	const setOption = (key, values) => {
		let newValue;

		switch (tab.name) {
			case "global":
				newValue = { ...siteArgs };
				break;
			case "page":
				newValue = { ...pageArgs };
				break;
			default:
				newValue = { ...freemius };
		}

		newValue[key] = values;
		if (values === undefined) {
			delete newValue[key];
		}

		if (Object.keys(newValue).length === 0) {
			newValue = {};
		}

		// remove entries which are the default value from Attributes
		// Object.keys(newValue).forEach((key) => {
		// 	if (Attributes[key] === newValue[key]) {
		// 		delete newValue[key];
		// 	}
		// });

		switch (tab.name) {
			case "global":
				setSettings(newValue);
				break;
			case "page":
				setPageMeta({ freemius_button: newValue });
				break;
			default:
				setAttributes({ freemius: newValue });
		}

		//setAttributes({ freemius: { ...attributes.freemius, ...options } });
	};
	let value,
		placeholder,
		overwrite = "";

	const globalValue = siteArgs[id] ? siteArgs[id] : undefined;
	const pageValue = pageMeta["freemius_button"][id];
	const localValue = attributes.freemius[id]
		? attributes.freemius[id]
		: undefined;

	switch (tab.name) {
		case "global":
			value = globalValue;

			break;
		case "page":
			value = pageValue;

			break;
		default:
			value = attributes.freemius[id] ? attributes.freemius[id] : undefined;
	}

	switch (tab.name) {
		case "button":
			if (globalValue !== undefined) {
				placeholder = globalValue + " (global settings)";
			}
			if (pageValue !== undefined) {
				placeholder = pageValue + " (page settings)";
			}
			break;
		case "page":
			if (localValue !== undefined) {
				overwrite = "Overwritten by local settings";
			}
			if (globalValue !== undefined) {
				placeholder = globalValue + " (global settings)";
			}
			break;
		case "global":
			if (pageValue !== undefined) {
				overwrite = "Overwritten by page settings";
			}

			break;
	}

	let type_of = type || typeof Attributes[id];
	if (options) {
		type_of = "array";
	}
	let the_link =
		link ||
		"https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#" +
			id;
	let the_label = label;
	const onChangeHandler = (val) => {
		if (onChange) {
			val = onChange(val);
		}
		setOption(id, val);
	};

	if (isDeprecated) {
		the_label += " (deprecated)";
	}
	if (isRequired) {
		the_label += " (required)";
	}
	the_label += " (tab: " + tab.name + ")";
};

const generateClassName = (attributes) => {
	return "";
	const { plugin_id } = attributes.freemius;
	let string = "";
	if (plugin_id) {
		string += `has-freemius-checkout has-freemius-checkout-${plugin_id}`;
	}
	return string;
};

registerBlockExtension(["core/button"], {
	extensionName: "freemius-form-button",
	attributes: {
		freemius_enabled: {
			type: "boolean",
			default: false,
		},
		freemius: {
			type: "object",
		},
	},
	classNameGenerator: generateClassName,
	inlineStyleGenerator: () => null,
	Edit: BlockEdit,
});

const FsToolItem = (props) => {
	const {
		label,
		id,
		help,
		type,
		options,
		link,
		isDeprecated,
		isRequired,
		placeholder,
		value,
		onChange,
	} = props;

	const overwrite = "";
	let the_label = label;
	const the_link =
		link ||
		"https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#" +
			id;
	const inherited = !!placeholder && value == undefined;

	if (inherited) {
		the_label += " (inherited)";
	} else if (isRequired) {
		the_label += " (required)";
	}
	if (isDeprecated) {
		the_label += " (deprecated)";
	}

	const onChangeHandler = (val) => {
		if (onChange) {
			val = onChange(val);
		}
	};

	return (
		<ToolsPanelItem
			className="freemius-button-scope"
			hasValue={() => !!value}
			label={label}
			onDeselect={() => setOption(id, undefined)}
			isShownByDefault={true}
		>
			<BaseControl help={overwrite}>
				<ExternalLink className="freemius-link" href={the_link} />
				{(() => {
					switch (type) {
						case "boolean":
							return (
								<CheckboxControl
									checked={!!value || false}
									label={the_label}
									help={help}
									indeterminate={!!placeholder && value == undefined}
									onChange={(val) => {
										console.log(val);
										onChangeHandler(val);
									}}
								/>
							);

						case "integer":
						case "number":
							return (
								<NumberControl
									value={value || ""}
									label={the_label}
									help={help}
									placeholder={placeholder ? "[" + placeholder + "]" : ""}
									onChange={onChangeHandler}
								/>
							);

						case "array":
							return (
								<SelectControl
									value={value}
									label={the_label}
									help={help}
									onChange={onChangeHandler}
									options={Object.keys(options).map((key) => {
										const label = options[key];
										return { label: label, value: key };
									})}
								/>
							);
						case "code":
							return (
								<TextareaControl
									value={value || ""}
									label={the_label}
									help={help}
									placeholder={placeholder ? "[" + placeholder + "]" : ""}
									onChange={onChangeHandler}
									rows={value ? 10 : 3}
								/>
							);
						default:
							return (
								<>
									<TextControl
										value={value || ""}
										label={the_label}
										help={help}
										placeholder={placeholder ? "[" + placeholder + "]" : ""}
										onChange={onChangeHandler}
									/>
								</>
							);
					}
				})()}
			</BaseControl>
		</ToolsPanelItem>
	);
};
