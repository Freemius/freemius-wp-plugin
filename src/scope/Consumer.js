/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToolbarGroup,
	TreeSelect,
	ToolbarButton,
	Spinner,
	Notice,
	BaseControl,
	TextControl,
	ToggleControl,
	Button,
	SelectControl,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData, useModifiers } from '../hooks';

import { FreemiusContext } from '../context';
import { FreemiusIcon } from '../icons';
import { useApiGet, useMultipleApi, useMapping } from '../hooks';

const Consumer = (props) => {
	const { context, attributes, setAttributes, name } = props;

	const { content, invalid } = attributes;

	const { options, setMapping, isError, errorMessage, value } =
		useMapping(props);

	const inContext = useContext(FreemiusContext);

	const { data, selectScope, DataView, isFree, isInvalid } = useData();

	// not in context, so we don't need to do anything
	if (!inContext) {
		return null;
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={<FreemiusIcon />}
						label={__('Freemius', 'freemius')}
						onClick={() => {
							setAttributes({
								content: 'test',
								text: 'test2',
							});
						}}
					></ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={__('Freemius', 'freemius')}>
					<h2>isFree: {isFree ? 'true' : 'false'}</h2>
					<h2>isInvalid: {isInvalid ? 'true' : 'false'}</h2>
					<DataView />
					<Spacer />
					<Button
						onClick={selectScope}
						variant="secondary"
						label={__(
							'Select the scope where these settings are defined.',
							'freemius'
						)}
					>
						{__('Select Scope', 'freemius')}
					</Button>
					<Spacer />
					{isError && (
						<Notice status="error" isDismissible={false}>
							{errorMessage}
						</Notice>
					)}
					<>
						<BaseControl __nextHasNoMarginBottom>
							<TreeSelect
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={__('Mapping', 'freemius')}
								help={__('Select the mapping for the field', 'freemius')}
								onChange={(value) => {
									setMapping('field', value);
								}}
								selectedId={options.field}
								noOptionLabel={__('No mapping', 'freemius')}
								tree={[
									{
										name: __('Price', 'freemius'),
										id: 'price',
									},
									{
										name: __('Title', 'freemius'),
										id: 'title',
									},
									{
										name: __('Licenses', 'freemius'),
										id: 'licenses',
									},
									{
										name: __('Billing Cycle', 'freemius'),
										id: 'billing_cycle',
									},
									{
										name: __('Description', 'freemius'),
										id: 'description',
									},
								]}
							/>
						</BaseControl>

						{options.field && (
							<>
								{options.field === 'price' && (
									<BaseControl __nextHasNoMarginBottom>
										<SelectControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											label={__('Currency', 'freemius')}
											help={__('Select the currency', 'freemius')}
											onChange={(value) => {
												setMapping('currency_symbol', value);
											}}
											value={options.currency_symbol}
											options={[
												{
													label: __('Show Currency', 'freemius'),
													value: 'show',
												},
												{
													label: __('Hide Currency', 'freemius'),
													value: 'hide',
												},
												{
													label: __('Symbol only', 'freemius'),
													value: 'symbol',
												},
											]}
										/>
									</BaseControl>
								)}
								<BaseControl __nextHasNoMarginBottom>
									<TextControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={__('Prefix', 'freemius')}
										help={__('Prefix to add to the field', 'freemius')}
										onChange={(value) => {
											setMapping('prefix', value);
										}}
										value={options.prefix}
									/>
								</BaseControl>
								<BaseControl __nextHasNoMarginBottom>
									<TextControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={__('Suffix', 'freemius')}
										help={__('Suffix to add to the field', 'freemius')}
										onChange={(value) => {
											setMapping('suffix', value);
										}}
										value={options.suffix}
									/>
								</BaseControl>
							</>
						)}
					</>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default Consumer;
