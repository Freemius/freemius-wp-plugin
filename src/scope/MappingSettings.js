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

	const { options, isLoading, setMapping, isError, errorMessage } =
		useMapping(props);

	const inContext = useContext(FreemiusContext);

	const { DataView } = useData();

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
			{options.field ? (
				<h2>
					{__(
						'This Block is enabled for mapping. It uses the data from a Freemius enabled parent block.',
						'freemius'
					)}
				</h2>
			) : (
				<h2>{__('This Block can be used for mapping.', 'freemius')}</h2>
			)}

			<Spacer />
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
						help={__('Select which field you like to map.', 'freemius')}
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
									label={__('Currency Symbol', 'freemius')}
									help={__(
										'Select how you want to display the price',
										'freemius'
									)}
									onChange={(value) => {
										setMapping('currency_symbol', value);
									}}
									value={options.currency_symbol}
									options={[
										{
											label: __('With Currency Symbol', 'freemius'),
											value: 'show',
										},
										{
											label: __('Without Currency Symbol', 'freemius'),
											value: 'hide',
										},
										{
											label: __('Currency Symbol Only', 'freemius'),
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
				<hr />
			</>
		</>
	);
};

export default MappingSettings;
