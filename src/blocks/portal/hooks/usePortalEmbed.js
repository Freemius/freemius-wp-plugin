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
	clampPortalHeight,
	getPortalPlaceholderHeight,
	PORTAL_HEIGHT_DEBOUNCE_MS,
} from '../lib/portal-height';
import {
	createGuid,
	detectFlashingBrowser,
	isRunningInIframe,
} from '../lib/portal-utils';

/**
 * @param {HTMLElement | null} el
 * @param {string | number} heightValue
 */
function setPortalHeight( el, heightValue ) {
	if ( ! el ) return;

	let cssValue = null;
	if ( typeof heightValue === 'number' && Number.isFinite( heightValue ) )
		cssValue = heightValue + 'px';
	else if ( typeof heightValue === 'string' && heightValue.trim() )
		cssValue = heightValue.trim();

	if ( ! cssValue ) return;

	el.style.setProperty( '--freemius-portal-height', cssValue );
}

/**
 * @param {HTMLElement | null} container
 * @return {HTMLElement | null}
 */
function getPortalRoot( container ) {
	return container?.closest( '.freemius-portal-root' ) ?? null;
}

/**
 * @param {{
 *   storeId: number,
 *   publicKey: string,
 *   height?: string | number,
 *   autoHeight?: boolean,
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
	autoHeight = true,
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

		if ( ! container || ! storeId || ! publicKey ) return undefined;

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
		let heightDebounceTimer = null;
		let lastReportedHeight = null;
		let viewportResizeHandler = null;

		const applyAutoHeight = ( reportedPx ) => {
			const root = getPortalRoot( container );
			if ( ! root ) return;

			lastReportedHeight = reportedPx;
			setPortalHeight( root, clampPortalHeight( reportedPx, win ) );
		};

		const applyPlaceholderHeight = () => {
			const root = getPortalRoot( container );
			if ( root && autoHeight )
				setPortalHeight( root, getPortalPlaceholderHeight( win ) );
		};

		if ( autoHeight ) {
			applyPlaceholderHeight();
			viewportResizeHandler = function () {
				if ( lastReportedHeight != null )
					applyAutoHeight( lastReportedHeight );
				else applyPlaceholderHeight();
			};
			win.addEventListener( 'resize', viewportResizeHandler );
		}

		try {
			const options = sanitizePortalOptions( {
				store_id: storeId,
				public_key: publicKey,
				guid,
			} );

			tryFixEncoding( win );

			const src = buildPortalUri( win, portalBaseUrl, options );

			iframe = doc.createElement( 'iframe' );
			iframe.id = guid;
			iframe.src = src;
			iframe.className = 'freemius-portal-iframe';
			iframe.setAttribute( 'allowtransparency', 'true' );
			iframe.setAttribute( 'frameborder', '0' );
			iframe.title = 'Freemius Customer Portal';
			if ( isFlashingBrowser )
				iframe.classList.add( 'freemius-portal-iframe--hidden' );

			container.appendChild( iframe );
			iframeRef.current = iframe;

			hub = createParentPostMessageHub(
				win,
				portalBaseUrl,
				() => iframe
			);
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
				if ( data.key.length > 3 && data.key.substr( 0, 3 ) === 'fs_' )
					win.localStorage.setItem( data.key, data.value );
			} );

			hub.receiveOnce( 'localStorage.removeItem', function ( key ) {
				if ( key.length > 3 && key.substr( 0, 3 ) === 'fs_' )
					win.localStorage.removeItem( key );
			} );

			hub.receiveOnce( 'localStorage.getItem', function ( key ) {
				if ( key.length > 3 && key.substr( 0, 3 ) === 'fs_' )
					hub.post(
						'localStorage.getItem',
						{
							key,
							value: win.localStorage.getItem( key ),
						},
						iframe
					);
			} );

			hub.receive( 'height', function ( data ) {
				if (
					! autoHeight ||
					! data ||
					data.height == null ||
					! container
				)
					return;

				const reportedHeight = Number( data.height );
				if ( ! Number.isFinite( reportedHeight ) ) return;

				clearTimeout( heightDebounceTimer );
				heightDebounceTimer = setTimeout( function () {
					applyAutoHeight( reportedHeight );
				}, PORTAL_HEIGHT_DEBOUNCE_MS );
			} );

			const hashChangeHandler = function () {
				if ( hashState.hashJustUpdated ) {
					hashState.hashJustUpdated = false;
					return;
				}

				const newPath = parsePathFromHash( win );

				if ( newPath === hashState.lastPath ) return;

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
						if ( callback ) callback( param );
					},
					true
				);
			};

			hub.receiveOnce(
				'loaded',
				function ( uniqueID ) {
					hub.post( 'handshake', uniqueID, iframe );
					hub.postScroll( iframe );

					if ( isFlashingBrowser && iframe )
						iframe.classList.remove(
							'freemius-portal-iframe--hidden'
						);

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
			clearTimeout( heightDebounceTimer );

			if ( viewportResizeHandler )
				win.removeEventListener( 'resize', viewportResizeHandler );

			if ( hashChangeHandlerRef.current ) {
				win.removeEventListener(
					'hashchange',
					hashChangeHandlerRef.current
				);
				hashChangeHandlerRef.current = null;
			}

			if ( hub ) hub.dispose();

			hubRef.current = null;

			if ( iframe && iframe.parentNode )
				iframe.parentNode.removeChild( iframe );

			iframeRef.current = null;

			while ( container.firstChild )
				container.removeChild( container.firstChild );
		};
		// Height updates handled separately to avoid iframe reload.
	}, [
		storeId,
		publicKey,
		baseUrl,
		allowInIframe,
		targetWindow,
		targetDocument,
		containerRef,
		autoHeight,
	] );

	useEffect( () => {
		if ( autoHeight || height == null ) return;

		setPortalHeight( containerRef.current?.parentElement ?? null, height );
	}, [ autoHeight, height, containerRef ] );

	return { isLoading, error, iframeRef };
}
