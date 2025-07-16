/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

import { useContext, useEffect, useState, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

import {
	Button,
	PanelBody,
	Notice,
	PanelRow,
	SelectControl,
	TreeSelect,
	BaseControl,
	ToggleControl,
	TextControl,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

import './editor.scss';

import { useData, useCurrency, useModifiers } from '../../hooks';
import { FreemiusContext } from '../../context';

export default function Edit(props) {
	const { attributes, setAttributes, isSelected, scopeData } = props;

	const { type } = attributes;

	const {
		data,
		isLoading,
		DataView,
		selectScope,
		clientId,
		contextData,
		isFree,
		isInvalid,
	} = useData(scopeData);

	const { options, modifiers, currentModifier, defaultOptions } =
		useModifiers(type);

	const isInScope = !!scopeData;

	const {
		attributes: scopeAttributes = {},
		setAttributes: setScopeAttributes = () => {},
	} = scopeData;

	// for some reason this only returns the global scope data
	// const context2 = useContext(FreemiusContext);

	// console.log('context2', context2, 'scopeData', scopeData);

	// that's why we use out custom scopeData
	const context = { ...data, ...scopeData?.freemius };

	// need this for local comparison
	const contextWithModifications = {
		...context,
		...scopeAttributes?.freemius_modifications,
	};

	// unset modification if it's the same as the one from the scope
	const changeScope = (property, value) => {
		let newModifications = { ...scopeAttributes?.freemius_modifications };

		// if the value is the same as the one from the scope, remove the property from the modifications
		if (context[property] === value) {
			delete newModifications[property];
		} else {
			newModifications[property] = value;
		}
		// TODO: Always store the value. Consider not storing the value if it's the same as the one from the scope
		newModifications[property] = value;

		const newScopeModifications = {
			...scopeAttributes?.freemius_modifications,
			...newModifications,
		};

		setScopeAttributes({
			freemius_modifications: newScopeModifications,
		});
	};

	// Store the number of unmounts to avoid multiple unmounts
	const unmountRef = useRef(0);

	// Use ref to store current values to avoid stale closures
	const currentValuesRef = useRef();
	currentValuesRef.current = { scopeAttributes, setScopeAttributes, type };

	// Register this modifier type on mount, unregister on unmount
	useEffect(() => {
		return () => {
			// blocks are unmounted multiple times so count and return action only once
			if (unmountRef.current > 0) {
				const {
					scopeAttributes: currentScopeAttributes,
					setScopeAttributes: currentSetScopeAttributes,
					type: currentType,
				} = currentValuesRef.current;

				let newModifications = {
					...currentScopeAttributes.freemius_modifications,
				};

				// remove the property from the modifications
				delete newModifications[currentType];

				// remove the modifications from the scope attributes
				currentSetScopeAttributes({
					freemius_modifications: newModifications,
				});
			}

			unmountRef.current++;
		};
	}, []);

	// nothing is disabled if type is not set
	useEffect(() => {
		if (!type) {
			setAttributes({ disabled: undefined });
		}
	}, [type]);

	const blockProps = useBlockProps({
		style: {},
		className: classnames('modifier', {
			'scope-missing': !isInScope && !type,
		}),
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Freemius', 'freemius')}>
					{!isInScope && (
						<Notice status="warning" isDismissible={false}>
							{__(
								'A scope is missing for this modifier. Please define a scope in a parent group block.',
								'freemius'
							)}
						</Notice>
					)}
					{isInScope && (
						<>
							<BaseControl __nextHasNoMarginBottom>
								<DataView />
								<Button onClick={() => selectScope()} variant="secondary">
									{__('Select Scope', 'freemius')}
								</Button>
							</BaseControl>
							<BaseControl __nextHasNoMarginBottom>
								<TreeSelect
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={__('Type', 'freemius')}
									help={__('Select the type of modifier', 'freemius')}
									onChange={(value) => {
										setAttributes({ type: value });
									}}
									selectedId={type}
									noOptionLabel={__('Choose a type', 'freemius')}
									tree={modifiers}
								/>
							</BaseControl>

							{type && options.length > 0 && (
								<BaseControl
									__nextHasNoMarginBottom
									label={__('Options', 'freemius')}
									help={__(
										'Disable options to hide them from the user',
										'freemius'
									)}
								>
									<ModifierToggles {...props} options={options} />
								</BaseControl>
							)}
							<pre>{JSON.stringify(attributes, null, 2)}</pre>
							<pre>{JSON.stringify(scopeData, null, 2)}</pre>
						</>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<ModifierButtons
					changeScope={changeScope}
					currentValue={contextWithModifications[type] || defaultOptions}
					{...props}
					options={options}
				/>
			</div>
		</>
	);
}

const ModifierButtons = (props) => {
	const { attributes, changeScope, currentValue, options = [] } = props;

	const {
		modifications,
		type,
		labels = {},
		className = '',
		disabled = [],
	} = attributes;

	const enabled = options.filter((option) => !disabled.includes(option.id));

	if (className.includes('is-style-unstyled')) {
		return null;
	} else if (className.includes('is-style-link')) {
		return enabled.map((option) => (
			<a
				key={option.id}
				href={currentValue == option.id ? '#' : ''}
				onClick={() => changeScope(type, option.id)}
				className={classnames({
					'is-active': currentValue == option.id,
					'wp-block-button__link': false,
				})}
			>
				{labels[option.id] || option.name}
			</a>
		));
	} else {
		// default is button
		return enabled.map((option) => (
			<Button
				key={option.id}
				className={classnames({
					'is-active': currentValue == option.id,
					'wp-block-button__link': false,
				})}
				onClick={() => changeScope(type, option.id)}
				isPressed={currentValue == option.id}
			>
				{labels[option.id] || option.name}
			</Button>
		));
	}

	return null;
};

const ModifierToggles = (props) => {
	const { attributes, setAttributes, options = [] } = props;

	const { modifications, type, disabled = [], labels = {} } = attributes;

	const toggle = (value) => {
		const newDisabled = disabled.includes(value)
			? disabled.filter((id) => id !== value)
			: [...disabled, value];

		setAttributes({
			disabled: newDisabled.length === 0 ? undefined : newDisabled,
		});
	};

	const setLabel = (option, value) => {
		const newLabels = { ...labels };
		if (value === '' || value === option.name) {
			delete newLabels[option.id];
		} else {
			newLabels[option.id] = value;
		}

		if (Object.keys(newLabels).length === 0) {
			setAttributes({ labels: undefined });
		} else {
			setAttributes({ labels: newLabels });
		}
	};

	return options.map((option) => (
		<BaseControl label={option.name} __nextHasNoMarginBottom key={option.id}>
			<Flex>
				<FlexItem>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={!disabled.includes(option.id)}
						onChange={(value) => toggle(option.id)}
					/>
				</FlexItem>
				<FlexBlock>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						value={labels[option.id] || option.name}
						onChange={(value) => setLabel(option, value)}
					/>
				</FlexBlock>
			</Flex>
		</BaseControl>
	));
};
