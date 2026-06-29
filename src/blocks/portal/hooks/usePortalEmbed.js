/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createParentPostMessageHub } from '../lib/post-message';
import { buildPortalUri, sanitizePortalOptions } from '../lib/portal-uri';
import {
	parsePathFromHash,
	tryFixEncoding,
	updateHash,
} from '../lib/portal-hash';
import {
	applyCssToElement,
	createGuid,
	detectFlashingBrowser,
	isRunningInIframe,
	MAX_ZINDEX,
} from '../lib/portal-utils';

/**
 * @param {{
 *   storeId: number,
 *   publicKey: string,
 *   height: number,
 *   baseUrl?: string,
 *   allowInIframe?: boolean,
 *   targetWindow?: Window,
 *   targetDocument?: Document,
 *   containerRef: import('react').RefObject<HTMLElement | null>,
 *   onLoad?: () => void,
 *   onLogin?: (param: unknown) => void,
 *   onLogout?: (param: unknown) => void,
 * }} config
 */
export function usePortalEmbed( {
	storeId,
	publicKey,
	height,
	baseUrl,
	allowInIframe = false,
	targetWindow,
	targetDocument,
	containerRef,
	onLoad,
	onLogin,
	onLogout,
} ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	const iframeRef = useRef( null );
	const hubRef = useRef( null );
	const guidRef = useRef( createGuid() );
	const hashStateRef = useRef( { lastPath: '', hashJustUpdated: false } );
	const hashChangeHandlerRef = useRef( null );
	const callbacksRef = useRef( { onLoad, onLogin, onLogout } );

	callbacksRef.current = { onLoad, onLogin, onLogout };

	useEffect( () => {
		const win = targetWindow || window;
		const doc = targetDocument || win.document;
		const portalBaseUrl = baseUrl || 'https://customers.freemius.com';
		const container = containerRef.current;
		const isFlashingBrowser = detectFlashingBrowser( win );

		if ( ! container || ! storeId || ! publicKey ) {
			return undefined;
		}

		if ( ! allowInIframe && isRunningInIframe( win ) ) {
			setError(
				'Oops... the page cannot load the dashboard when running in an iFrame'
			);
			return undefined;
		}

		setError( null );
		setIsLoading( true );

		const guid = guidRef.current;
		const hashState = hashStateRef.current;
		hashState.lastPath = '';
		hashState.hashJustUpdated = false;

		let iframe = null;
		let hub = null;

		try {
			const options = sanitizePortalOptions( {
				store_id: storeId,
				public_key: publicKey,
				guid,
				css: {
					width: '100%',
					minHeight: height + 'px',
					height: height + 'px',
					position: 'relative',
				},
			} );

			applyCssToElement( container, options.css );

			tryFixEncoding( win );

			const src = buildPortalUri( win, portalBaseUrl, options );

			iframe = doc.createElement( 'iframe' );
			iframe.id = guid;
			iframe.src = src;
			iframe.width = '100%';
			iframe.height = '100%';
			iframe.setAttribute( 'allowtransparency', 'true' );
			iframe.setAttribute( 'frameborder', '0' );
			iframe.title = 'Freemius Customer Portal';
			iframe.style.cssText =
				'z-index: ' +
				MAX_ZINDEX +
				'; background: rgba(0,0,0,0.003); border: 0px none transparent; visibility: ' +
				( isFlashingBrowser ? 'hidden' : 'visible' ) +
				'; margin: 0px; padding: 0; position: absolute; left: 0px; top: 0px; width: 100%; height: 100%; -webkit-tap-highlight-color: transparent; overflow: hidden;';

			container.appendChild( iframe );
			iframeRef.current = iframe;

			hub = createParentPostMessageHub( win, portalBaseUrl, () => iframe );
			hubRef.current = hub;
			hub.init( [ iframe ] );

			hub.receiveOnce( 'forward', function ( data ) {
				win.location = data.url;
			} );

			hub.receiveOnce( 'pathChanged', function ( data ) {
				hashState.hashJustUpdated = updateHash(
					win,
					data.path,
					hashState
				);
			} );

			hub.receiveOnce( 'getLocation', function () {
				hub.post(
					'location',
					{
						href: win.location.href,
						location: win.location.toString(),
						hash: win.location.hash,
					},
					iframe
				);
			} );

			hub.receiveOnce( 'localStorage.setItem', function ( data ) {
				if (
					data.key.length > 3 &&
					data.key.substr( 0, 3 ) === 'fs_'
				) {
					win.localStorage.setItem( data.key, data.value );
				}
			} );

			hub.receiveOnce( 'localStorage.removeItem', function ( key ) {
				if ( key.length > 3 && key.substr( 0, 3 ) === 'fs_' ) {
					win.localStorage.removeItem( key );
				}
			} );

			hub.receiveOnce( 'localStorage.getItem', function ( key ) {
				if ( key.length > 3 && key.substr( 0, 3 ) === 'fs_' ) {
					hub.post(
						'localStorage.getItem',
						{
							key,
							value: win.localStorage.getItem( key ),
						},
						iframe
					);
				}
			} );

			hub.receive( 'height', function ( data ) {
				if ( data && data.height != null && container ) {
					container.style.height = data.height + 'px';
				}
			} );

			const hashChangeHandler = function () {
				if ( hashState.hashJustUpdated ) {
					hashState.hashJustUpdated = false;
					return;
				}

				const newPath = parsePathFromHash( win );

				if ( newPath === hashState.lastPath ) {
					return;
				}

				hub.post( 'pathChanged', { path: newPath }, iframe );
				hashState.lastPath = newPath;
			};

			hashChangeHandlerRef.current = hashChangeHandler;
			win.addEventListener( 'hashchange', hashChangeHandler );

			const addLifecycleListener = ( eventName, callbackKey ) => {
				hub.receiveOnce(
					eventName,
					function ( param ) {
						const callback = callbacksRef.current[ callbackKey ];
						if ( callback ) {
							callback( param );
						}
					},
					true
				);
			};

			hub.receiveOnce(
				'loaded',
				function ( uniqueID ) {
					hub.post( 'handshake', uniqueID, iframe );
					hub.postScroll( iframe );

					if ( isFlashingBrowser && iframe ) {
						iframe.style.visibility = 'visible';
					}

					setIsLoading( false );
					callbacksRef.current.onLoad?.();
				},
				true
			);

			hub.receiveOnce( 'removeScope', function () {
				win.top.location.reload();
			} );

			addLifecycleListener( 'afterLogin', 'onLogin' );
			addLifecycleListener( 'afterLogout', 'onLogout' );
		} catch ( err ) {
			setError( err.message || String( err ) );
			setIsLoading( false );
		}

		return () => {
			if ( hashChangeHandlerRef.current ) {
				win.removeEventListener(
					'hashchange',
					hashChangeHandlerRef.current
				);
				hashChangeHandlerRef.current = null;
			}

			if ( hub ) {
				hub.dispose();
			}
			hubRef.current = null;

			if ( iframe && iframe.parentNode ) {
				iframe.parentNode.removeChild( iframe );
			}
			iframeRef.current = null;

			while ( container.firstChild ) {
				container.removeChild( container.firstChild );
			}
		};
		// Height updates handled separately to avoid iframe reload.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- see above
	}, [
		storeId,
		publicKey,
		baseUrl,
		allowInIframe,
		targetWindow,
		targetDocument,
		containerRef,
	] );

	useEffect( () => {
		const container = containerRef.current?.parentElement;
		if ( ! container ) {
			return;
		}
		applyCssToElement( container, {
			minHeight: height + 'px',
		} );
		applyCssToElement( containerRef.current, {
			minHeight: height + 'px',
			height: height + 'px',
		} );
	}, [ height, containerRef ] );

	return { isLoading, error, iframeRef };
}
