/**
 * Portal iframe height helpers (viewport placeholder + clamped auto-resize).
 */

/** @type {number} */
export const PORTAL_MIN_HEIGHT_PX = 400;

/** @type {number} */
export const PORTAL_MAX_HEIGHT_PX = 1200;

/** @type {number} */
export const PORTAL_PLACEHOLDER_MAX_PX = 900;

/** @type {number} */
export const PORTAL_PLACEHOLDER_VH = 0.75;

/** @type {number} */
export const PORTAL_CLAMP_MIN_VH = 0.5;

/** @type {number} */
export const PORTAL_CLAMP_MAX_VH = 0.9;

/** @type {number} */
export const PORTAL_HEIGHT_DEBOUNCE_MS = 100;

/**
 * @param {Window} win
 * @return {number}
 * @since 0.4.2
 */
export function getViewportHeight( win ) {
	return win.innerHeight || win.document.documentElement.clientHeight;
}

/**
 * Initial height before the iframe reports content size.
 *
 * @param {Window} win
 * @return {number}
 * @since 0.4.2
 */
export function getPortalPlaceholderHeight( win ) {
	const viewportHeight = getViewportHeight( win );
	return Math.min(
		Math.max( PORTAL_MIN_HEIGHT_PX, viewportHeight * PORTAL_PLACEHOLDER_VH ),
		PORTAL_PLACEHOLDER_MAX_PX
	);
}

/**
 * Clamp iframe-reported height to a stable viewport-relative range.
 *
 * @param {number} reportedPx
 * @param {Window} win
 * @return {number}
 * @since 0.4.2
 */
export function clampPortalHeight( reportedPx, win ) {
	const viewportHeight = getViewportHeight( win );
	const minHeight = Math.max(
		PORTAL_MIN_HEIGHT_PX,
		viewportHeight * PORTAL_CLAMP_MIN_VH
	);
	const maxHeight = Math.min(
		viewportHeight * PORTAL_CLAMP_MAX_VH,
		PORTAL_MAX_HEIGHT_PX
	);
	return Math.min( maxHeight, Math.max( minHeight, reportedPx ) );
}
