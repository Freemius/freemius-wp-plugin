/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '@wordpress/block-editor';
import { Panel, PanelBody } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */

import EnableCheckbox from '../util/EnableCheckbox';
import { FreemiusContext } from '../context';
import Settings from './Settings';

const Broker = (props) => {
	const { context, attributes, setAttributes } = props;

	const { freemius_enabled, freemius } = attributes;

	const fromParent = useContext(FreemiusContext);

	const isEnabled = fromParent || freemius_enabled;

	return (
		<InspectorControls>
			{isEnabled ? (
				<Settings {...props} />
			) : (
				<Panel>
					<PanelBody title={__('Freemius', 'freemius')} initialOpen={isEnabled}>
						<EnableCheckbox label={__('Enable Scope', 'freemius')} {...props} />
					</PanelBody>
				</Panel>
			)}
		</InspectorControls>
	);
};

export default Broker;
