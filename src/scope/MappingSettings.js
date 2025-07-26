/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

import {
	TreeSelect,
	Notice,
	BaseControl,
	TextControl,
	Button,
	SelectControl,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData } from '../hooks';

import { FreemiusContext } from '../context';
import { useMapping } from '../hooks';

const MappingSettings = (props) => {
	const { attributes } = props;

	const { freemius_mapping } = attributes;

	const {
		options,
		isLoading,
		setMapping,
		setLabels,
		isError,
		errorMessage,
		value,
	} = useMapping(props);

	const inContext = useContext(FreemiusContext);

	const { data, selectScope, DataView, isFree, isInvalid, isApiAvailable } =
		useData();

	useEffect(() => {
		if (isLoading) {
			return;
		}

		// make sure the labels made it to the frontend
		if (options.field === 'billing_cycle' && !freemius_mapping?.labels) {
			setMapping('labels', options.labels);
		}
		if (options.field === 'licenses' && !freemius_mapping?.labels) {
			setMapping('labels', options.labels);
		}
	}, [options.labels, options.field, isLoading, freemius_mapping]);

	// not in context, so we don't need to do anything
	if (!inContext) {
		return null;
	}

	return (
		<>
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
			{!isApiAvailable && (
				<>
					<Notice status="warning" isDismissible={false}>
						{__(
							'Freemius API is not configured. Please add your API token in the Freemius settings.',
							'freemius'
						)}
					</Notice>
					<Spacer />
				</>
			)}
			{isError && (
				<>
					<Notice status="error" isDismissible={false}>
						{errorMessage}
					</Notice>
					<Spacer />

					<Button
						variant="secondary"
						href={`admin.php?page=freemius-settings#defaults`}
					>
						{__('Update your Settings', 'freemius')}
					</Button>
					<Spacer />
				</>
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
						{options.field === 'billing_cycle' && (
							<BaseControl __nextHasNoMarginBottom>
								{Object.entries(options.labels).map(([key, value], i) => (
									<TextControl
										key={i}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={sprintf(__('Label for %s', 'freemius'), key)}
										value={value}
										onChange={(value) => {
											setMapping('labels', {
												...options.labels,
												[key]: value,
											});
										}}
									/>
								))}
							</BaseControl>
						)}
						{options.field === 'licenses' && (
							<BaseControl __nextHasNoMarginBottom>
								{Object.entries(options.labels).map(([key, value], i) => (
									<TextControl
										key={i}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={sprintf(__('Label for %s', 'freemius'), key)}
										value={value}
										onChange={(value) => {
											setMapping('labels', {
												...options.labels,
												[key]: value,
											});
										}}
									/>
								))}
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
		</>
	);
};

export default MappingSettings;
