/**
 * Shared portal embed utilities.
 */

export const DEFAULT_BASE_URL = 'https://customers.freemius.com';

function s4() {
	return Math.floor( ( 1 + Math.random() ) * 0x10000 )
		.toString( 16 )
		.substring( 1 );
}

/**
 * @return {string}
 */
export function createGuid() {
	return (
		s4() +
		s4() +
		'-' +
		s4() +
		'-' +
		s4() +
		'-' +
		s4() +
		'-' +
		s4() +
		s4() +
		s4()
	);
}

/**
 * @param {Window} win
 * @return {boolean}
 */
export function isRunningInIframe( win ) {
	try {
		return win.self !== win.top;
	} catch ( e ) {
		return true;
	}
}

/**
 * @param {Window} win
 * @return {boolean}
 */
export function detectFlashingBrowser( win ) {
	const ua = win.navigator.userAgent.toLowerCase();
	if ( /edge\/|trident\/|msie /.test( ua ) ) return true;

	if ( ua.indexOf( 'safari' ) !== -1 && ua.indexOf( 'chrome' ) === -1 )
		return true;

	return false;
}

/**
 * @param {HTMLElement} el
 * @param {Record<string, string>} css
 */
export function applyCssToElement( el, css ) {
	if ( ! css ) return;

	for ( const prop in css ) {
		if ( ! Object.prototype.hasOwnProperty.call( css, prop ) ) continue;

		const camelProp = prop.replace( /-([a-z])/g, ( g ) =>
			g[ 1 ].toUpperCase()
		);
		el.style[ camelProp ] = css[ prop ];
	}
}
