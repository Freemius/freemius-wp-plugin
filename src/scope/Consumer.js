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
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData } from '../hooks';

import { FreemiusContext } from '../context';
import { FreemiusIcon } from '../icons';
import { useApiGet, useMultipleApi, useMapping } from '../hooks';

const Consumer = (props) => {
	const { context, attributes, setAttributes, name } = props;

	const { content } = attributes;

	const {
		field,
		prefix,
		suffix,
		show_currency,
		setMapping,
		isPrice,
		isError,
		errorMessage,
	} = useMapping(props);

	const inContext = useContext(FreemiusContext);

	// not in context, so we don't need to do anything
	if (!inContext) {
		return null;
	}
	const { data, DataView, selectScope } = useData();

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
					{isError ? (
						<Notice status="error" isDismissible={false}>
							{errorMessage}
						</Notice>
					) : (
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
									selectedId={field}
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
							{isPrice && (
								<BaseControl __nextHasNoMarginBottom>
									<ToggleControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={__('Show Currency', 'freemius')}
										help={__('Show the currency in the block', 'freemius')}
										onChange={(value) => {
											setMapping('show_currency', value);
										}}
										checked={show_currency}
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
									value={prefix}
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
									value={suffix}
								/>
							</BaseControl>
						</>
					)}
				</PanelBody>
			</InspectorControls>
		</>
	);
};

function UserProfile() {
	const { data, DataView } = useData();

	const product_id = data?.product_id;

	console.log(product_id);

	// const {
	// 	data: plans,
	// 	isLoading,
	// 	error,
	// } = useApiGet(`plugins/${product_id}/plans.json`);

	const apis = useMultipleApi({
		//plans: { endpoint: `plugins/${product_id}/plans.json` },
		//xxx: { endpoint: `plugins/${product_id}.json` },
		pricing: { endpoint: `products/${product_id}/pricing.json` },
		//plugins: { endpoint: `plugins.json` },
	});
	console.log(apis);

	if (!product_id) {
		return null;
	}

	return;
	try {
		const x = useApiGet('users/me');

		console.log(x);

		return <>asd</>;
	} catch (error) {
		console.log(error);
	}

	if (isLoading) return <Spinner />;
	if (error) return <Notice status="error">{error.message}</Notice>;

	return <h2>Welcome, {user.email}!</h2>;
}

export default Consumer;
