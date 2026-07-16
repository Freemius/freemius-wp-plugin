/**
 * Compare doc screenshot PNGs before committing updates.
 *
 * Env / CLI:
 *   --force (update-doc-screenshots) — always write captures
 *   SCREENSHOT_COMPARE=0           — same as --force
 *   SCREENSHOT_MIN_DIFF_RATIO      — default skip threshold (default 0.02 = 2%)
 *   capture.minDiffRatio (manifest) — per-image override (0..1); falls back to default
 *   SCREENSHOT_ABORT_RATIO         — abort when diff area exceeds this (default 0.98 = 98%)
 *   SCREENSHOT_COMPARE_TOLERANCE   — per-channel color tolerance for looks-same (default 2)
 *
 * Dimension mismatch always updates (size changes skip pixel compare).
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const require = createRequire( import.meta.url );
const looksSame = require( 'looks-same' );

/**
 * @typedef {'skip' | 'update' | 'abort'} CompareAction
 */

/**
 * @typedef {Object} CompareResult
 * @property {CompareAction} action
 * @property {number} diffRatio Proportion of image area in diff clusters (0..1).
 * @property {string} reason
 */

/**
 * @param {{ left: number, top: number, right: number, bottom: number }} bounds
 */
function boundsArea( bounds ) {
	const width = Math.max( 0, bounds.right - bounds.left );
	const height = Math.max( 0, bounds.bottom - bounds.top );
	return width * height;
}

/**
 * @param {Array<{ left: number, top: number, right: number, bottom: number }>} clusters
 */
function clustersArea( clusters ) {
	if ( ! Array.isArray( clusters ) || clusters.length === 0 ) {
		return 0;
	}

	return clusters.reduce(
		( sum, cluster ) => sum + boundsArea( cluster ),
		0
	);
}

/**
 * @param {string | undefined} value
 * @param {number} fallback
 */
function parseRatio( value, fallback ) {
	const parsed = Number.parseFloat( value ?? '' );
	return Number.isFinite( parsed ) ? parsed : fallback;
}

/**
 * @returns {{ minDiffRatio: number, abortRatio: number, tolerance: number, disabled: boolean }}
 */
export function getScreenshotCompareOptions() {
	return {
		minDiffRatio: parseRatio( process.env.SCREENSHOT_MIN_DIFF_RATIO, 0.02 ),
		abortRatio: parseRatio( process.env.SCREENSHOT_ABORT_RATIO, 0.98 ),
		tolerance: Number.parseInt(
			process.env.SCREENSHOT_COMPARE_TOLERANCE ?? '2',
			10
		),
		disabled: process.env.SCREENSHOT_COMPARE === '0',
	};
}

/**
 * @param {ReturnType<typeof getScreenshotCompareOptions>} baseOptions
 * @param {{ minDiffRatio?: number } | undefined} capture
 * @returns {ReturnType<typeof getScreenshotCompareOptions>}
 */
export function resolveCompareOptionsForCapture( baseOptions, capture ) {
	const entryMinDiffRatio = capture?.minDiffRatio;

	if (
		typeof entryMinDiffRatio !== 'number' ||
		! Number.isFinite( entryMinDiffRatio )
	) {
		return baseOptions;
	}

	return {
		...baseOptions,
		minDiffRatio: entryMinDiffRatio,
	};
}

/**
 * @param {string} baselineAbs Absolute path to committed baseline PNG.
 * @param {string} candidateAbs Absolute path to fresh capture PNG.
 * @param {ReturnType<typeof getScreenshotCompareOptions>} [options]
 * @returns {Promise<CompareResult>}
 */
export async function compareScreenshotFiles(
	baselineAbs,
	candidateAbs,
	options = getScreenshotCompareOptions()
) {
	if ( options.disabled ) {
		return {
			action: 'update',
			diffRatio: 1,
			reason: 'compare disabled',
		};
	}

	if ( ! existsSync( baselineAbs ) ) {
		return {
			action: 'update',
			diffRatio: 1,
			reason: 'no baseline file',
		};
	}

	/** @type {import('pngjs').PNG} */
	let baseline;
	/** @type {import('pngjs').PNG} */
	let candidate;

	try {
		baseline = PNG.sync.read( readFileSync( baselineAbs ) );
		candidate = PNG.sync.read( readFileSync( candidateAbs ) );
	} catch ( error ) {
		return {
			action: 'abort',
			diffRatio: 1,
			reason: `invalid PNG: ${ String( error ) }`,
		};
	}

	if (
		baseline.width !== candidate.width ||
		baseline.height !== candidate.height
	) {
		return {
			action: 'update',
			diffRatio: 1,
			reason: `dimension mismatch (${ baseline.width }×${ baseline.height } vs ${ candidate.width }×${ candidate.height })`,
		};
	}

	const totalPixels = baseline.width * baseline.height;
	const looksSameOptions = {
		strict: false,
		tolerance: options.tolerance,
		antialiasing: true,
		pixelRatio: 0,
	};

	const { equal, diffClusters } = await looksSame(
		baselineAbs,
		candidateAbs,
		looksSameOptions
	);

	if ( equal ) {
		return {
			action: 'skip',
			diffRatio: 0,
			reason: 'images match',
		};
	}

	const diffArea = clustersArea( diffClusters );
	const diffRatio = totalPixels > 0 ? diffArea / totalPixels : 0;

	if ( diffRatio < options.minDiffRatio ) {
		return {
			action: 'skip',
			diffRatio,
			reason: `diff ${ ( diffRatio * 100 ).toFixed( 2 ) }% below ${ (
				options.minDiffRatio * 100
			).toFixed( 2 ) }% threshold`,
		};
	}

	if ( diffRatio > options.abortRatio ) {
		return {
			action: 'abort',
			diffRatio,
			reason: `diff ${ ( diffRatio * 100 ).toFixed( 2 ) }% exceeds ${ (
				options.abortRatio * 100
			).toFixed( 2 ) }% abort threshold`,
		};
	}

	return {
		action: 'update',
		diffRatio,
		reason: `diff ${ ( diffRatio * 100 ).toFixed( 2 ) }%`,
	};
}
