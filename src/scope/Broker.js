/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

import Settings from './Settings';

const Broker = (props) => {
	return (
		<InspectorControls>
			<Settings {...props} />
		</InspectorControls>
	);
};

export default Broker;
