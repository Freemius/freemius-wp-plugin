/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PortalEmbed from './components/PortalEmbed';

domReady( () => {
	const portals = document.querySelectorAll(
		'.wp-block-freemius-portal[data-freemius-portal]'
	);

	if ( portals.length === 0 ) return;

	Array.prototype.forEach.call( portals, ( portalEl ) => {
		let data;
		try {
			data = JSON.parse(
				portalEl.getAttribute( 'data-freemius-portal' ) || '{}'
			);
		} catch ( err ) {
			console.error(
				'Freemius portal: invalid data-freemius-portal',
				err
			);
			return;
		}

		const storeId = data.store_id;
		const publicKey = data.public_key;

		if ( ! storeId || ! publicKey ) return;

		const mount = document.createElement( 'div' );
		mount.className = 'freemius-portal-mount';
		portalEl.appendChild( mount );

		const root = createRoot( mount );
		root.render(
			<PortalEmbed storeId={ storeId } publicKey={ publicKey } />
		);
	} );
} );
