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
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EnableCheckbox from '../util/EnableCheckbox';
import { FreemiusContext } from '../context';
import { useSettings, useData } from '../hooks';
import Property from './Property';
import { FreemiusIcon } from '../icons';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const Settings = (props) => {
	const { context, attributes, setAttributes } = props;

	const { freemius_enabled, freemius, freemius_modifications } = attributes;

	const { settings, structure, isLoading } = useSettings('freemius_button');

	const { data, DataView, selectScope } = useData();

	const fromParent = useContext(FreemiusContext);

	const isEnabled = fromParent || freemius_enabled;

	if (isLoading || !structure) {
		return (
			<PanelBody title={__('Freemius', 'freemius')}>
				<Spinner />
			</PanelBody>
		);
	}

	const resetAll = () => {};

	const onChangeHandler = (key, val, defaultValue) => {
		let newValue;

		newValue = { ...freemius };

		if (defaultValue === val || val === '' || val === undefined) {
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
			dropdownMenuProps={{
				popoverProps: {
					placement: 'left-start',
					offset: 259, // the width of the panel with paddings and border
				},
			}}
		>
			<PanelDescription>
				<EnableCheckbox label={__('Enable Scope', 'freemius')} {...props} />
				{freemius_modifications && (
					<Button
						onClick={() => setAttributes({ freemius_modifications: undefined })}
						variant="secondary"
					>
						{__('Reset Modifications', 'freemius')}
					</Button>
				)}
				<Spacer />
			</PanelDescription>
			{freemius_enabled && (
				<>
					<ToolsPanelItem
						className="freemius-button-scope"
						hasValue={() => {
							return true;
						}}
						label={'Reset Scope'}
						isShownByDefault={true}
					>
						<DataView />
					</ToolsPanelItem>
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
				</>
			)}
		</ToolsPanel>
	);
};

export default Settings;
