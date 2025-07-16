/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '@wordpress/block-editor';
import { Panel, PanelBody, Button } from '@wordpress/components';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */

import EnableCheckbox from '../util/EnableCheckbox';
import { FreemiusContext } from '../context';
import Settings from './Settings';
import { useData } from '../hooks';

const Broker = (props) => {
	const { context, attributes, setAttributes } = props;

	const { freemius_enabled, freemius, freemius_modifications } = attributes;

	const { noPricing } = freemius_modifications || {};

	const fromParent = useContext(FreemiusContext);

	const { data, selectScope, DataView, isFree, isInvalid } = useData();

	const isEnabled = fromParent || freemius_enabled;

	console.log('attributes', attributes, props);

	return (
		<InspectorControls>
			<h2>isFree: {isFree ? 'true' : 'false'}</h2>
			<h2>isInvalid: {isInvalid ? 'true' : 'false'}</h2>
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
