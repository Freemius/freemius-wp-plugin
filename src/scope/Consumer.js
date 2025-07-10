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
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData } from '../hooks';

import { FreemiusContext } from '../context';
import { FreemiusIcon } from '../icons';

const Consumer = (props) => {
	const { context, attributes, setAttributes, name } = props;

	const { freemius_mapping, content } = attributes;

	const inContext = useContext(FreemiusContext);

	// not in context, so we don't need to do anything
	if (!inContext) {
		return null;
	}

	const { data, DataView } = useData();

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
				<PanelBody title={__('Freemius Scope', 'freemius')}>
					<DataView />
					<TreeSelect
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={__('Mapping', 'freemius')}
						help={__('Select the mapping for the field', 'freemius')}
						value={freemius_mapping}
						onChange={(value) => {
							setAttributes({
								freemius_mapping: value ? value : undefined,
							});
						}}
						selectedId={freemius_mapping}
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
						]}
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default Consumer;
