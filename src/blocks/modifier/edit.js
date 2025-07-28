/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

import { useEffect, useRef } from '@wordpress/element';

import {
	Button,
	PanelBody,
	Notice,
	TreeSelect,
	BaseControl,
	ToggleControl,
	TextControl,
	Flex,
	FlexItem,
	FlexBlock,
	Spinner,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

import './editor.scss';

import { useData, useModifiers } from '../../hooks';
import { ModifierButtons } from './ModifierButtons';

export default function Edit(props) {
	const { attributes, setAttributes, isSelected, scopeData } = props;

	const { type, options, disabled = [], current } = attributes;

	const { data, isLoading, DataView, selectScope } = useData(scopeData);

	const {
		options: allOptions,
		isLoading: isLoadingModifiers,
		modifiers,
	} = useModifiers(type);

	useEffect(() => {
		if (isLoading || isLoadingModifiers) return;

		const enabled = allOptions.filter(
			(option) => !disabled.includes(option.id)
		);

		if (JSON.stringify(options) !== JSON.stringify(enabled)) {
			setAttributes({ options: enabled });
		}
	}, [options, allOptions, isLoading, isLoadingModifiers, disabled]);

	const isInScope = !!scopeData;

	const {
		attributes: scopeAttributes = {},
		setAttributes: setScopeAttributes = () => {},
	} = scopeData;

	// for some reason this only returns the global scope data
	// const context = useContext(FreemiusContext);

	// that's why we use out custom scopeData
	const context = { ...data, ...scopeData?.freemius };

	// need this for local comparison
	const contextWithModifications = {
		...context,
		...scopeAttributes?.freemius_modifications,
	};

	useEffect(() => {
		if (
			isLoading ||
			isLoadingModifiers ||
			contextWithModifications[type] === undefined
		)
			return;
		const newCurrent = contextWithModifications[type].toString();

		if (current !== newCurrent) {
			setAttributes({ current: newCurrent });
		}
	}, [contextWithModifications[type], isLoading, isLoadingModifiers]);

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

	const blockProps = useBlockProps({
		style: {},
		className: classnames({
			'freemius-scope-missing': !isInScope && !type,
		}),
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Freemius', 'freemius')}>
					{!isInScope && (
						<Notice status="warning" isDismissible={false}>
							{__(
								'A scope is missing for this modifier. Please enable Freemius in a parent group block.',
								'freemius'
							)}
						</Notice>
					)}
					{isInScope && (
						<>
							<BaseControl __nextHasNoMarginBottom>
								<DataView />
								<h2>
									{__(
										'This is a modifier, which allows you to change the properties of the next parent scope.',
										'freemius'
									)}
								</h2>
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
										setAttributes({
											type: value ? value : undefined,
											disabled: undefined,
											labels: undefined,
										});
									}}
									selectedId={type}
									noOptionLabel={__('Choose a type', 'freemius')}
									tree={modifiers}
								/>
							</BaseControl>

							{type && allOptions.length > 0 && (
								<BaseControl
									__nextHasNoMarginBottom
									label={__('Options', 'freemius')}
									help={__(
										'Disable options to hide them from the user',
										'freemius'
									)}
								>
									<ModifierToggles {...props} options={allOptions} />
								</BaseControl>
							)}
						</>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				{isLoading || isLoadingModifiers ? (
					<Spinner />
				) : (
					<ModifierButtons
						{...props}
						onChange={(value) => {
							changeScope(type, value);
						}}
					/>
				)}
			</div>
		</>
	);
}

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
