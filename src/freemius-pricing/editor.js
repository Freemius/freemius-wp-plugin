/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { registerBlockExtension } from '@10up/block-components';

import { InspectorControls, BlockControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const BlockEdit = (props) => {
	const { attributes, setAttributes } = props;

	const { freemius_enabled, freemius } = attributes;

	return <InspectorControls>asdas</InspectorControls>;
};

const generateClassName = (attributes) => {
	const { freemius_enabled } = attributes;
	if (!freemius_enabled) return '';
	return 'has-freemius-pricing';
};

registerBlockExtension(['core/group'], {
	extensionName: 'freemius-pricing',
	attributes: {
		freemius_enabled: {
			type: 'boolean',
			default: false,
		},
		freemius: {
			type: 'object',
		},
	},
	classNameGenerator: generateClassName,
	inlineStyleGenerator: () => null,
	Edit: BlockEdit,
});
