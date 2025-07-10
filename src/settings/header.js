/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Flex, FlexItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FreemiusIcon } from '../icons';
import SaveButton from './SaveButton';

const FreemiusHeader = () => {
	return (
		<Flex className="freemius-header">
			<FreemiusIcon />
			<FlexItem>
				<SaveButton />
			</FlexItem>
		</Flex>
	);
};

export default FreemiusHeader;
