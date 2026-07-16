/**
 * Portal iframe URI helpers.
 */

import { parsePathFromHash } from './portal-hash';

function encodeURIComponentFs( mixed ) {
	if ( mixed === null ) return 'null';

	if ( mixed === true ) return '1';

	if ( mixed === false ) return '0';

	return encodeURIComponent( mixed )
		.replace( /!/g, '%21' )
		.replace( /'/g, '%27' )
		.replace( /\(/g, '%28' )
		.replace( /\)/g, '%29' )
		.replace( /\*/g, '%2A' )
		.replace( /%20/g, '+' );
}

function httpBuildQuery( object ) {
	let query = '';
	for ( const key in object ) {
		if ( ! Object.prototype.hasOwnProperty.call( object, key ) ) continue;

		if ( typeof object[ key ] === 'function' ) continue;

		if ( typeof object[ key ] === 'object' && object[ key ] !== null )
			continue;

		query += '&' + key + '=' + encodeURIComponentFs( object[ key ] );
	}
	if ( query.length > 0 ) query = query.substr( 1 );

	return query;
}

function parseQuerystring( url ) {
	const queryPosition = url.indexOf( '?' );
	if ( queryPosition < 0 ) return {};

	const query = url.substring( queryPosition + 1 );
	const vars = query.split( '&' );
	const queryObject = {};
	for ( let i = 0; i < vars.length; i++ )
		try {
			const pair = vars[ i ].split( '=' );
			queryObject[ decodeURIComponent( pair[ 0 ] ) ] = decodeURIComponent(
				pair[ 1 ]
			);
		} catch ( _e ) {
			// Ignore malformed pairs.
		}

	return queryObject;
}

const PRESERVED_PARAMS = [
	'public_key',
	'email',
	'developer_id',
	'impersonation_token',
	'user_id',
	'token',
];

/**
 * Build the hosted dashboard iframe URL.
 *
 * @param {Window} win
 * @param {string} baseUrl
 * @param {Object} options
 * @return {string}
 */
export function buildPortalUri( win, baseUrl, options ) {
	let uri = baseUrl;

	if ( options.store_id ) uri += '/store/' + options.store_id;
	else if ( options.product_id ) uri += '/product/' + options.product_id;
	else if ( options.plugin_id ) uri += '/plugin/' + options.plugin_id;
	else if ( options.theme_id ) uri += '/theme/' + options.theme_id;

	const path = parsePathFromHash( win );
	if ( path !== '' ) uri += '/' + path;

	const querystring = {};
	const parentQueryObject = parseQuerystring( win.location.search );

	for ( let i = 0; i < PRESERVED_PARAMS.length; i++ ) {
		const param = PRESERVED_PARAMS[ i ];
		if ( options[ param ] ) querystring[ param ] = options[ param ];
		else if ( parentQueryObject[ param ] )
			querystring[ param ] = parentQueryObject[ param ];
	}

	uri +=
		( uri.indexOf( '?' ) >= 0 ? '&' : '?' ) + httpBuildQuery( querystring );

	return uri;
}

/**
 * @param {Object} options
 * @return {Object}
 */
export function sanitizePortalOptions( options ) {
	const merged = { ...options };

	if (
		merged.store_id == null &&
		merged.product_id == null &&
		merged.plugin_id == null &&
		merged.theme_id == null
	)
		throw new Error(
			'Running the app in an iframe requires setting up a store or a product scope.'
		);

	if ( merged.public_key == null )
		throw new Error(
			"You must set the public key of the app's scope object."
		);

	return merged;
}
