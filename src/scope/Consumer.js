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
import MappingSettings from './MappingSettings';

const Consumer = (props) => {
	const { context, attributes, setAttributes, name } = props;

	const { content, invalid, freemius_enabled } = attributes;

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

			{/* Buttons use their own settings in the Broker component */}
			{name !== 'core/button' && (
				<>
					<InspectorControls>
						<PanelBody title={__('Freemius', 'freemius')}>
							<MappingSettings {...props} />
						</PanelBody>
					</InspectorControls>
				</>
			)}
		</>
	);
};

export default Consumer;
