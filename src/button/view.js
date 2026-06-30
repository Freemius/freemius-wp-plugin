/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { getScopeData } from '../utils/scope';

domReady( () => {
	const buttons = document.querySelectorAll(
		'.wp-block-button.has-freemius-scope'
	);

	Array.prototype.forEach.call( buttons, ( button ) => {
		const button_el = button.querySelector( '.wp-element-button' );

		button_el &&
			button_el.addEventListener( 'click', ( e ) => {
				e.preventDefault();
				const scopeData = getScopeData( button );

				const { product_id } = scopeData;
				if ( ! product_id ) {
					console.error( 'Please fill in product_id' );
					return;
				}

				const freemius_copy = { ...scopeData };

				const handler = new FS.Checkout( { product_id } );

				if ( scopeData.cancel )
					freemius_copy.cancel = function () {
						new Function( scopeData.cancel ).apply( this );
					};

				if ( scopeData.purchaseCompleted )
					freemius_copy.purchaseCompleted = function ( data ) {
						new Function(
							'data',
							scopeData.purchaseCompleted
						).apply( this, [ data ] );
					};

				if ( scopeData.success )
					freemius_copy.success = function ( data ) {
						new Function( 'data', scopeData.success ).apply( this, [
							data,
						] );
					};

				if ( scopeData.track )
					freemius_copy.track = function ( event, data ) {
						new Function( 'event', 'data', scopeData.track ).apply(
							this,
							[ event, data ]
						);
					};

				handler.open( freemius_copy );
			} );
	} );
} );
