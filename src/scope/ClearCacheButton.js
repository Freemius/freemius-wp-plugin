/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Tooltip } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { API_STORE } from '../stores';
import { useData, usePlans } from '../hooks';

const ClearCacheButton = ( { size } ) => {
	const { clearServerCache } = useDispatch( API_STORE );
	const { createNotice } = useDispatch( noticesStore );

	const isClearing = useSelect( ( select ) =>
		select( API_STORE ).isLoading( 'cache-clear' )
	);

	const { data } = useData();
	const { refetch } = usePlans( data?.product_id );

	const handleClearCache = async () => {
		try {
			await clearServerCache();
			if ( data?.product_id ) await refetch( true );
			createNotice(
				'success',
				__( 'Cache cleared. Data refreshed.', 'freemius' ),
				{ type: 'snackbar' }
			);
		} catch {
			createNotice( 'error', __( 'Could not clear cache.', 'freemius' ), {
				type: 'snackbar',
			} );
		}
	};

	return (
		<Tooltip
			text={ __(
				'Clear all cached data from the Freemius API. This will refresh the pricing data from the API.',
				'freemius'
			) }
		>
			<Button
				variant="tertiary"
				isDestructive
				size={ size }
				onClick={ handleClearCache }
				isBusy={ isClearing }
				disabled={ isClearing || ! data?.product_id }
			>
				{ __( 'Clear Cache', 'freemius' ) }
			</Button>
		</Tooltip>
	);
};

export default ClearCacheButton;
