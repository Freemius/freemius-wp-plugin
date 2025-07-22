/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { registerBlockExtension } from '@10up/block-components';
import { createHigherOrderComponent } from '@wordpress/compose';

import { addFilter } from '@wordpress/hooks';
import { useContext, useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */

import Broker from './Broker';
import Consumer from './Consumer';
import { FreemiusContext } from '../context';
import MappedBlockEdit from './MappedBlockEdit';
import { useData } from '../hooks';

import './style.scss';

const SUPPORTED_BROKER_BLOCKS = [
	'core/group',
	'core/columns',
	'core/column',
	'core/button',
];

const SUPPORTED_CONSUMER_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/button',
];

//TODO: get rid of the registerBlockExtension as it triggers API call on every broker block
/**
 * Broker
 */
registerBlockExtension(SUPPORTED_BROKER_BLOCKS, {
	extensionName: 'freemius-broker',
	attributes: {
		freemius_enabled: {
			type: 'boolean',
			default: false,
		},
		freemius_modifications: {
			type: 'object',
		},
		freemius_invalid: {
			type: 'boolean',
			default: false,
		},
		freemius_matrix: {
			type: 'array',
		},
		freemius: {
			type: 'object',
		},
	},
	classNameGenerator: (attributes) => {
		const { freemius_enabled, freemius_invalid } = attributes;

		if (!freemius_enabled) return '';

		let className = 'has-freemius-scope';
		if (freemius_invalid) className += ' is-freemius-invalid';

		return className;
	},
	inlineStyleGenerator: () => null,
	Edit: Broker,
});

/**
 * Consumer
 */
registerBlockExtension(SUPPORTED_CONSUMER_BLOCKS, {
	extensionName: 'freemius-consumer',
	attributes: {
		freemius_mapping: {
			type: 'object',
		},
	},
	classNameGenerator: (attributes) => {
		const { freemius_mapping, freemius_mapping_error, invalid } = attributes;

		if (!freemius_mapping || !freemius_mapping.field) return '';

		let className =
			'has-freemius-mapping has-freemius-mapping-' + freemius_mapping.field;
		if (freemius_mapping_error) className += ' has-freemius-mapping-error';

		if (invalid) {
			className += ' has-freemius-no-pricing';
		}

		return className;
	},
	inlineStyleGenerator: () => null,
	Edit: Consumer,
});

/**
 * Content provider for broker and consumer blocks
 */
const freemiusContentProvider = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes, clientId } = props;

		if (SUPPORTED_CONSUMER_BLOCKS.includes(props.name)) {
			const { freemius_mapping } = attributes;

			// no mapping, so just return the block edit
			if (!freemius_mapping || !freemius_mapping.field) {
				return <BlockEdit key="edit" {...props} />;
			}

			return <MappedBlockEdit BlockEdit={BlockEdit} {...props} />;
		}
		if (SUPPORTED_BROKER_BLOCKS.includes(props.name)) {
			const {
				freemius_enabled,
				freemius,
				freemius_invalid,
				freemius_modifications,
			} = attributes;

			if (!freemius_enabled) {
				return <BlockEdit key="edit" {...props} />;
			}

			const parent = useContext(FreemiusContext);

			// pass the clientID of the pricing table
			const clientID = freemius_enabled ? clientId : parent ? parent : false;

			const data = useMemo(
				() => ({
					...parent?.freemius, // parent scope
					...freemius, // block scope
					...freemius_modifications, // block scope modifications
				}),
				[parent?.freemius, freemius, freemius_modifications]
			);

			const contextValue = useMemo(
				() => ({
					clientID,
					freemius: data,
					attributes,
					setAttributes,
				}),
				[clientID, data, attributes, setAttributes]
			);

			// pass the context value to the useData hook as we are out of context
			const { isInvalid } = useData(contextValue);

			// set the invalid state to the attributes
			useEffect(() => {
				if (isInvalid != undefined && isInvalid != freemius_invalid) {
					setAttributes({
						freemius_invalid: isInvalid,
					});
				}
			}, [isInvalid]);

			return (
				<FreemiusContext.Provider value={contextValue}>
					<BlockEdit key="edit" {...props} />
				</FreemiusContext.Provider>
			);
		}

		if (props.name === 'freemius/modifier') {
			const scopeData = useContext(FreemiusContext);

			return <BlockEdit key="edit" {...props} scopeData={scopeData} />;
		}

		return <BlockEdit key="edit" {...props} />;
	};
}, 'freemiusContentProvider');

addFilter(
	'editor.BlockEdit',
	'freemius/scope/content-provider',
	freemiusContentProvider
);

/**
 * Add scope and mapping to broker and consumer blocks
 *
 * @param {Object} props - The block props.
 * @param {string} blockType - The block type.
 * @param {Object} attributes - The block attributes.
 * @returns {Object} The updated block props.
 */
function addDataAttributes(props, blockType, attributes) {
	let extraProps = {};

	// mapping
	if (attributes.freemius_mapping && attributes.freemius_mapping.field) {
		extraProps['data-freemius-mapping'] = JSON.stringify(
			attributes.freemius_mapping
		);
	}

	// scope
	if (attributes.freemius_enabled) {
		extraProps['data-freemius-scope'] = JSON.stringify({
			...(attributes.freemius || {}),
			...(attributes.freemius_modifications || {}),
		});
	}

	return {
		...props,
		...extraProps,
	};
}
addFilter(
	'blocks.getSaveContent.extraProps',
	'freemius/scope/add-data-attributes',
	addDataAttributes
);
