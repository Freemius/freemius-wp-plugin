/**
 * Editor preview height helpers (CSS lengths with multiple units).
 */

/** @type {Array<{ value: string, label: string, default?: number }>} */
export const PREVIEW_HEIGHT_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: 'vh', label: 'vh' },
	{ value: 'vw', label: 'vw' },
	{ value: 'rem', label: 'rem' },
	{ value: 'em', label: 'em' },
	{ value: '%', label: '%' },
];

/** @type {string} */
export const DEFAULT_PREVIEW_HEIGHT = '300px';

/**
 * @param {string | number | null | undefined} value
 * @return {string}
 * @since 0.4.2
 */
export function normalizePreviewHeight( value ) {
	if ( typeof value === 'number' && Number.isFinite( value ) ) {
		return sanitizePreviewHeight( `${ value }px` );
	}

	if ( typeof value === 'string' && value.trim() ) {
		return sanitizePreviewHeight( value );
	}

	return DEFAULT_PREVIEW_HEIGHT;
}

/**
 * @param {string} value
 * @return {string}
 * @since 0.4.2
 */
export function sanitizePreviewHeight( value ) {
	const trimmed = value.trim();
	const match = trimmed.match( /^([\d.]+)\s*(px|vh|vw|rem|em|%)?$/i );

	if ( ! match ) {
		return DEFAULT_PREVIEW_HEIGHT;
	}

	const quantity = parseFloat( match[ 1 ] );
	const unit = ( match[ 2 ] || 'px' ).toLowerCase();

	if ( ! Number.isFinite( quantity ) || quantity <= 0 ) {
		return DEFAULT_PREVIEW_HEIGHT;
	}

	if ( unit === 'px' ) {
		return `${ Math.min( 9000, Math.max( 300, quantity ) ) }px`;
	}

	if ( unit === 'vh' || unit === 'vw' || unit === '%' ) {
		return `${ Math.min( 100, Math.max( 10, quantity ) ) }${ unit }`;
	}

	return `${ Math.min( 200, Math.max( 1, quantity ) ) }${ unit }`;
}

/**
 * @param {string | number | null | undefined} value
 * @return {string | null}
 * @since 0.4.2
 */
export function toPreviewHeightCSSValue( value ) {
	if ( typeof value === 'number' && Number.isFinite( value ) ) {
		return `${ value }px`;
	}

	if ( typeof value === 'string' && value.trim() ) {
		return value.trim();
	}

	return null;
}
