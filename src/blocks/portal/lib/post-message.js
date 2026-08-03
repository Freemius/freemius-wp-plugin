/**
 * Parent-side postMessage hub for the Freemius customer portal iframe.
 *
 * @param {Window}                         win
 * @param {string}                         baseUrl
 * @param {() => HTMLIFrameElement | null} getIframe
 */
export function createParentPostMessageHub( win, baseUrl, getIframe ) {
	const expectedOrigin = baseUrl.replace( /([^:]+:\/\/[^/]+).*/, '$1' );

	const callbacks = {};
	let messageHandler = null;
	let scrollHandler = null;
	let resizeHandler = null;

	function dispatch( event ) {
		if ( event.origin !== expectedOrigin ) return;

		const iframeEl = getIframe();
		if ( ! iframeEl || ! iframeEl.contentWindow ) return;

		if ( event.source !== iframeEl.contentWindow ) return;

		try {
			if (
				event.data &&
				typeof event.data === 'string' &&
				event.data.charAt( 0 ) === '{'
			) {
				const payload = JSON.parse( event.data );
				const list = callbacks[ payload.type ];
				if ( list )
					for ( let i = 0; i < list.length; i++ )
						list[ i ]( payload.data, event );
			}
		} catch ( _err ) {
			// Ignore malformed messages.
		}
	}

	function post( type, data, iframe ) {
		if ( ! iframe?.contentWindow || ! iframe.src ) return;

		iframe.contentWindow.postMessage(
			JSON.stringify( { type, data } ),
			expectedOrigin
		);
	}

	function postScroll( iframe ) {
		const rect = iframe.getBoundingClientRect();
		const viewportHeight =
			win.innerHeight || win.document.documentElement.clientHeight;
		const visibleTop = Math.max( 0, -rect.top );
		const visibleBottom = Math.min(
			rect.height,
			viewportHeight - rect.top
		);
		const visibleHeight = Math.max( 0, visibleBottom - visibleTop );

		post(
			'scroll',
			{
				top: visibleTop,
				height: visibleHeight,
			},
			iframe
		);
	}

	return {
		init( iframes ) {
			if ( messageHandler )
				win.removeEventListener( 'message', messageHandler );

			messageHandler = dispatch;
			win.addEventListener( 'message', messageHandler );

			iframes = iframes || [];
			if ( iframes.length > 0 ) {
				scrollHandler = function () {
					for ( let i = 0; i < iframes.length; i++ )
						postScroll( iframes[ i ] );
				};
				resizeHandler = scrollHandler;
				win.addEventListener( 'scroll', scrollHandler );
				win.addEventListener( 'resize', resizeHandler );
			}
		},
		post,
		postScroll,
		receive( type, callback ) {
			if ( callbacks[ type ] === undefined || callbacks[ type ] === null )
				callbacks[ type ] = [];

			callbacks[ type ].push( callback );
		},
		receiveOnce( type, callback, flush ) {
			if ( flush ) callbacks[ type ] = null;

			if ( callbacks[ type ] !== undefined && callbacks[ type ] !== null )
				return;

			this.receive( type, callback );
		},
		dispose() {
			if ( messageHandler ) {
				win.removeEventListener( 'message', messageHandler );
				messageHandler = null;
			}
			if ( scrollHandler ) {
				win.removeEventListener( 'scroll', scrollHandler );
				scrollHandler = null;
			}
			if ( resizeHandler ) {
				win.removeEventListener( 'resize', resizeHandler );
				resizeHandler = null;
			}
			for ( const k of Object.keys( callbacks ) ) callbacks[ k ] = null;
		},
	};
}
