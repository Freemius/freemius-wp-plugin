/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Flex,
	FlexItem,
	ExternalLink,
	__experimentalSpacer as Spacer,
	Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FreemiusIcon } from '../icons';
import SaveButton from './SaveButton';

const FreemiusHeader = () => {
	return (
		<Flex className="freemius-header">
			<FreemiusIcon />
			<Flex justify="end" align="center">
				<Button
					href="https://docs.freemius.com/api"
					target="_blank"
					variant="tertiary"
				>
					{__('API Documentation', 'freemius')}
				</Button>
				<Button
					href="https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/"
					target="_blank"
					variant="ter"
				>
					{__('Checkout Documentation', 'freemius')}
				</Button>
				<Button
					href="https://wordpress.org/support/plugin/freemius/"
					target="_blank"
					variant="ter"
				>
					{__('Get Support', 'freemius')}
				</Button>
				<Button
					href="https://github.com/Freemius/freemius-wp-plugin"
					target="_blank"
					variant="ter"
				>
					{__('GitHub Repo', 'freemius')}
				</Button>
				<SaveButton />
			</Flex>
		</Flex>
	);
};

export default FreemiusHeader;
