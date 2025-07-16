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
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */

import './style.scss';
import Broker from './Broker';
import Consumer from './Consumer';
import { FreemiusContext } from '../context';
import MappedBlockEdit from './MappedBlockEdit';
import Dump from '../util';

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
	extensionName: 'freemius-broker',
	attributes: {
		freemius_enabled: {
			type: 'boolean',
			default: false,
		},
		freemius_modifications: {
			type: 'object',
		},
		freemius: {
			type: 'object',
		},
	},
	classNameGenerator: (attributes) => {
		const { freemius_enabled, freemius_modifications } = attributes;

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
	extensionName: 'freemius-consumer',
	attributes: {
		freemius_mapping: {
			type: 'object',
		},
	},
	classNameGenerator: (attributes) => {
		const { freemius_mapping, freemius_mapping_error, invalid } = attributes;

		if (!freemius_mapping || !freemius_mapping.field) return '';

		let className = 'has-freemius-mapping';
		if (freemius_mapping_error) className += ' has-freemius-mapping-error';

		if (invalid) {
			className += ' has-freemius-no-pricing';
		}

		return className;
	},
	inlineStyleGenerator: () => null,
	Edit: Consumer,
});

const freemiusContentProvider = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		const { attributes, setAttributes, clientId } = props;

		if (SUPPORTED_BROKER_BLOCKS.includes(props.name)) {
			const { freemius_enabled, freemius, freemius_modifications } = attributes;

			if (!freemius_enabled) {
				return <BlockEdit key="edit" {...props} />;
			}

			const parent = useContext(FreemiusContext);

			// pass the clientID of the pricing table
			const clientID = freemius_enabled ? clientId : parent ? parent : false;

			const newFreemius = useMemo(
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
					freemius: newFreemius,
					attributes,
					setAttributes,
				}),
				[clientID, newFreemius, attributes, setAttributes]
			);

			return (
				<FreemiusContext.Provider value={contextValue}>
					<Dump props={contextValue} title="contextValue" visible={false} />
					<Dump props={parent} title="Parent" visible={false} />
					<Dump props={attributes} title="Attributes" visible={false} />
					<Dump props={newFreemius} title="New Freemius" visible={false} />
					<Dump
						props={freemius_modifications}
						title="Freemius Modifications"
						visible={false}
					/>
					<BlockEdit key="edit" {...props} />
				</FreemiusContext.Provider>
			);
		}
		if (SUPPORTED_CONSUMER_BLOCKS.includes(props.name)) {
			const { freemius_mapping } = attributes;

			// no mapping, so just return the block edit
			if (!freemius_mapping || !freemius_mapping.field) {
				return <BlockEdit key="edit" {...props} />;
			}

			return <MappedBlockEdit BlockEdit={BlockEdit} {...props} />;
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
