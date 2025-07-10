/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { registerBlockExtension } from '@10up/block-components';
import { createHigherOrderComponent } from '@wordpress/compose';

import { InspectorControls } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { PanelBody } from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */

import './style.scss';
import Broker from './Broker';
import Consumer from './Consumer';
import { FreemiusContext } from '../context';
import { useSettings, useFreemiusPageMeta } from '../hooks';

const SUPPORTED_BROKER_BLOCKS = [
	'core/group',
	'core/columns',
	'core/column',
	'core/buttons',
];

const SUPPORTED_CONSUMER_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/button',
];

/**
 * Broker
 */
registerBlockExtension(SUPPORTED_BROKER_BLOCKS, {
	extensionName: 'freemius-scope',
	attributes: {
		freemius_enabled: {
			type: 'boolean',
			default: false,
		},
		freemius: {
			type: 'object',
		},
	},
	classNameGenerator: (attributes) => {
		const { freemius_enabled } = attributes;
		if (!freemius_enabled) return '';
		return 'has-freemius-scope';
	},
	inlineStyleGenerator: () => null,
	Edit: Broker,
});

/**
 * Consumer
 */
registerBlockExtension(SUPPORTED_CONSUMER_BLOCKS, {
	extensionName: 'freemius-scope-paragraph',
	attributes: {
		freemius_mapping: {
			type: 'string',
		},
	},
	classNameGenerator: () => null,
	inlineStyleGenerator: () => null,
	Edit: Consumer,
});

const freemiusContentProvider = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes, clientId } = props;

		if (SUPPORTED_BROKER_BLOCKS.includes(props.name)) {
			const { freemius_enabled, freemius } = attributes;

			if (!freemius_enabled) {
				return <BlockEdit key="edit" {...props} />;
			}

			const fromParent = useContext(FreemiusContext);

			// pass the clientID of the pricing table
			const clientID = freemius_enabled
				? clientId
				: fromParent
				? fromParent
				: false;

			return (
				<FreemiusContext.Provider
					value={{
						clientID,
						freemius: { ...fromParent?.freemius, ...freemius },
					}}
				>
					<BlockEdit key="edit" {...props} />
				</FreemiusContext.Provider>
			);
		} else if (false && SUPPORTED_CONSUMER_BLOCKS.includes(props.name)) {
		}

		return <BlockEdit key="edit" {...props} />;
	};
}, 'freemiusContentProvider');

addFilter(
	'editor.BlockEdit',
	'freemius/scope/content-provider',
	freemiusContentProvider
);
