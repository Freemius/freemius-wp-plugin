/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FreemiusContext } from '../context';
import MappingSettings from './MappingSettings';

const Consumer = (props) => {
	const { name } = props;

	const inContext = useContext(FreemiusContext);

	// not in context, so we don't need to do anything
	if (!inContext) {
		return null;
	}

	// buttons use their own settings in the Broker component
	if (name === 'core/button') {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={__('Freemius', 'freemius')}>
				<MappingSettings {...props} />
			</PanelBody>
		</InspectorControls>
	);
};

export default Consumer;
