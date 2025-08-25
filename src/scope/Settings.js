/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

import {
	__experimentalToolsPanel as ToolsPanel,
	Spinner,
	PanelBody,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
	__experimentalSpacer as Spacer,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import EnableCheckbox from './EnableCheckbox';
import { useSettings, useData, usePlans } from '../hooks';
import Property from './Property';
import ButtonSettings from './ButtonSettings';
import { useEffect } from '@wordpress/element';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const Settings = (props) => {
	const { attributes, setAttributes, name } = props;

	const { freemius_enabled, freemius, freemius_modifications } = attributes;

	const { structure, isLoading } = useSettings('freemius_defaults');

	const { data, DataView, errorMessage } = useData();

	if (isLoading || !structure) {
		return (
			<PanelBody title={__('Freemius', 'freemius')}>
				<Spinner />
			</PanelBody>
		);
	}

	const resetAll = () => {
		setAttributes({ freemius: undefined });
	};

	const onChangeHandler = (key, val, defaultValue) => {
		let newValue = { ...freemius };

		if (defaultValue === val || val === undefined) {
			delete newValue[key];
		} else {
			newValue[key] = val;
		}

		//if empty, set to undefined
		if (Object.keys(newValue).length === 0) {
			newValue = undefined;
		}

		setAttributes({ freemius: newValue });
	};

	const getValueFor = (key) => {
		return freemius?.[key];
	};

	const getPlaceholderFor = (key) => {
		return data?.[key] || getValueFor(key);
	};

	return (
		<ToolsPanel
			className={'freemius-button-scope-settings'}
			resetAll={() => resetAll()}
			label={__('Freemius', 'freemius')}
			shouldRenderPlaceholderItems={true}
			dropdownMenuProps={{
				popoverProps: {
					placement: 'left-start',
					offset: 259, // the width of the panel with paddings and border
				},
			}}
		>
			<PanelDescription>
				<DataView />
				<EnableCheckbox
					label={
						props.name == 'core/button'
							? __('Enable Freemius Checkout', 'freemius')
							: __('Enable Freemius', 'freemius')
					}
					help={
						props.name == 'core/button'
							? __(
									'Open a Freemius Checkout when the button is clicked.',
									'freemius'
							  )
							: __('Enable Freemius for this area.', 'freemius')
					}
					{...props}
				/>
				{freemius_modifications && (
					<Button
						onClick={() => setAttributes({ freemius_modifications: undefined })}
						variant="secondary"
					>
						{__('Reset Modifications', 'freemius')}
					</Button>
				)}
				<Spacer />
				{errorMessage && (
					<Notice status="error" isDismissible={false}>
						{errorMessage}
					</Notice>
				)}
			</PanelDescription>

			{freemius_enabled && (
				<>
					{name == 'core/button' && <ButtonSettings {...props} />}
					{Object.entries(structure.properties).map(([key, item]) => {
						const value = getValueFor(key);
						const placeholder = getPlaceholderFor(key);

						// do not show deprecated fields if they are not set
						if (item.isDeprecated && !value) {
							return null;
						}
						return (
							<Property
								key={key}
								label={item.label || key}
								options={item.options}
								id={key}
								help={item.description}
								code={item?.code}
								defaultValue={item.default}
								isDeprecated={item.isDeprecated}
								isRequired={item.isRequired}
								value={value}
								placeholder={placeholder}
								type={item.type || 'string'}
								onChange={(val) => onChangeHandler(key, val, item.default)}
							/>
						);
					})}
					<ToolsPanelItem
						className="freemius-button-scope"
						hasValue={() => {
							return true;
						}}
						label={''}
						//onDeselect={() => onChangeHandler(undefined)}
						ShownByDefault={true}
					></ToolsPanelItem>
				</>
			)}
		</ToolsPanel>
	);
};

export default Settings;
