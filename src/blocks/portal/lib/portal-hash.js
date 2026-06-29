/**
 * Portal hash routing helpers.
 */

/**
 * @param {Window} win
 * @return {string}
 */
export function parsePathFromHash( win ) {
	const hash = win.location.hash;
	const pathStartsAt = hash.indexOf( '!' );
	return pathStartsAt >= 0
		? hash.substr( pathStartsAt + 1 ).replace( /^\/+|\/+$/g, '' )
		: '';
}

/**
 * @param {Window} win
 * @param {string} path
 * @param {{ lastPath: string }} state
 * @return {boolean}
 */
export function updateHash( win, path, state ) {
	const hash = win.location.hash;
	const pathStartsAt = hash.indexOf( '!' );
	const newHash =
		( pathStartsAt >= 0 ? hash.substr( 0, pathStartsAt ) : '' ) +
		'!' +
		path;

	if ( newHash === win.location.hash ) {
		return false;
	}

	state.lastPath = path;
	win.location.hash = newHash;
	return true;
}

/**
 * @param {Window} win
 */
export function tryFixEncoding( win ) {
	let hash = win.location.hash;

	if ( ! ( hash.indexOf( '!' ) >= 0 ) ) {
		const encodedHashPosition = hash.indexOf( '%21' );
		if ( encodedHashPosition >= 0 ) {
			hash =
				hash.substring( 0, encodedHashPosition ) +
				'!' +
				hash.substr( encodedHashPosition + 3 );
		}
	}

	if ( hash.indexOf( 'reset_token=' ) >= 0 ) {
		const queryStringParts = hash.split( 'reset_token=' );
		if (
			queryStringParts.length === 2 &&
			queryStringParts[ 1 ].indexOf( '?' ) >= 0
		) {
			hash =
				queryStringParts[ 0 ] +
				'reset_token=' +
				encodeURIComponent( queryStringParts[ 1 ] );
		}
	}

	win.location.hash = hash;
}
