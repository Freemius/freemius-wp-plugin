/*
 * nojquery-postmessage by Jeff Lee
 * a non-jQuery fork of jQuery postMessage (Ben Alman, MIT/GPL).
 * http://benalman.com/projects/jquery-postmessage-plugin/
 */

/**
 * @param {string} postName
 * @param {string} receiveName
 * @param {Window} [listenerWindow]
 */
export function createNoJQueryPostMessageTransport(
	postName,
	receiveName,
	listenerWindow = window
) {
	const transport = {};
	let attachListener;
	let detachListener;
	let boundHandler = null;
	let hashPollId = null;
	let lastHash = null;
	let hashCounter = 1;

	if ( listenerWindow.postMessage ) {
		if ( listenerWindow.addEventListener ) {
			attachListener = ( fn ) => {
				listenerWindow.addEventListener( 'message', fn, false );
			};
			detachListener = ( fn ) => {
				listenerWindow.removeEventListener( 'message', fn, false );
			};
		} else {
			attachListener = ( fn ) => {
				listenerWindow.attachEvent( 'onmessage', fn );
			};
			detachListener = ( fn ) => {
				listenerWindow.detachEvent( 'onmessage', fn );
			};
		}
		transport[ postName ] = function (
			message,
			targetOrigin,
			targetWindow
		) {
			if ( ! targetOrigin ) {
				return;
			}
			const origin = targetOrigin.replace( /([^:]+:\/\/[^/]+).*/, '$1' );
			targetWindow.postMessage( message, origin );
		};
		transport[ receiveName ] = function ( handler, originFilter ) {
			if ( boundHandler ) {
				detachListener( boundHandler );
				boundHandler = null;
			}
			if ( ! handler ) {
				return false;
			}
			boundHandler = function ( event ) {
				switch ( Object.prototype.toString.call( originFilter ) ) {
					case '[object String]':
						if ( originFilter !== event.origin ) {
							return false;
						}
						break;
					case '[object Function]':
						if ( originFilter( event.origin ) ) {
							return false;
						}
						break;
				}
				handler( event );
			};
			attachListener( boundHandler );
		};
	} else {
		transport[ postName ] = function (
			message,
			targetOrigin,
			targetWindow
		) {
			if ( ! targetOrigin ) {
				return;
			}
			targetWindow.location =
				targetOrigin.replace( /#.*$/, '' ) +
				'#' +
				+new Date() +
				hashCounter++ +
				'&' +
				message;
		};
		transport[ receiveName ] = function (
			handler,
			originFilter,
			interval
		) {
			if ( hashPollId ) {
				clearInterval( hashPollId );
				hashPollId = null;
			}
			if ( ! handler ) {
				return false;
			}
			let pollMs = 100;
			if ( typeof originFilter === 'number' ) {
				pollMs = originFilter;
			} else if ( typeof interval === 'number' ) {
				pollMs = interval;
			}
			hashPollId = setInterval( function () {
				const hash = listenerWindow.document.location.hash;
				const prefix = /^#?\d+&/;
				if ( hash !== lastHash && prefix.test( hash ) ) {
					lastHash = hash;
					handler( { data: hash.replace( prefix, '' ) } );
				}
			}, pollMs );
		};
	}

	transport.dispose = function () {
		transport[ receiveName ]( null, '' );
		if ( hashPollId ) {
			clearInterval( hashPollId );
			hashPollId = null;
		}
	};

	return transport;
}

/**
 * Parent-side postMessage hub.
 *
 * @param {Window}                         win
 * @param {string}                         baseUrl
 * @param {() => HTMLIFrameElement | null} getIframe
 */
export function createParentPostMessageHub( win, baseUrl, getIframe ) {
	const expectedOrigin = baseUrl.replace( /([^:]+:\/\/[^/]+).*/, '$1' );
	const postman = createNoJQueryPostMessageTransport(
		'postMessage',
		'receiveMessage',
		win
	);

	const callbacks = {};
	let scrollHandler = null;
	let resizeHandler = null;

	function dispatch( event ) {
		const iframeEl = getIframe();
		if ( ! iframeEl || ! iframeEl.contentWindow ) {
			return;
		}
		if ( event.source !== iframeEl.contentWindow ) {
			return;
		}

		try {
			if (
				event &&
				event.data &&
				typeof event.data === 'string' &&
				event.data.charAt( 0 ) === '{'
			) {
				const payload = JSON.parse( event.data );
				const list = callbacks[ payload.type ];
				if ( list ) {
					for ( let i = 0; i < list.length; i++ ) {
						list[ i ]( payload.data, event );
					}
				}
			}
		} catch ( err ) {
			// Ignore malformed messages.
		}
	}

	function post( type, data, iframe ) {
		if ( iframe ) {
			postman.postMessage(
				JSON.stringify( { type, data } ),
				iframe.src,
				iframe.contentWindow
			);
		}
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
			postman.receiveMessage( dispatch, expectedOrigin );
			iframes = iframes || [];
			if ( iframes.length > 0 ) {
				scrollHandler = function () {
					for ( let i = 0; i < iframes.length; i++ ) {
						postScroll( iframes[ i ] );
					}
				};
				resizeHandler = scrollHandler;
				win.addEventListener( 'scroll', scrollHandler );
				win.addEventListener( 'resize', resizeHandler );
			}
		},
		post,
		postScroll,
		receive( type, callback ) {
			if (
				callbacks[ type ] === undefined ||
				callbacks[ type ] === null
			) {
				callbacks[ type ] = [];
			}
			callbacks[ type ].push( callback );
		},
		receiveOnce( type, callback, flush ) {
			if ( flush ) {
				callbacks[ type ] = null;
			}
			if (
				callbacks[ type ] !== undefined &&
				callbacks[ type ] !== null
			) {
				return;
			}
			this.receive( type, callback );
		},
		dispose() {
			if ( scrollHandler ) {
				win.removeEventListener( 'scroll', scrollHandler );
				scrollHandler = null;
			}
			if ( resizeHandler ) {
				win.removeEventListener( 'resize', resizeHandler );
				resizeHandler = null;
			}
			postman.dispose();
			for ( const k of Object.keys( callbacks ) ) {
				callbacks[ k ] = null;
			}
		},
	};
}
