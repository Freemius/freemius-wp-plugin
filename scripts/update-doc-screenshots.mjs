/**
 * Regenerate documentation screenshots from screenshots/image-manifest.json.
 *
 * Usage:
 *   node scripts/update-doc-screenshots.mjs              # all docs entries with capture
 *   node scripts/update-doc-screenshots.mjs <id>         # single manifest id
 *   npm run update-screenshots -- button-overview
 *   npm run update-screenshots -- --force button-overview
 *
 * Prerequisites:
 * - npx playwright install chromium
 * - Local site at https://dev.local with auto-login; fixture post 428.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';

import {
	compareScreenshotFiles,
	getScreenshotCompareOptions,
	resolveCompareOptionsForCapture,
} from './compare-screenshot.mjs';

const require = createRequire( import.meta.url );

const rootDir = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const manifestPath = resolve( rootDir, 'screenshots/image-manifest.json' );
const syncScreenshotsDocsScript = resolve(
	rootDir,
	'scripts/sync-screenshots-docs.mjs'
);

function syncScreenshotsDocsPage() {
	execFileSync( 'node', [ syncScreenshotsDocsScript ], {
		cwd: rootDir,
		stdio: 'inherit',
	} );
}

const CAPTURE_WAIT_MS = Number.parseInt(
	process.env.CAPTURE_WAIT_MS ?? '5000',
	10
);
const DOC_VIEWPORT = 'desktop';
const FIXTURE_POST_ID = process.env.SCREENSHOT_FIXTURE_POST_ID ?? '428';
const PLAYGROUND_URL =
	process.env.SCREENSHOT_PLAYGROUND_URL ?? 'https://dev.local/playground/';

const ENTRY_KEY_ORDER = [
	'id',
	'title',
	'description',
	'use',
	'match',
	'capture',
	'embed',
	'website',
];

/**
 * @param {string} dir
 */
function hasPlaywrightBrowsers( dir ) {
	if ( ! existsSync( dir ) ) {
		return false;
	}

	try {
		return readdirSync( dir ).some( ( name ) =>
			name.startsWith( 'chromium' )
		);
	} catch {
		return false;
	}
}

function defaultBrowsersPath() {
	const home = homedir();
	if ( platform() === 'darwin' ) {
		return join( home, 'Library/Caches/ms-playwright' );
	}
	if ( platform() === 'win32' ) {
		const localAppData =
			process.env.LOCALAPPDATA ?? join( home, 'AppData', 'Local' );
		return join( localAppData, 'ms-playwright' );
	}

	return join( home, '.cache/ms-playwright' );
}

/**
 * @param {string} dir
 */
function isEphemeralBrowsersPath( dir ) {
	return /cursor-sandbox-cache|\/T\/[^/]+\/playwright/.test( dir );
}

function resolveBrowsersPath() {
	const userDefault = defaultBrowsersPath();
	const candidates = [ userDefault ];

	if (
		process.env.PLAYWRIGHT_BROWSERS_PATH &&
		! candidates.includes( process.env.PLAYWRIGHT_BROWSERS_PATH ) &&
		! isEphemeralBrowsersPath( process.env.PLAYWRIGHT_BROWSERS_PATH )
	) {
		candidates.push( process.env.PLAYWRIGHT_BROWSERS_PATH );
	}

	for ( const candidate of candidates ) {
		if ( hasPlaywrightBrowsers( candidate ) ) {
			return candidate;
		}
	}

	return userDefault;
}

/**
 * @returns {import('playwright').BrowserType | null}
 */
function loadChromium() {
	process.env.PLAYWRIGHT_BROWSERS_PATH = resolveBrowsersPath();

	try {
		const playwrightPath = require.resolve( 'playwright', {
			paths: [ rootDir ],
		} );
		return require( playwrightPath ).chromium;
	} catch {
		return null;
	}
}

/**
 * @param {unknown} error
 */
function isMissingBrowserError( error ) {
	const message = String( error );
	return (
		message.includes( "Executable doesn't exist" ) ||
		message.includes( 'playwright install' )
	);
}

function printPlaywrightHelp() {
	console.error(
		'Playwright browsers are not installed. From the plugin repo root, run:\n'
	);
	console.error( '  npx playwright install chromium' );
}

/**
 * @param {string} url
 * @returns {string}
 */
function resolveCaptureUrl( url ) {
	return url
		.replace( /FIXTURE_POST_ID/g, FIXTURE_POST_ID )
		.replace( /PLAYGROUND_URL/g, PLAYGROUND_URL );
}

/**
 * @param {import('playwright').Page} page
 */
async function blurFocusedElement( page ) {
	await page.evaluate( () => {
		if ( document.activeElement instanceof HTMLElement ) {
			document.activeElement.blur();
		}
	} );
}

/**
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function sidebarLocator( page ) {
	return page
		.locator(
			'.interface-complementary-area, .edit-post-sidebar, .interface-interface-skeleton__sidebar'
		)
		.first();
}

/**
 * @param {import('playwright').Page} page
 */
async function ensureComplementaryAreaOpen( page ) {
	const sidebar = sidebarLocator( page );

	if (
		( await sidebar.count() ) > 0 &&
		( await sidebar.isVisible().catch( () => false ) )
	) {
		return;
	}

	const toggles = [
		page.getByRole( 'button', { name: 'Settings', exact: true } ),
		page.locator( 'button[aria-label="Settings"]' ),
		page.locator( '.edit-post-header__settings-button' ),
	];

	for ( const toggle of toggles ) {
		if (
			( await toggle.count() ) > 0 &&
			( await toggle.first().isVisible().catch( () => false ) )
		) {
			await toggle.first().click();
			await page.waitForTimeout( 400 );

			if ( await sidebar.isVisible().catch( () => false ) ) {
				return;
			}
		}
	}

	throw new Error(
		'Block editor sidebar is not open — pin Settings in the editor header'
	);
}

/**
 * @param {import('playwright').Page} page
 */
async function ensureBlockSidebarOpen( page ) {
	await ensureComplementaryAreaOpen( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function ensureBlockInspectorTab( page ) {
	await page.getByRole( 'tab', { name: 'Block', exact: true } ).click();
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function ensureBlockSettingsTab( page ) {
	const settingsTab = page
		.locator( '.block-editor-block-inspector__tabs' )
		.getByRole( 'button' )
		.first();

	if ( ( await settingsTab.count() ) > 0 ) {
		await settingsTab.click();
		await page.waitForTimeout( 200 );
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function expandPanelByTitle( page, title ) {
	const panel = page
		.locator( '.components-panel__body' )
		.filter( { has: page.getByText( title, { exact: true } ) } )
		.first();

	if ( ( await panel.count() ) === 0 ) {
		return;
	}

	const toggle = panel.locator( '.components-panel__body-toggle' );
	if ( ( await toggle.count() ) === 0 ) {
		return;
	}

	if ( ( await toggle.getAttribute( 'aria-expanded' ) ) !== 'true' ) {
		await toggle.click();
		await page.waitForTimeout( 200 );
	}
}

/**
 * @param {import('playwright').Page} page
 * @param {string} title
 */
async function collapsePanelByTitle( page, title ) {
	const panel = page
		.locator( '.components-panel__body' )
		.filter( { has: page.getByText( title, { exact: true } ) } )
		.first();

	if ( ( await panel.count() ) === 0 ) {
		return;
	}

	const toggle = panel.locator( '.components-panel__body-toggle' );
	if ( ( await toggle.count() ) === 0 ) {
		return;
	}

	if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'true' ) {
		await toggle.click();
		await page.waitForTimeout( 200 );
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function closeListViewIfOpen( page ) {
	const closedViaStore = await page.evaluate( () => {
		const store = window.wp?.data;
		if ( ! store ) {
			return false;
		}

		const editPost = store.dispatch( 'core/edit-post' );
		const editor = store.dispatch( 'core/editor' );

		if ( typeof editPost?.setIsListViewOpened === 'function' ) {
			editPost.setIsListViewOpened( false );
			return true;
		}

		if ( typeof editor?.setIsListViewOpened === 'function' ) {
			editor.setIsListViewOpened( false );
			return true;
		}

		return false;
	} );

	if ( closedViaStore ) {
		await page.waitForTimeout( 400 );
	}

	const secondarySidebar = page.locator(
		'.interface-interface-skeleton__secondary-sidebar'
	);

	if ( ! ( await secondarySidebar.isVisible().catch( () => false ) ) ) {
		return;
	}

	const closeButtons = [
		page.getByRole( 'button', { name: 'List View', exact: true } ),
		page.locator( 'button[aria-label="Close List View"]' ),
		page.locator( 'button[aria-label="Close list view"]' ),
	];

	for ( const button of closeButtons ) {
		if (
			( await button.count() ) > 0 &&
			( await button.first().isVisible().catch( () => false ) )
		) {
			await button.first().click();
			await page.waitForTimeout( 400 );

			if (
				! ( await secondarySidebar.isVisible().catch( () => false ) )
			) {
				return;
			}
		}
	}

	if ( await secondarySidebar.isVisible().catch( () => false ) ) {
		throw new Error(
			'List View sidebar is still open — close it before capturing editor screenshots'
		);
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function scrollSidebarToTop( page ) {
	await page.evaluate( () => {
		const area = document.querySelector(
			'.interface-complementary-area, .edit-post-sidebar'
		);
		if ( ! area ) {
			return;
		}

		const scrollables = area.querySelectorAll( '*' );
		for ( const element of scrollables ) {
			if ( element.scrollHeight > element.clientHeight + 1 ) {
				element.scrollTop = 0;
			}
		}

		area.scrollTop = 0;
	} );
}

/**
 * Nudge the editor canvas scroll position after scrollIntoView.
 *
 * @param {import('playwright').Page} page
 * @param {number} deltaY
 */
async function scrollEditorCanvasBy( page, deltaY ) {
	await page.evaluate( ( offset ) => {
		const iframe = document.querySelector(
			'iframe[name="editor-canvas"]'
		);
		const doc = iframe?.contentDocument;
		const win = iframe?.contentWindow;
		const scrollContainer =
			doc?.querySelector( '.edit-post-visual-editor' ) ??
			doc?.documentElement;

		if ( win ) {
			win.scrollBy( 0, offset );
		}

		if ( scrollContainer ) {
			scrollContainer.scrollTop += offset;
		}
	}, deltaY );
}

/**
 * Select the first button block that shows Freemius sidebar settings.
 *
 * @param {import('playwright').Page} page
 */
async function selectButtonWithFreemiusPanel( page ) {
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );

	const iframeCount = await page
		.locator( 'iframe[name="editor-canvas"]' )
		.count();
	const buttons = iframeCount
		? page
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.wp-block-button' )
		: page.locator( '.wp-block-button' );

	const count = await buttons.count();
	for ( let i = 0; i < count; i += 1 ) {
		await buttons.nth( i ).click( { force: true } );
		await page.waitForTimeout( 600 );

		if ( ( await page.locator( '.freemius-button-scope-settings' ).count() ) > 0 ) {
			return;
		}
	}

	throw new Error(
		'Button with Freemius settings not found on fixture post 428 — enable Freemius on a button block'
	);
}

/**
 * @param {import('playwright').Page} page
 */
async function ensureCheckoutEnabled( page ) {
	const toggle = page.getByLabel( 'Enable Freemius Checkout', { exact: true } );

	if ( ( await toggle.count() ) === 0 ) {
		return;
	}

	if ( ! ( await toggle.isChecked() ) ) {
		await toggle.check();
		await page.waitForTimeout( 400 );
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function openFreemiusOptionsMenu( page ) {
	const menuButton = page.locator(
		'.freemius-button-scope-settings .components-tools-panel-header button[aria-label="Freemius options"]'
	);

	if ( ( await menuButton.count() ) === 0 ) {
		throw new Error(
			'Freemius options menu not found — enable checkout on a global-scope button first'
		);
	}

	if ( ( await menuButton.getAttribute( 'aria-expanded' ) ) === 'true' ) {
		return;
	}

	await menuButton.click();
	await page.waitForTimeout( 400 );

	const popover = page.locator( '.components-popover' ).last();
	await popover.waitFor( { state: 'visible', timeout: 10_000 } );
}

/**
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function canvasButtonLocator( page ) {
	return page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '.wp-block-button .wp-block-button__link' )
		.first()
		.or( page.locator( '.wp-block-button .wp-block-button__link' ).first() );
}

/**
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function canvasModifierLocator( page ) {
	return page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '[data-type="freemius/modifier"]' )
		.first()
		.or( page.locator( '[data-type="freemius/modifier"]' ).first() );
}

/**
 * Locator for the flex group that contains the modifier toggle blocks only.
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function pricingModifiersRowGroupLocator( page ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );

	return frame
		.locator( '.wp-block-group' )
		.filter( { has: frame.locator( '[data-type="freemius/modifier"]' ) } )
		.filter( { hasNot: frame.locator( '.wp-block-columns' ) } )
		.first();
}

/**
 * Columns block that contains scoped plan columns on the pricing fixture.
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function pricingPlanColumnsLocator( page ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );

	return frame
		.locator( '.wp-block-columns' )
		.filter( {
			has: frame.locator( '.wp-block-column.has-freemius-scope' ),
		} )
		.first();
}

/**
 * Scoped plan columns inside the pricing table (one per Freemius plan).
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function pricingPlanColumnLocator( page ) {
	return page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '.wp-block-column.has-freemius-scope' );
}

/**
 * @param {import('playwright').Page} page
 */
async function deselectAllBlocks( page ) {
	await page.evaluate( () => {
		window.wp?.data?.dispatch( 'core/block-editor' )?.clearSelectedBlock();
	} );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function selectFirstButtonBlock( page ) {
	await ensureBlockSidebarOpen( page );
	const button = canvasButtonLocator( page );

	if ( ( await button.count() ) === 0 ) {
		throw new Error(
			'Button block not found on fixture post — add a core/button block to post 428'
		);
	}

	await button.click();
	await page.waitForTimeout( 500 );
}

/**
 * Dismiss the WordPress editor autosave notice when it is visible.
 *
 * @param {import('playwright').Page} page
 */
async function dismissAutosaveNoticeIfPresent( page ) {
	const notice = page
		.locator( '.components-notice' )
		.filter( { hasText: /autosave of this post/i } )
		.first();

	if (
		( await notice.count() ) === 0 ||
		! ( await notice.isVisible().catch( () => false ) )
	) {
		return;
	}

	const dismissButtons = [
		notice.locator( 'button.components-notice__dismiss' ),
		notice.getByRole( 'button', { name: 'Dismiss this notice' } ),
		notice.locator( 'button[aria-label="Dismiss this notice"]' ),
	];

	for ( const dismiss of dismissButtons ) {
		if (
			( await dismiss.count() ) > 0 &&
			( await dismiss.first().isVisible().catch( () => false ) )
		) {
			await dismiss.first().click();
			await page.waitForTimeout( 300 );
			return;
		}
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function waitForEditorReady( page ) {
	await page.waitForSelector(
		'.edit-post-layout, .block-editor-block-list__layout, .interface-interface-skeleton__editor',
		{ timeout: 30_000 }
	);
	await page.waitForTimeout( 1000 );
	await dismissAutosaveNoticeIfPresent( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function waitForSettingsReady( page ) {
	await page.waitForSelector( '#freemius-settings-app', { timeout: 30_000 } );
	await page.waitForTimeout( 1000 );
}

/**
 * @param {{ id: string, capture: { url: string } }} entry
 */
function isSettingsCapture( entry ) {
	return (
		entry.id.startsWith( 'settings-' ) ||
		entry.capture.url.includes( 'freemius-settings' )
	);
}

/**
 * @param {{ id: string, capture: { selector?: string } }} entry
 */
function isEditorCanvasCapture( entry ) {
	return entry.id === 'scope-pricing-mapped';
}

/**
 * @param {{ id: string, capture: { url: string } }} entry
 */
function isFrontendCapture( entry ) {
	return (
		entry.id.startsWith( 'pricing-page-' ) ||
		entry.capture.url.includes( '/playground' )
	);
}

/**
 * @param {import('playwright').Page} page
 */
async function openFreemiusPanel( page ) {
	await ensureBlockSidebarOpen( page );

	const toolsPanel = page.locator( '.freemius-button-scope-settings' ).first();

	if ( ( await toolsPanel.count() ) > 0 ) {
		const headerToggle = toolsPanel
			.locator(
				'.components-tools-panel-header button, .components-panel__body-toggle'
			)
			.first();

		if ( ( await headerToggle.count() ) > 0 ) {
			const expanded = await headerToggle.getAttribute( 'aria-expanded' );
			if ( expanded === 'false' ) {
				await headerToggle.click();
				await page.waitForTimeout( 300 );
			}
		}

		return;
	}

	const freemiusHeading = page.getByRole( 'button', {
		name: 'Freemius',
		exact: true,
	} );

	if ( ( await freemiusHeading.count() ) > 0 ) {
		const expanded = await freemiusHeading.getAttribute( 'aria-expanded' );
		if ( expanded !== 'true' ) {
			await freemiusHeading.click();
			await page.waitForTimeout( 300 );
		}

		return;
	}

	const freemiusPanelBody = page
		.locator( '.components-panel__body' )
		.filter( {
			has: page.getByText( 'Freemius', { exact: true } ),
		} )
		.first();

	if ( ( await freemiusPanelBody.count() ) > 0 ) {
		const toggle = freemiusPanelBody.locator(
			'.components-panel__body-toggle'
		);

		if ( ( await toggle.count() ) > 0 ) {
			const expanded = await toggle.getAttribute( 'aria-expanded' );
			if ( expanded !== 'true' ) {
				await toggle.click();
				await page.waitForTimeout( 300 );
			}
		}

		return;
	}

	throw new Error(
		'Freemius panel not found in block sidebar — select a block with Freemius settings'
	);
}

/**
 * @param {import('playwright').Page} page
 */
async function isScopeGroupSidebarVisible( page ) {
	const enableScope = page.getByLabel( 'Enable Freemius', {
		exact: true,
	} );
	const resetMods = page.getByRole( 'button', {
		name: 'Reset Modifications',
		exact: true,
	} );

	return (
		( await enableScope.count() ) > 0 ||
		( await resetMods.count() ) > 0
	);
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonKeySettings( page ) {
	await selectButtonWithFreemiusPanel( page );
	await ensureBlockInspectorTab( page );
	await openFreemiusPanel( page );
	await ensureCheckoutEnabled( page );
	await openFreemiusOptionsMenu( page );
}

/** @typedef {{ r: number, g: number, b: number }} PngColor */

/** @type {PngColor} */
const ANNOTATION_RED = { r: 255, g: 59, b: 48 };
const KEY_SETTINGS_CANVAS_INSET_LEFT = 88;
const KEY_SETTINGS_CANVAS_INSET = 16;
const KEY_SETTINGS_ARROW_MAX_LENGTH = 88;
const KEY_SETTINGS_ARROW_TIP_GAP = 6;
const CHECKOUT_PANEL_ANNOTATION_INSET = 6;

/**
 * @param {number} value
 */
function snapPixel( value ) {
	return Math.round( value );
}

/**
 * @param {PNG} png
 * @param {number} x
 * @param {number} y
 * @param {PngColor} color
 */
function setPngPixel( png, x, y, color ) {
	const px = snapPixel( x );
	const py = snapPixel( y );

	if ( px < 0 || py < 0 || px >= png.width || py >= png.height ) {
		return;
	}

	const index = ( png.width * py + px ) << 2;
	png.data[ index ] = color.r;
	png.data[ index + 1 ] = color.g;
	png.data[ index + 2 ] = color.b;
	png.data[ index + 3 ] = 255;
}

/**
 * @param {PNG} png
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {PngColor} color
 */
function drawPngLine( png, x0, y0, x1, y1, color ) {
	let x = snapPixel( x0 );
	let y = snapPixel( y0 );
	const endX = snapPixel( x1 );
	const endY = snapPixel( y1 );
	const dx = Math.abs( endX - x );
	const dy = Math.abs( endY - y );
	const sx = x < endX ? 1 : -1;
	const sy = y < endY ? 1 : -1;
	let err = dx - dy;
	let guard = 0;

	while ( guard++ < 10_000 ) {
		setPngPixel( png, x, y, color );

		if ( x === endX && y === endY ) {
			break;
		}

		const err2 = err * 2;
		if ( err2 > -dy ) {
			err -= dy;
			x += sx;
		}
		if ( err2 < dx ) {
			err += dx;
			y += sy;
		}
	}
}

/**
 * @param {PNG} png
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {PngColor} color
 */
function drawPngFilledTriangle( png, x1, y1, x2, y2, x3, y3, color ) {
	const minY = Math.floor( Math.min( y1, y2, y3 ) );
	const maxY = Math.ceil( Math.max( y1, y2, y3 ) );

	for ( let y = minY; y <= maxY; y += 1 ) {
		/** @type {number[]} */
		const intersections = [];

		for ( const [ ax, ay, bx, by ] of [
			[ x1, y1, x2, y2 ],
			[ x2, y2, x3, y3 ],
			[ x3, y3, x1, y1 ],
		] ) {
			if ( ( ay <= y && by > y ) || ( by <= y && ay > y ) ) {
				intersections.push( ax + ( ( y - ay ) / ( by - ay ) ) * ( bx - ax ) );
			}
		}

		if ( intersections.length >= 2 ) {
			const start = Math.floor( Math.min( intersections[ 0 ], intersections[ 1 ] ) );
			const end = Math.ceil( Math.max( intersections[ 0 ], intersections[ 1 ] ) );
			for ( let x = start; x <= end; x += 1 ) {
				setPngPixel( png, x, y, color );
			}
		}
	}
}

/**
 * Solid arrow: uniform shaft + filled triangular head (reference style).
 *
 * @param {PNG} png
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {PngColor} color
 */
function drawPngSolidArrow( png, fromX, fromY, toX, toY, color ) {
	let tailX = snapPixel( fromX );
	let tailY = snapPixel( fromY );
	const tipX = snapPixel( toX );
	const tipY = snapPixel( toY );
	let dx = tipX - tailX;
	let dy = tipY - tailY;
	let length = Math.hypot( dx, dy );

	if ( length < 10 ) {
		return;
	}

	if ( length > KEY_SETTINGS_ARROW_MAX_LENGTH ) {
		const scale = KEY_SETTINGS_ARROW_MAX_LENGTH / length;
		tailX = snapPixel( tipX - dx * scale );
		tailY = snapPixel( tipY - dy * scale );
		dx = tipX - tailX;
		dy = tipY - tailY;
		length = Math.hypot( dx, dy );
	}

	const unitX = dx / length;
	const unitY = dy / length;
	const perpX = -unitY;
	const perpY = unitX;
	const shaftHalf = 1;
	const headLength = 12;
	const headHalf = 5;
	const baseX = snapPixel( tipX - unitX * headLength );
	const baseY = snapPixel( tipY - unitY * headLength );
	const leftX = snapPixel( baseX + perpX * headHalf );
	const leftY = snapPixel( baseY + perpY * headHalf );
	const rightX = snapPixel( baseX - perpX * headHalf );
	const rightY = snapPixel( baseY - perpY * headHalf );

	drawPngFilledTriangle( png, tipX, tipY, leftX, leftY, rightX, rightY, color );

	const shaftCorners = [
		[ tailX + perpX * shaftHalf, tailY + perpY * shaftHalf ],
		[ tailX - perpX * shaftHalf, tailY - perpY * shaftHalf ],
		[ baseX - perpX * shaftHalf, baseY - perpY * shaftHalf ],
		[ baseX + perpX * shaftHalf, baseY + perpY * shaftHalf ],
	];

	drawPngFilledTriangle(
		png,
		shaftCorners[ 0 ][ 0 ],
		shaftCorners[ 0 ][ 1 ],
		shaftCorners[ 1 ][ 0 ],
		shaftCorners[ 1 ][ 1 ],
		shaftCorners[ 2 ][ 0 ],
		shaftCorners[ 2 ][ 1 ],
		color
	);
	drawPngFilledTriangle(
		png,
		shaftCorners[ 0 ][ 0 ],
		shaftCorners[ 0 ][ 1 ],
		shaftCorners[ 2 ][ 0 ],
		shaftCorners[ 2 ][ 1 ],
		shaftCorners[ 3 ][ 0 ],
		shaftCorners[ 3 ][ 1 ],
		color
	);
}

/**
 * @param {number} tailX
 * @param {number} tailY
 * @param {number} rectX
 * @param {number} rectY
 * @param {number} rectW
 * @param {number} rectH
 * @param {number} gap
 */
function arrowTipBeforeRect( tailX, tailY, rectX, rectY, rectW, rectH, gap ) {
	const centerX = rectX + rectW / 2;
	const centerY = rectY + rectH / 2;
	const dx = centerX - tailX;
	const dy = centerY - tailY;
	const length = Math.hypot( dx, dy );

	if ( length < 1 ) {
		return { x: centerX, y: centerY };
	}

	const unitX = dx / length;
	const unitY = dy / length;
	const inflatedX = rectX - gap;
	const inflatedY = rectY - gap;
	const inflatedRight = rectX + rectW + gap;
	const inflatedBottom = rectY + rectH + gap;

	for ( let step = 0; step <= length + gap * 2; step += 1 ) {
		const px = centerX - unitX * step;
		const py = centerY - unitY * step;
		const outside =
			px < inflatedX ||
			px > inflatedRight ||
			py < inflatedY ||
			py > inflatedBottom;

		if ( outside && step > 0 ) {
			return { x: snapPixel( px ), y: snapPixel( py ) };
		}
	}

	return {
		x: snapPixel( centerX - unitX * gap ),
		y: snapPixel( centerY - unitY * gap ),
	};
}

/**
 * @param {PNG} png
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {PngColor} color
 */
function drawPngRect( png, x, y, width, height, color ) {
	const left = snapPixel( x );
	const top = snapPixel( y );
	const right = snapPixel( x + width );
	const bottom = snapPixel( y + height );

	for ( let px = left; px <= right; px += 1 ) {
		setPngPixel( png, px, top, color );
		setPngPixel( png, px, top + 1, color );
		setPngPixel( png, px, bottom, color );
		setPngPixel( png, px, bottom - 1, color );
	}
	for ( let py = top; py <= bottom; py += 1 ) {
		setPngPixel( png, left, py, color );
		setPngPixel( png, left + 1, py, color );
		setPngPixel( png, right, py, color );
		setPngPixel( png, right - 1, py, color );
	}
}

/**
 * Page clip with editor background, then annotate the options button.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 */
async function captureButtonKeySettings( page, outputAbs ) {
	const panel = page.locator( '.freemius-button-scope-settings' ).first();
	const menuButton = panel.locator(
		'button[aria-label="Freemius options"]'
	);

	await openFreemiusOptionsMenu( page );

	const popover = page
		.locator( '.components-popover' )
		.filter( {
			has: page.getByRole( 'menuitemcheckbox', { name: 'Product ID' } ),
		} )
		.last();
	const popoverContent = popover.locator( '.components-popover__content' ).first();

	await popover.waitFor( { state: 'visible', timeout: 10_000 } );
	await popoverContent.waitFor( { state: 'visible', timeout: 10_000 } );

	const panelBox = await panel.boundingBox();
	const menuBox = await menuButton.boundingBox();
	const popoverContentBox = await popoverContent.boundingBox();

	if ( ! panelBox || ! menuBox || ! popoverContentBox ) {
		throw new Error(
			'Freemius options menu is not visible for button-key-settings capture'
		);
	}

	if ( popoverContentBox.y < panelBox.y - 200 ) {
		throw new Error(
			'Freemius options menu clip is invalid at this viewport — use wide (1920px) for button-key-settings'
		);
	}

	const mappingBox = await page
		.getByLabel( 'Mapping', { exact: true } )
		.boundingBox()
		.catch( () => null );
	const suffixBox = await panel
		.getByText( /^Suffix$/i )
		.first()
		.boundingBox()
		.catch( () => null );

	let contentBottom = panelBox.y + panelBox.height;
	if ( mappingBox ) {
		contentBottom = mappingBox.y + mappingBox.height + 56;
	}
	if ( suffixBox ) {
		contentBottom = Math.max( contentBottom, suffixBox.y + suffixBox.height + 40 );
	}
	contentBottom = Math.max(
		contentBottom,
		popoverContentBox.y + popoverContentBox.height + 8
	);

	const contentTop =
		Math.min( panelBox.y, popoverContentBox.y ) - KEY_SETTINGS_CANVAS_INSET;
	const clip = {
		x: popoverContentBox.x - KEY_SETTINGS_CANVAS_INSET_LEFT,
		y: contentTop,
		width:
			panelBox.x +
			panelBox.width +
			KEY_SETTINGS_CANVAS_INSET -
			( popoverContentBox.x - KEY_SETTINGS_CANVAS_INSET_LEFT ),
		height: contentBottom + KEY_SETTINGS_CANVAS_INSET - contentTop,
	};

	const capture = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel( menuBox.x - clip.x - 4 );
	const highlightY = snapPixel( menuBox.y - clip.y - 4 );
	const highlightWidth = snapPixel( menuBox.width + 8 );
	const highlightHeight = snapPixel( menuBox.height + 8 );
	const tailX = snapPixel( highlightX - 34 );
	const tailY = snapPixel( highlightY + highlightHeight + 38 );
	const tip = arrowTipBeforeRect(
		tailX,
		tailY,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		KEY_SETTINGS_ARROW_TIP_GAP
	);

	drawPngRect(
		capture,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);
	drawPngSolidArrow( capture, tailX, tailY, tip.x, tip.y, ANNOTATION_RED );

	writeFileSync( outputAbs, PNG.sync.write( capture ) );
}

/**
 * Editor body with the pricing scope group selected and Freemius panel annotated.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureScopeEnableCheckout( page, outputAbs, capture ) {
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();
	const pricingSection = pricingTableSectionLocator( page );
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const enableHelp = page.getByText( 'Enable Freemius for this area.', {
		exact: true,
	} );

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await freemiusPanel.waitFor( { state: 'visible', timeout: 10_000 } );
	await enableHelp.waitFor( { state: 'visible', timeout: 10_000 } );
	await assertLayoutPanelCollapsed( page );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const panelBox = await freemiusPanel.boundingBox();
	const panelHeader = freemiusPanel
		.locator( '.components-tools-panel-header' )
		.first();
	const panelHeaderBox = await panelHeader.boundingBox();
	const enableHelpBox = await enableHelp.boundingBox();

	if ( ! bodyBox || ! panelBox || ! panelHeaderBox || ! enableHelpBox ) {
		throw new Error(
			'Pricing scope group or Freemius panel is not visible for scope-enable-checkout capture'
		);
	}

	const padding = capture.padding ?? 0;
	const clip = {
		x: Math.max( 0, bodyBox.x - padding ),
		y: Math.max( 0, bodyBox.y - padding ),
		width: bodyBox.width + padding * 2,
		height: bodyBox.height + padding * 2,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		panelBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		panelHeaderBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		panelBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		enableHelpBox.y +
			enableHelpBox.height -
			panelHeaderBox.y +
			CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	const tailX = snapPixel( highlightX - 34 );
	const tailY = snapPixel( highlightY + highlightHeight + 38 );
	const tip = arrowTipBeforeRect(
		tailX,
		tailY,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		KEY_SETTINGS_ARROW_TIP_GAP
	);

	drawPngSolidArrow(
		capturePng,
		tailX,
		tailY,
		tip.x,
		tip.y,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Clip the settings app from the header through the Body ID field.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureSettingsEditor( page, outputAbs, capture ) {
	const app = page.locator( '#freemius-settings-app' ).first();
	const header = page.locator( '.freemius-header' ).first();
	const bodyIdControl = page
		.getByLabel( 'Body ID', { exact: true } )
		.locator( 'xpath=ancestor::div[contains(@class,"components-base-control")]' )
		.first();
	const bodyIdHelp = bodyIdControl.locator(
		'.components-base-control__help'
	);

	const appBox = await app.boundingBox();
	const headerBox = await header.boundingBox();
	const bodyIdBox = await bodyIdControl.boundingBox();
	const helpBox = await bodyIdHelp.boundingBox().catch( () => null );

	if ( ! appBox || ! headerBox || ! bodyIdBox ) {
		throw new Error(
			'Editor Settings fields are not visible for settings-editor capture'
		);
	}

	const padding = capture.padding ?? 16;
	const contentBottom = helpBox
		? helpBox.y + helpBox.height
		: bodyIdBox.y + bodyIdBox.height;
	const clip = {
		x: appBox.x,
		y: Math.max( 0, headerBox.y - padding ),
		width: appBox.width,
		height: contentBottom - headerBox.y + padding + 24,
	};

	await page.screenshot( {
		path: outputAbs,
		clip,
	} );
}

/**
 * Clip the settings app from the header through the Products fields.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureSettingsProducts( page, outputAbs, capture ) {
	const app = page.locator( '#freemius-settings-app' ).first();
	const header = page.locator( '.freemius-header' ).first();
	const productIdControl = page
		.getByLabel( 'Product ID', { exact: true } )
		.first()
		.locator(
			'xpath=ancestor::div[contains(@class,"components-base-control")]'
		)
		.first();
	const addProductButton = page.getByRole( 'button', {
		name: 'Add a new product',
		exact: true,
	} );

	const appBox = await app.boundingBox();
	const headerBox = await header.boundingBox();
	const productIdBox = await productIdControl.boundingBox();
	const addButtonBox = await addProductButton.boundingBox().catch( () => null );

	if ( ! appBox || ! headerBox || ! productIdBox ) {
		throw new Error(
			'Products fields are not visible for settings-products capture'
		);
	}

	const padding = capture.padding ?? 16;
	const contentBottom = addButtonBox
		? addButtonBox.y + addButtonBox.height
		: productIdBox.y + productIdBox.height;
	const clip = {
		x: appBox.x,
		y: Math.max( 0, headerBox.y - padding ),
		width: appBox.width,
		height: contentBottom - headerBox.y + padding + 24,
	};

	await page.screenshot( {
		path: outputAbs,
		clip,
	} );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonTrackCallback( page ) {
	await closeListViewIfOpen( page );
	await ensureBlockSidebarOpen( page );
	await selectPricingCheckoutButton( page );
	await collapseLayoutPanel( page );
	await openFreemiusPanel( page );
	await dismissAutosaveNoticeIfPresent( page );

	const popout = page.getByRole( 'button', { name: /Popout Editor/i } ).first();

	if ( ( await popout.count() ) > 0 ) {
		await popout.scrollIntoViewIfNeeded();
		await page.waitForTimeout( 300 );
	}
}

/**
 * Bounding box for the Track Callback field annotation (sidebar, before modal).
 *
 * @param {import('playwright').Page} page
 */
async function getTrackCallbackAnnotationBox( page ) {
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const trackCallbackControl = freemiusPanel
		.locator( '.components-base-control' )
		.filter( { has: page.getByRole( 'button', { name: /Popout Editor/i } ) } )
		.first();
	const popoutButton = trackCallbackControl.getByRole( 'button', {
		name: /Popout Editor/i,
	} );

	await trackCallbackControl.waitFor( { state: 'visible', timeout: 10_000 } );
	await popoutButton.waitFor( { state: 'visible', timeout: 10_000 } );

	const panelBox = await freemiusPanel.boundingBox();
	const controlBox = await trackCallbackControl.boundingBox();
	const popoutBox = await popoutButton.boundingBox();

	if ( ! panelBox || ! controlBox || ! popoutBox ) {
		throw new Error(
			'Track Callback control is not visible for button-track-callback capture'
		);
	}

	return {
		x: panelBox.x,
		y: controlBox.y,
		width: panelBox.width,
		height: popoutBox.y + popoutBox.height - controlBox.y,
	};
}

/**
 * @param {import('playwright').Page} page
 */
async function openTrackCallbackPopoutEditor( page ) {
	const popout = page.getByRole( 'button', { name: /Popout Editor/i } ).first();

	await popout.click();
	await page
		.locator( '.components-modal__frame' )
		.first()
		.waitFor( { state: 'visible', timeout: 10_000 } );
	await page.waitForTimeout( 500 );
}

/**
 * Editor body with Track Callback popout open and the sidebar field annotated.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureButtonTrackCallback( page, outputAbs, capture ) {
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();
	const modal = page.locator( '.components-modal__frame' ).first();

	await dismissAutosaveNoticeIfPresent( page );

	const trackCallbackBox = await getTrackCallbackAnnotationBox( page );

	await openTrackCallbackPopoutEditor( page );
	await modal.waitFor( { state: 'visible', timeout: 10_000 } );

	const bodyBox = await editorBody.boundingBox();

	if ( ! bodyBox ) {
		throw new Error(
			'Editor body is not visible for button-track-callback capture'
		);
	}

	const padding = capture.padding ?? 0;
	const clip = {
		x: Math.max( 0, bodyBox.x - padding ),
		y: Math.max( 0, bodyBox.y - padding ),
		width: bodyBox.width + padding * 2,
		height: bodyBox.height + padding * 2,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		trackCallbackBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		trackCallbackBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		trackCallbackBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		trackCallbackBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	const modalBox = await modal.boundingBox();

	if ( modalBox ) {
		const tailX = snapPixel( modalBox.x + modalBox.width * 0.9 - clip.x );
		const tailY = snapPixel( modalBox.y + modalBox.height * 0.42 - clip.y );
		const tip = arrowTipBeforeRect(
			tailX,
			tailY,
			highlightX,
			highlightY,
			highlightWidth,
			highlightHeight,
			KEY_SETTINGS_ARROW_TIP_GAP
		);

		drawPngSolidArrow(
			capturePng,
			tailX,
			tailY,
			tip.x,
			tip.y,
			ANNOTATION_RED
		);
	}

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopeEnableCheckout( page ) {
	await closeListViewIfOpen( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) > 0 ) {
		await pricingSection.scrollIntoViewIfNeeded();
		await selectPricingTableScopeGroup( page );
		await openFreemiusPanel( page );
		await page
			.locator( '.freemius-button-scope-settings' )
			.getByText( /Product ID/i )
			.first()
			.waitFor( { state: 'visible', timeout: 15_000 } );
		return;
	}

	throw new Error(
		'Scoped group block not found on fixture post 428 — add a Freemius-enabled group'
	);
}

/**
 * Pricing table section in the fixture post (matches the playground page).
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function pricingTableSectionLocator( page ) {
	return page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( 'section.has-freemius-scope, .has-freemius-scope' )
		.filter( { hasText: 'Freemius for WordPress' } )
		.first()
		.or(
			page
				.locator( 'section.has-freemius-scope, .has-freemius-scope' )
				.filter( { hasText: 'Freemius for WordPress' } )
				.first()
		);
}

/**
 * Collapse the block inspector Layout panel when it is expanded.
 *
 * @param {import('playwright').Page} page
 */
async function collapseLayoutPanel( page ) {
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );
	await ensureBlockSettingsTab( page );

	const layoutToggles = [
		page
			.locator( '.interface-complementary-area' )
			.getByRole( 'button', { name: 'Layout', exact: true } ),
		page
			.locator( '.block-editor-block-inspector' )
			.getByRole( 'button', { name: 'Layout', exact: true } ),
	];

	for ( const toggle of layoutToggles ) {
		if ( ( await toggle.count() ) === 0 ) {
			continue;
		}

		const expanded = await toggle.first().getAttribute( 'aria-expanded' );
		if ( expanded === 'true' ) {
			await toggle.first().click();
			await page.waitForTimeout( 300 );
		}
	}

	await collapsePanelByTitle( page, 'Layout' );

	await page.evaluate( () => {
		const area = document.querySelector(
			'.interface-complementary-area, .block-editor-block-inspector'
		);
		if ( ! area ) {
			return;
		}

		area.querySelectorAll( '.components-panel__body' ).forEach( ( panel ) => {
			const title = panel.querySelector( '.components-panel__body-title' );
			if ( title?.textContent?.trim() !== 'Layout' ) {
				return;
			}

			const toggle = panel.querySelector( '.components-panel__body-toggle' );
			if ( toggle?.getAttribute( 'aria-expanded' ) === 'true' ) {
				toggle.click();
			}
		} );
	} );

	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function assertLayoutPanelCollapsed( page ) {
	const expandedLayout = page
		.locator( '.interface-complementary-area .components-panel__body' )
		.filter( {
			has: page.getByText( 'Layout', { exact: true } ),
		} )
		.locator( '.components-panel__body-toggle[aria-expanded="true"]' );

	if ( ( await expandedLayout.count() ) > 0 ) {
		throw new Error(
			'Layout panel must be collapsed for scope-pricing-mapped capture'
		);
	}
}

/**
 * Select the pricing table outer scope group and collapse the Layout panel.
 *
 * @param {import('playwright').Page} page
 */
async function selectPricingTableScopeGroup( page ) {
	const selected = await page.evaluate( () => {
		const store = window.wp?.data;
		if ( ! store ) {
			return false;
		}

		const targetNames = [
			'Pricing Table With Testimonials (Freemius)',
			'Pricing Table (Freemius)',
		];

		/** @param {Array<{ clientId: string, name: string, attributes?: { metadata?: { name?: string }, freemius_enabled?: boolean }, innerBlocks?: unknown[] }>} blocks */
		const findScopeGroup = ( blocks ) => {
			for ( const block of blocks ) {
				const metaName = block.attributes?.metadata?.name;

				if (
					block.attributes?.freemius_enabled &&
					block.name === 'core/group' &&
					metaName &&
					targetNames.includes( metaName )
				) {
					return block.clientId;
				}

				const nested = findScopeGroup( block.innerBlocks ?? [] );
				if ( nested ) {
					return nested;
				}
			}

			return null;
		};

		/** @param {Array<{ clientId: string, name: string, attributes?: { freemius_enabled?: boolean }, innerBlocks?: unknown[] }>} blocks */
		const findFirstScopeGroup = ( blocks ) => {
			for ( const block of blocks ) {
				if (
					block.attributes?.freemius_enabled &&
					block.name === 'core/group'
				) {
					return block.clientId;
				}

				const nested = findFirstScopeGroup( block.innerBlocks ?? [] );
				if ( nested ) {
					return nested;
				}
			}

			return null;
		};

		const clientId =
			findScopeGroup( store.select( 'core/block-editor' ).getBlocks() ) ??
			findFirstScopeGroup(
				store.select( 'core/block-editor' ).getBlocks()
			);

		if ( ! clientId ) {
			return false;
		}

		store.dispatch( 'core/block-editor' ).selectBlock( clientId );
		return true;
	} );

	if ( ! selected ) {
		const pricingSection = pricingTableSectionLocator( page );

		if ( ( await pricingSection.count() ) === 0 ) {
			throw new Error(
				'Pricing table scope group not found on fixture post 428'
			);
		}

		await pricingSection.click( { force: true } );
	} else {
		await page.waitForTimeout( 600 );
	}

	await closeListViewIfOpen( page );
	await collapseLayoutPanel( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopeColumnsOverview( page ) {
	await closeListViewIfOpen( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingTableScopeGroup( page );
	await openFreemiusPanel( page );
	await page
		.locator( '.freemius-button-scope-settings' )
		.getByText( /Product ID/i )
		.first()
		.waitFor( { state: 'visible', timeout: 15_000 } );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopePricingMapped( page ) {
	await closeListViewIfOpen( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingTableScopeGroup( page );
	await page.waitForTimeout( 500 );
}

/**
 * Editor canvas clip of the pricing table with Freemius scope outlines.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureScopePricingMapped( page, outputAbs, capture ) {
	const body = page
		.locator( '.interface-interface-skeleton__body' )
		.first();
	const pricingSection = pricingTableSectionLocator( page );

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await body.waitFor( { state: 'visible', timeout: 10_000 } );
	await assertLayoutPanelCollapsed( page );

	const bodyBox = await body.boundingBox();
	const sectionBox = await pricingSection.boundingBox();

	if ( ! bodyBox || ! sectionBox ) {
		throw new Error(
			'Pricing table or editor body is not visible for scope-pricing-mapped capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clip = {
		x: Math.max( 0, bodyBox.x ),
		y: Math.max( 0, sectionBox.y - padding ),
		width: bodyBox.width,
		height: sectionBox.height + padding * 2,
	};

	await page.screenshot( {
		path: outputAbs,
		clip,
	} );
}

/**
 * Pricing table with arrows pointing at each plan column scope.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureScopeColumnsOverview( page, outputAbs, capture ) {
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();
	const pricingSection = pricingTableSectionLocator( page );
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const enableHelp = page.getByText( 'Enable Freemius for this area.', {
		exact: true,
	} );

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await editorBody.waitFor( { state: 'visible', timeout: 10_000 } );
	await freemiusPanel.waitFor( { state: 'visible', timeout: 10_000 } );
	await enableHelp.waitFor( { state: 'visible', timeout: 10_000 } );
	await assertLayoutPanelCollapsed( page );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const panelBox = await freemiusPanel.boundingBox();
	const panelHeader = freemiusPanel
		.locator( '.components-tools-panel-header' )
		.first();
	const panelHeaderBox = await panelHeader.boundingBox();
	const enableHelpBox = await enableHelp.boundingBox();

	if (
		! bodyBox ||
		! panelBox ||
		! panelHeaderBox ||
		! enableHelpBox
	) {
		throw new Error(
			'Pricing table, Freemius panel, or editor body is not visible for scope-columns-overview capture'
		);
	}

	const padding = capture.padding ?? 0;
	const clip = {
		x: Math.max( 0, bodyBox.x - padding ),
		y: Math.max( 0, bodyBox.y - padding ),
		width: bodyBox.width + padding * 2,
		height: bodyBox.height + padding * 2,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const panelHighlightX = snapPixel(
		panelBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const panelHighlightY = snapPixel(
		panelHeaderBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const panelHighlightWidth = snapPixel(
		panelBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const panelHighlightHeight = snapPixel(
		enableHelpBox.y +
			enableHelpBox.height -
			panelHeaderBox.y +
			CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		panelHighlightX,
		panelHighlightY,
		panelHighlightWidth,
		panelHighlightHeight,
		ANNOTATION_RED
	);

	const panelTailX = snapPixel( panelHighlightX - 34 );
	const panelTailY = snapPixel(
		panelHighlightY + panelHighlightHeight + 38
	);
	const panelTip = arrowTipBeforeRect(
		panelTailX,
		panelTailY,
		panelHighlightX,
		panelHighlightY,
		panelHighlightWidth,
		panelHighlightHeight,
		KEY_SETTINGS_ARROW_TIP_GAP
	);

	drawPngSolidArrow(
		capturePng,
		panelTailX,
		panelTailY,
		panelTip.x,
		panelTip.y,
		ANNOTATION_RED
	);

	const columns = pricingPlanColumnLocator( page );
	const columnCount = Math.min( await columns.count(), 3 );

	for ( let index = 0; index < columnCount; index += 1 ) {
		const columnBox = await columns.nth( index ).boundingBox();

		if ( ! columnBox ) {
			continue;
		}

		const tipX = snapPixel( columnBox.x + columnBox.width / 2 - clip.x );
		const tipY = snapPixel( columnBox.y - clip.y + 10 );
		const tailX = tipX;
		const tailY = snapPixel( Math.max( 8, tipY - 42 ) );

		drawPngSolidArrow(
			capturePng,
			tailX,
			tailY,
			tipX,
			tipY,
			ANNOTATION_RED
		);
	}

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Pricing page canvas clip of the modifier toggle row with a red outline annotation.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function capturePricingPageModifiersRow( page, outputAbs, capture ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );
	const pricingSection = pricingTableSectionLocator( page );
	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const heading = frame.getByText( 'Freemius for WordPress', { exact: true } );

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await heading.waitFor( { state: 'visible', timeout: 10_000 } );
	await modifiersRow.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const sectionBox = await pricingSection.boundingBox();
	const headingBox = await heading.boundingBox();
	const rowBox = await modifiersRow.boundingBox();

	if ( ! sectionBox || ! headingBox || ! rowBox ) {
		throw new Error(
			'Pricing modifiers row is not visible for pricing-page-modifiers-row capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clip = {
		x: Math.max( 0, sectionBox.x - padding ),
		y: Math.max( 0, headingBox.y - padding ),
		width: sectionBox.width + padding * 2,
		height: rowBox.y + rowBox.height - headingBox.y + padding * 2,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		rowBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		rowBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		rowBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		rowBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Pricing page editor with the modifier toggle row outlined and sidebar open.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureScopeModifiers( page, outputAbs, capture ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );
	const pricingSection = pricingTableSectionLocator( page );
	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const heading = frame.getByText( 'Freemius for WordPress', { exact: true } );
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await heading.waitFor( { state: 'visible', timeout: 10_000 } );
	await modifiersRow.waitFor( { state: 'visible', timeout: 10_000 } );
	await page
		.getByLabel( 'Type', { exact: true } )
		.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const headingBox = await heading.boundingBox();
	const rowBox = await modifiersRow.boundingBox();
	const freemiusPanelBody = page
		.locator( '.components-panel__body.is-opened' )
		.filter( {
			has: page.getByRole( 'button', { name: 'Freemius', exact: true } ),
		} )
		.first();
	const panelBox = await freemiusPanelBody.boundingBox();

	if ( ! bodyBox || ! headingBox || ! rowBox || ! panelBox ) {
		throw new Error(
			'Pricing modifiers row or Freemius panel is not visible for scope-modifiers capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clipY = Math.max( 0, headingBox.y - padding );
	const clipBottom = Math.max(
		rowBox.y + rowBox.height + padding,
		panelBox.y + panelBox.height + padding
	);
	const clip = {
		x: Math.max( 0, bodyBox.x ),
		y: clipY,
		width: bodyBox.width,
		height: clipBottom - clipY,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		rowBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		rowBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		rowBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		rowBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Select a scoped pricing plan column by index (0 = first plan column).
 *
 * @param {import('playwright').Page} page
 * @param {number} columnIndex
 */
async function selectPricingPlanColumn( page, columnIndex = 0 ) {
	const selected = await page.evaluate( ( index ) => {
		const store = window.wp?.data;
		if ( ! store ) {
			return false;
		}

		/** @param {Array<{ clientId: string, name: string, attributes?: { freemius_enabled?: boolean }, innerBlocks?: unknown[] }>} blocks @param {string[]} acc */
		const collectColumns = ( blocks, acc = [] ) => {
			for ( const block of blocks ) {
				if (
					block.name === 'core/column' &&
					block.attributes?.freemius_enabled
				) {
					acc.push( block.clientId );
				}

				collectColumns( block.innerBlocks ?? [], acc );
			}

			return acc;
		};

		const columnIds = collectColumns(
			store.select( 'core/block-editor' ).getBlocks()
		);
		const clientId = columnIds[ index ];

		if ( ! clientId ) {
			return false;
		}

		store.dispatch( 'core/block-editor' ).selectBlock( clientId );
		return true;
	}, columnIndex );

	if ( ! selected ) {
		const column = pricingPlanColumnLocator( page ).nth( columnIndex );

		if ( ( await column.count() ) === 0 ) {
			throw new Error(
				'Scoped plan column not found on fixture post 428 — enable Freemius on each pricing column'
			);
		}

		await column.click( { force: true } );
	} else {
		await page.waitForTimeout( 600 );
	}

	await closeListViewIfOpen( page );
	await collapseLayoutPanel( page );
	await openFreemiusPanel( page );
	await scrollSidebarToPlanField( page );
	await page.waitForTimeout( 300 );
}

/**
 * Scroll the block sidebar so the Plan field is visible.
 *
 * @param {import('playwright').Page} page
 */
async function scrollSidebarToPlanField( page ) {
	await ensureBlockSidebarOpen( page );
	await page
		.getByText( /The ID of the plan that will load with the checkout/i )
		.first()
		.waitFor( { state: 'visible', timeout: 10_000 } );

	await page.evaluate( () => {
		const area = document.querySelector(
			'.interface-complementary-area, .edit-post-sidebar'
		);
		const planHelp = Array.from(
			area?.querySelectorAll( '.components-base-control__help' ) ?? []
		).find( ( element ) =>
			element.textContent?.includes(
				'The ID of the plan that will load with the checkout'
			)
		);

		planHelp?.scrollIntoView( { block: 'center' } );
	} );

	await page.waitForTimeout( 300 );
}

/**
 * Bounding boxes for the Plan field annotation in the Freemius sidebar.
 *
 * @param {import('playwright').Page} page
 */
async function getPlanFieldAnnotationBoxes( page ) {
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const planItem = freemiusPanel
		.locator( '.freemius-button-scope' )
		.filter( { has: page.getByText( 'Plan', { exact: true } ) } )
		.first();
	const planHelp = page.getByText(
		/The ID of the plan that will load with the checkout/i
	);

	await planItem.waitFor( { state: 'visible', timeout: 10_000 } );
	await planHelp.waitFor( { state: 'visible', timeout: 10_000 } );

	const itemBox = await planItem.boundingBox();
	const helpBox = await planHelp.boundingBox();

	if ( ! itemBox || ! helpBox ) {
		throw new Error(
			'Plan field is not visible for pricing-page-plan-column capture'
		);
	}

	return {
		x: itemBox.x,
		y: itemBox.y,
		width: itemBox.width,
		height: helpBox.y + helpBox.height - itemBox.y,
	};
}

/**
 * Pricing page canvas clip of the plan columns with one column outlined.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function capturePricingPagePlanColumn( page, outputAbs, capture ) {
	const pricingSection = pricingTableSectionLocator( page );
	const columnsBlock = pricingPlanColumnsLocator( page );
	const planColumn = pricingPlanColumnLocator( page ).first();
	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await columnsBlock.waitFor( { state: 'visible', timeout: 10_000 } );
	await planColumn.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const columnsBox = await columnsBlock.boundingBox();
	const columnBox = await planColumn.boundingBox();
	const modifiersBox = await modifiersRow.boundingBox().catch( () => null );
	const planFieldBox = await getPlanFieldAnnotationBoxes( page );

	if ( ! bodyBox || ! columnsBox || ! columnBox ) {
		throw new Error(
			'Pricing plan columns are not visible for pricing-page-plan-column capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clipTop = modifiersBox
		? Math.max( 0, modifiersBox.y - padding )
		: Math.max( 0, columnsBox.y - padding );
	const clip = {
		x: Math.max( 0, bodyBox.x ),
		y: clipTop,
		width: bodyBox.width,
		height: columnsBox.y + columnsBox.height - clipTop + padding,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		columnBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		columnBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		columnBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		columnBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	const planHighlightX = snapPixel(
		planFieldBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const planHighlightY = snapPixel(
		planFieldBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const planHighlightWidth = snapPixel(
		planFieldBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const planHighlightHeight = snapPixel(
		planFieldBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const planTailX = snapPixel( planHighlightX - 34 );
	const planTailY = snapPixel( planHighlightY - 38 );
	const planTip = arrowTipBeforeRect(
		planTailX,
		planTailY,
		planHighlightX,
		planHighlightY,
		planHighlightWidth,
		planHighlightHeight,
		KEY_SETTINGS_ARROW_TIP_GAP
	);

	drawPngRect(
		capturePng,
		planHighlightX,
		planHighlightY,
		planHighlightWidth,
		planHighlightHeight,
		ANNOTATION_RED
	);
	drawPngSolidArrow(
		capturePng,
		planTailX,
		planTailY,
		planTip.x,
		planTip.y,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Checkout button inside a pricing plan column on the fixture page.
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function pricingCheckoutButtonLocator( page ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );

	return frame
		.locator( '.wp-block-column.has-freemius-scope' )
		.filter( { hasText: 'Professional' } )
		.locator( '.wp-block-button.has-freemius-scope' )
		.first();
}

/**
 * Select the Professional plan checkout button in the pricing table.
 *
 * @param {import('playwright').Page} page
 */
async function selectPricingCheckoutButton( page ) {
	const button = pricingCheckoutButtonLocator( page );

	if ( ( await button.count() ) === 0 ) {
		throw new Error(
			'Professional plan checkout button not found on fixture post 428 — add a Freemius-enabled button to each pricing column'
		);
	}

	await button.click( { force: true } );
	await page.waitForTimeout( 600 );

	await page
		.getByLabel( 'Enable Freemius Checkout', { exact: true } )
		.waitFor( { state: 'visible', timeout: 10_000 } );
}

/**
 * Bounding box for the Enable Freemius Checkout toggle annotation.
 *
 * @param {import('playwright').Page} page
 */
async function getEnableFreemiusCheckoutAnnotationBoxes( page ) {
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const enableLabel = page.getByText( 'Enable Freemius Checkout', {
		exact: true,
	} );
	const enableHelp = page.getByText(
		'Open a Freemius Checkout when the button is clicked.',
		{ exact: true }
	);

	await enableLabel.waitFor( { state: 'visible', timeout: 10_000 } );
	await enableHelp.waitFor( { state: 'visible', timeout: 10_000 } );

	const panelBox = await freemiusPanel.boundingBox();
	const labelBox = await enableLabel.boundingBox();
	const helpBox = await enableHelp.boundingBox();

	if ( ! panelBox || ! labelBox || ! helpBox ) {
		throw new Error(
			'Enable Freemius Checkout control is not visible for pricing-page-checkout-button capture'
		);
	}

	return {
		x: panelBox.x,
		y: labelBox.y,
		width: panelBox.width,
		height: helpBox.y + helpBox.height - labelBox.y,
	};
}

/**
 * Pricing page editor clip with a checkout button selected and the toggle outlined.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function capturePricingPageCheckoutButton( page, outputAbs, capture ) {
	const pricingSection = pricingTableSectionLocator( page );
	const columnsBlock = pricingPlanColumnsLocator( page );
	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const checkoutButton = pricingCheckoutButtonLocator( page );
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await columnsBlock.waitFor( { state: 'visible', timeout: 10_000 } );
	await checkoutButton.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const columnsBox = await columnsBlock.boundingBox();
	const modifiersBox = await modifiersRow.boundingBox().catch( () => null );
	const firstColumn = pricingPlanColumnLocator( page ).nth( 1 );
	const firstColumnBox = await firstColumn.boundingBox();
	const checkoutToggleBox = await getEnableFreemiusCheckoutAnnotationBoxes(
		page
	);

	if ( ! bodyBox || ! columnsBox || ! firstColumnBox ) {
		throw new Error(
			'Pricing checkout button is not visible for pricing-page-checkout-button capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clipTop = modifiersBox
		? Math.max( 0, modifiersBox.y - padding )
		: Math.max( 0, columnsBox.y - padding );
	const clipLeft = Math.max( bodyBox.x, firstColumnBox.x - padding );
	const clip = {
		x: clipLeft,
		y: clipTop,
		width: bodyBox.x + bodyBox.width - clipLeft,
		height: columnsBox.y + columnsBox.height - clipTop + padding,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		checkoutToggleBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		checkoutToggleBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		checkoutToggleBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		checkoutToggleBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Bounding box for the Freemius panel annotation on the button overview shot.
 *
 * @param {import('playwright').Page} page
 */
async function getButtonOverviewAnnotationBoxes( page ) {
	const freemiusPanel = page
		.locator( '.freemius-button-scope-settings' )
		.first();
	const panelHeader = freemiusPanel
		.locator( '.components-tools-panel-header' )
		.first();
	const mappingHelp = page.getByText(
		'Select which field you like to map.',
		{ exact: true }
	);

	await freemiusPanel.waitFor( { state: 'visible', timeout: 10_000 } );
	await panelHeader.waitFor( { state: 'visible', timeout: 10_000 } );
	await mappingHelp.waitFor( { state: 'visible', timeout: 10_000 } );

	const panelBox = await freemiusPanel.boundingBox();
	const panelHeaderBox = await panelHeader.boundingBox();
	const mappingHelpBox = await mappingHelp.boundingBox();

	if ( ! panelBox || ! panelHeaderBox || ! mappingHelpBox ) {
		throw new Error(
			'Freemius panel or mapping controls are not visible for button-overview capture'
		);
	}

	return {
		x: panelBox.x,
		y: panelHeaderBox.y,
		width: panelBox.width,
		height: mappingHelpBox.y + mappingHelpBox.height - panelHeaderBox.y,
	};
}

/**
 * Pricing table editor with a mapped checkout button and annotated Freemius panel.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureButtonOverview( page, outputAbs, capture ) {
	const pricingSection = pricingTableSectionLocator( page );
	const columnsBlock = pricingPlanColumnsLocator( page );
	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const checkoutButton = pricingCheckoutButtonLocator( page );
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();

	await pricingSection.waitFor( { state: 'visible', timeout: 15_000 } );
	await columnsBlock.waitFor( { state: 'visible', timeout: 10_000 } );
	await checkoutButton.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await pricingSection.scrollIntoViewIfNeeded();
	await page.waitForTimeout( 300 );

	const bodyBox = await editorBody.boundingBox();
	const columnsBox = await columnsBlock.boundingBox();
	const modifiersBox = await modifiersRow.boundingBox().catch( () => null );
	const professionalColumn = pricingPlanColumnLocator( page ).nth( 1 );
	const professionalColumnBox = await professionalColumn.boundingBox();
	const panelBox = await getButtonOverviewAnnotationBoxes( page );
	const buttonBox = await checkoutButton.boundingBox();

	if ( ! bodyBox || ! columnsBox || ! professionalColumnBox || ! buttonBox ) {
		throw new Error(
			'Mapped checkout button is not visible for button-overview capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clipTop = modifiersBox
		? Math.max( 0, modifiersBox.y - padding )
		: Math.max( 0, columnsBox.y - padding );
	const clipLeft = Math.max( bodyBox.x, professionalColumnBox.x - padding );
	const clip = {
		x: clipLeft,
		y: clipTop,
		width: bodyBox.x + bodyBox.width - clipLeft,
		height: columnsBox.y + columnsBox.height - clipTop + padding,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	const highlightX = snapPixel(
		panelBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightY = snapPixel(
		panelBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
	);
	const highlightWidth = snapPixel(
		panelBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);
	const highlightHeight = snapPixel(
		panelBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
	);

	drawPngRect(
		capturePng,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		ANNOTATION_RED
	);

	const tailX = snapPixel( buttonBox.x + buttonBox.width - clip.x );
	const tailY = snapPixel( buttonBox.y + buttonBox.height / 2 - clip.y );
	const tip = arrowTipBeforeRect(
		tailX,
		tailY,
		highlightX,
		highlightY,
		highlightWidth,
		highlightHeight,
		KEY_SETTINGS_ARROW_TIP_GAP
	);

	drawPngSolidArrow(
		capturePng,
		tailX,
		tailY,
		tip.x,
		tip.y,
		ANNOTATION_RED
	);

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonOverview( page ) {
	await closeListViewIfOpen( page );
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );
	await ensureBlockSettingsTab( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingCheckoutButton( page );
	await collapseLayoutPanel( page );
	await openFreemiusPanel( page );
	await scrollSidebarToTop( page );
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function preparePricingPageCheckoutButton( page ) {
	await closeListViewIfOpen( page );
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );
	await ensureBlockSettingsTab( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingCheckoutButton( page );
	await collapseLayoutPanel( page );
	await openFreemiusPanel( page );
	await scrollSidebarToTop( page );
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * Scroll the block sidebar so the Preview button is visible.
 *
 * @param {import('playwright').Page} page
 */
async function scrollSidebarToPreviewButton( page ) {
	await ensureBlockSidebarOpen( page );

	const previewButton = previewButtonLocator( page );

	if ( ( await previewButton.count() ) > 0 ) {
		await previewButton.scrollIntoViewIfNeeded();
		await page.waitForTimeout( 300 );
		return;
	}

	await page.evaluate( () => {
		const area = document.querySelector(
			'.interface-complementary-area, .edit-post-sidebar'
		);
		const preview = Array.from( area?.querySelectorAll( 'button' ) ?? [] ).find(
			( button ) => button.textContent?.trim() === 'Preview'
		);

		preview?.scrollIntoView( { block: 'center' } );
	} );

	await page.waitForTimeout( 300 );
}

/**
 * Locator for the Freemius Preview control in the block sidebar.
 *
 * @param {import('playwright').Page} page
 * @returns {import('playwright').Locator}
 */
function previewButtonLocator( page ) {
	return page
		.locator( '.freemius-button-scope-settings' )
		.locator( 'button' )
		.filter( { hasText: /^Preview$/ } )
		.first();
}

/**
 * Open the Freemius checkout preview overlay in the editor iframe.
 *
 * @param {import('playwright').Page} page
 */
async function openPricingCheckoutPreview( page ) {
	const previewButton = previewButtonLocator( page );

	await previewButton.waitFor( { state: 'visible', timeout: 20_000 } );
	await previewButton.click();

	await page.waitForFunction(
		() => {
			if (
				document.body.classList.contains( 'freemius-checkout-preview' )
			) {
				return true;
			}

			const iframe = document.querySelector(
				'iframe[name="editor-canvas"]'
			);
			const doc = iframe?.contentDocument;

			return !! (
				doc?.querySelector( '[id^="fs-checkout-page-"]' ) ||
				doc?.querySelector( 'div[data-testid]' )
			);
		},
		{ timeout: 45_000 }
	);

	await page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '[id^="fs-checkout-page-"], div[data-testid]' )
		.first()
		.waitFor( { state: 'visible', timeout: 15_000 } );

	await page.waitForTimeout( 1500 );
}

/**
 * Bounding box for the Preview button annotation in the Freemius sidebar.
 *
 * @param {import('playwright').Page} page
 */
async function getPreviewButtonAnnotationBox( page ) {
	const previewButton = previewButtonLocator( page );

	await previewButton.waitFor( { state: 'visible', timeout: 20_000 } );

	const box = await previewButton.boundingBox();

	if ( ! box ) {
		throw new Error(
			'Preview button is not visible for pricing-page-preview capture'
		);
	}

	return box;
}

/**
 * Scroll the editor canvas so the checkout preview modal is fully visible.
 *
 * @param {import('playwright').Page} page
 * @param {{ padding?: number }} capture
 */
async function ensureCheckoutOverlayFullyVisible( page, capture ) {
	const checkoutOverlay = page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '[id^="fs-checkout-page-"], div[data-testid]' )
		.first();
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();

	await checkoutOverlay.waitFor( { state: 'visible', timeout: 15_000 } );

	const padding = capture.padding ?? 24;
	let checkoutBox = await checkoutOverlay.boundingBox();
	const bodyBox = await editorBody.boundingBox();

	if ( ! checkoutBox || ! bodyBox ) {
		throw new Error(
			'Checkout preview overlay is not visible for pricing-page-preview capture'
		);
	}

	for ( let attempt = 0; attempt < 4; attempt += 1 ) {
		const checkoutBottom = checkoutBox.y + checkoutBox.height;
		const checkoutTop = checkoutBox.y;
		const bodyBottom = bodyBox.y + bodyBox.height;
		const bodyTop = bodyBox.y;
		let delta = 0;

		if ( checkoutBottom > bodyBottom - padding ) {
			delta = checkoutBottom - bodyBottom + padding + 48;
		} else if ( checkoutTop < bodyTop + padding ) {
			delta = checkoutTop - bodyTop - padding - 48;
		}

		if ( Math.abs( delta ) < 4 ) {
			break;
		}

		await scrollEditorCanvasBy( page, delta );
		await page.waitForTimeout( 400 );

		checkoutBox = await checkoutOverlay.boundingBox();
		if ( ! checkoutBox ) {
			break;
		}
	}
}

/**
 * Editor view with the checkout preview overlay open in the block editor.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 * @param {{ annotatePreview?: boolean }} options
 */
async function capturePricingCheckoutPreviewEditor(
	page,
	outputAbs,
	capture,
	{ annotatePreview = false } = {}
) {
	const editorBody = page
		.locator( '.interface-interface-skeleton__body' )
		.first();
	const checkoutOverlay = page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( '[id^="fs-checkout-page-"], div[data-testid]' )
		.first();

	await checkoutOverlay.waitFor( { state: 'visible', timeout: 15_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await ensureCheckoutOverlayFullyVisible( page, capture );

	const bodyBox = await editorBody.boundingBox();
	const checkoutBox = await checkoutOverlay.boundingBox();

	if ( ! bodyBox || ! checkoutBox ) {
		throw new Error(
			'Pricing preview overlay is not visible for checkout preview capture'
		);
	}

	const padding = capture.padding ?? 24;
	const clipTop = Math.max(
		0,
		Math.min( bodyBox.y, checkoutBox.y ) - padding
	);
	const clipBottom =
		Math.max(
			bodyBox.y + bodyBox.height,
			checkoutBox.y + checkoutBox.height
		) + padding;
	const clip = {
		x: Math.max( 0, bodyBox.x - padding ),
		y: clipTop,
		width: bodyBox.width + padding * 2,
		height: clipBottom - clipTop,
	};

	const capturePng = PNG.sync.read(
		await page.screenshot( {
			type: 'png',
			clip,
		} )
	);

	if ( annotatePreview ) {
		const previewButtonBox = await getPreviewButtonAnnotationBox( page );
		const highlightX = snapPixel(
			previewButtonBox.x - clip.x - CHECKOUT_PANEL_ANNOTATION_INSET
		);
		const highlightY = snapPixel(
			previewButtonBox.y - clip.y - CHECKOUT_PANEL_ANNOTATION_INSET
		);
		const highlightWidth = snapPixel(
			previewButtonBox.width + CHECKOUT_PANEL_ANNOTATION_INSET * 2
		);
		const highlightHeight = snapPixel(
			previewButtonBox.height + CHECKOUT_PANEL_ANNOTATION_INSET * 2
		);

		drawPngRect(
			capturePng,
			highlightX,
			highlightY,
			highlightWidth,
			highlightHeight,
			ANNOTATION_RED
		);

		const tailX = snapPixel( highlightX - 50 );
		const tailY = snapPixel( highlightY + highlightHeight / 2 );
		const tip = arrowTipBeforeRect(
			tailX,
			tailY,
			highlightX,
			highlightY,
			highlightWidth,
			highlightHeight,
			KEY_SETTINGS_ARROW_TIP_GAP
		);

		drawPngSolidArrow(
			capturePng,
			tailX,
			tailY,
			tip.x,
			tip.y,
			ANNOTATION_RED
		);
	}

	writeFileSync( outputAbs, PNG.sync.write( capturePng ) );
}

/**
 * Editor view with checkout preview open and the Preview button outlined.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function capturePricingPagePreview( page, outputAbs, capture ) {
	await capturePricingCheckoutPreviewEditor( page, outputAbs, capture, {
		annotatePreview: true,
	} );
}

/**
 * Editor view with checkout preview open for the documentation homepage.
 *
 * @param {import('playwright').Page} page
 * @param {string} outputAbs
 * @param {{ padding?: number }} capture
 */
async function captureDocsHomepagePreview( page, outputAbs, capture ) {
	await capturePricingCheckoutPreviewEditor( page, outputAbs, capture );
}

/**
 * @param {import('playwright').Page} page
 */
async function preparePricingPagePreview( page ) {
	await closeListViewIfOpen( page );
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );
	await ensureBlockSettingsTab( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingCheckoutButton( page );
	await collapseLayoutPanel( page );
	await openFreemiusPanel( page );
	await ensureCheckoutEnabled( page );
	await page.waitForTimeout( 1500 );
	await scrollSidebarToPreviewButton( page );
	await openPricingCheckoutPreview( page );
	await ensureCheckoutOverlayFullyVisible( page, { padding: 24 } );
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function preparePricingPageModifiersRow( page ) {
	await closeListViewIfOpen( page );
	await deselectAllBlocks( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function preparePricingPagePlanColumn( page ) {
	await closeListViewIfOpen( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();
	await selectPricingPlanColumn( page, 0 );
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopeModifiers( page ) {
	await closeListViewIfOpen( page );
	await ensureBlockSidebarOpen( page );
	await ensureBlockInspectorTab( page );
	await ensureBlockSettingsTab( page );

	const pricingSection = pricingTableSectionLocator( page );

	if ( ( await pricingSection.count() ) === 0 ) {
		throw new Error(
			'Pricing table section not found on fixture post 428 — add the Freemius pricing layout from the playground'
		);
	}

	await pricingSection.scrollIntoViewIfNeeded();

	const modifiersRow = pricingModifiersRowGroupLocator( page );
	const modifier = modifiersRow
		.locator( '[data-type="freemius/modifier"]' )
		.first();

	if ( ( await modifier.count() ) === 0 ) {
		throw new Error(
			'Freemius Scope modifier block not found on fixture post 428'
		);
	}

	await modifier.click();
	await page.waitForTimeout( 500 );
	await openFreemiusPanel( page );
	await page
		.getByLabel( 'Type', { exact: true } )
		.waitFor( { state: 'visible', timeout: 10_000 } );
	await dismissAutosaveNoticeIfPresent( page );
	await page.waitForTimeout( 300 );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareSettingsEditor( page ) {
	await page.waitForSelector( '#freemius-settings-app', {
		timeout: 15_000,
	} );

	const editorTab = page.getByRole( 'tab', {
		name: 'Editor Settings',
		exact: true,
	} );

	if ( ( await editorTab.count() ) > 0 ) {
		await editorTab.click();
		await page.waitForTimeout( 300 );
	}

	await page
		.getByLabel( 'Product ID', { exact: true } )
		.waitFor( { state: 'visible', timeout: 10_000 } );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareSettingsProducts( page ) {
	await page.waitForSelector( '#freemius-settings-app', {
		timeout: 15_000,
	} );

	const productsTab = page.getByRole( 'tab', {
		name: 'Products',
		exact: true,
	} );

	if ( ( await productsTab.count() ) > 0 ) {
		await productsTab.click();
		await page.waitForTimeout( 300 );
	}

	await page
		.getByLabel( 'Product ID', { exact: true } )
		.first()
		.waitFor( { state: 'visible', timeout: 10_000 } );
}

/** @type {Record<string, (page: import('playwright').Page) => Promise<void>>} */
const PRE_CAPTURE_ACTIONS = {
	'button-overview': prepareButtonOverview,
	'button-key-settings': prepareButtonKeySettings,
	'button-track-callback': prepareButtonTrackCallback,
	'scope-columns-overview': prepareScopeColumnsOverview,
	'scope-enable-checkout': prepareScopeEnableCheckout,
	'scope-pricing-mapped': prepareScopePricingMapped,
	'pricing-page-checkout-button': preparePricingPageCheckoutButton,
	'pricing-page-modifiers-row': preparePricingPageModifiersRow,
	'pricing-page-plan-column': preparePricingPagePlanColumn,
	'docs-homepage-preview': preparePricingPagePreview,
	'pricing-page-preview': preparePricingPagePreview,
	'scope-modifiers': prepareScopeModifiers,
	'settings-editor': prepareSettingsEditor,
	'settings-products': prepareSettingsProducts,
};

/**
 * @param {unknown} manifest
 */
function writeManifest( manifest ) {
	const sortedImages = [ ...manifest.images ].sort( ( a, b ) =>
		a.id.localeCompare( b.id )
	);

	const output = {
		$schema: manifest.$schema ?? './image-manifest.schema.json',
		version: manifest.version,
		viewports: manifest.viewports,
		images: sortedImages.map( ( entry ) => sortEntryKeys( entry ) ),
	};

	writeFileSync(
		manifestPath,
		`${ JSON.stringify( output, null, '\t' ) }\n`,
		'utf8'
	);
}

/**
 * @param {Record<string, unknown>} entry
 */
function sortEntryKeys( entry ) {
	/** @type {Record<string, unknown>} */
	const sorted = {};
	for ( const key of ENTRY_KEY_ORDER ) {
		if ( entry[ key ] !== undefined ) {
			sorted[ key ] = entry[ key ];
		}
	}
	return sorted;
}

/**
 * Verify a manifest image reference exists in user-facing doc markdown.
 * Does not modify markdown — docs/ is end-user content only.
 *
 * @param {{ embed: { doc: string, alt: string } }} entry
 */
function verifyDocImageReference( entry ) {
	const docAbs = resolve( rootDir, entry.embed.doc );
	const markdown = readFileSync( docAbs, 'utf8' );
	const pattern = new RegExp(
		`!\\[${ entry.embed.alt.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }\\]\\([^)]+\\)`
	);

	if ( ! pattern.test( markdown ) ) {
		throw new Error(
			`No image reference found for alt "${ entry.embed.alt }" in ${ entry.embed.doc }`
		);
	}
}

/**
 * @param {string} fromPath
 * @param {string} toPath
 */
function copyAsset( fromPath, toPath ) {
	const fromAbs = resolve( rootDir, fromPath );
	const toAbs = resolve( rootDir, toPath );
	mkdirSync( dirname( toAbs ), { recursive: true } );
	copyFileSync( fromAbs, toAbs );
}

/**
 * @param {Array<{ embed: { path: string } }>} entries
 * @param {string} sourcePath
 */
function resolveBaselinePath( entries, sourcePath ) {
	for ( const entry of entries ) {
		if ( existsSync( resolve( rootDir, entry.embed.path ) ) ) {
			return entry.embed.path;
		}
	}

	if ( existsSync( resolve( rootDir, sourcePath ) ) ) {
		return sourcePath;
	}

	return null;
}

/**
 * @param {import('playwright').Page} page
 * @param {{ selector: string, regionFrom?: string, regionTo?: string, padding?: number }} capture
 */
async function measureRegionClip( page, capture ) {
	const sidebar = sidebarLocator( page );
	const sidebarBox = await sidebar.boundingBox();

	if ( ! sidebarBox ) {
		throw new Error(
			`Capture selector is not visible: ${ capture.selector }`
		);
	}

	const fromEl = page.locator( capture.regionFrom ).first();
	const toEl = page.locator( capture.regionTo ).first();
	const fromBox = await fromEl.boundingBox();
	const toBox = await toEl.boundingBox();

	if ( ! fromBox || ! toBox ) {
		throw new Error(
			`Region markers not visible (${ capture.regionFrom } → ${ capture.regionTo })`
		);
	}

	const padding = capture.padding ?? 0;

	return {
		x: sidebarBox.x,
		y: Math.max( 0, fromBox.y - padding ),
		width: sidebarBox.width,
		height: toBox.y + toBox.height - fromBox.y + padding * 2,
	};
}

/**
 * @param {import('playwright').Page} page
 * @param {{ id: string, capture: { url: string, viewports: string[], selector?: string, regionFrom?: string, regionTo?: string, padding?: number } }} entry
 * @param {Record<string, { width: number, height: number }>} viewports
 * @param {string} outputPath Repo-root-relative PNG path.
 */
async function captureScreenshot( page, entry, viewports, outputPath ) {
	const viewportName = entry.capture.viewports?.[ 0 ] ?? DOC_VIEWPORT;
	const viewport = viewports[ viewportName ];
	if ( ! viewport ) {
		throw new Error(
			`Viewport "${ viewportName }" is not defined in image-manifest.json viewports`
		);
	}

	await page.setViewportSize( viewport );
	await page.goto( resolveCaptureUrl( entry.capture.url ), {
		waitUntil: 'domcontentloaded',
	} );
	if ( isSettingsCapture( entry ) ) {
		await waitForSettingsReady( page );
	} else if ( isFrontendCapture( entry ) ) {
		await page.waitForSelector( 'body', { timeout: 30_000 } );
		await page.waitForTimeout( CAPTURE_WAIT_MS );
	} else {
		await waitForEditorReady( page );
	}
	await page.waitForTimeout( CAPTURE_WAIT_MS );

	const preAction = PRE_CAPTURE_ACTIONS[ entry.id ];
	if ( preAction ) {
		await preAction( page );
		await page.waitForTimeout( 500 );
	}

	if ( entry.id !== 'button-key-settings' ) {
		await blurFocusedElement( page );
	}

	const outputAbs = resolve( rootDir, outputPath );
	mkdirSync( dirname( outputAbs ), { recursive: true } );

	if ( entry.capture.selector ) {
		if ( entry.id === 'button-key-settings' ) {
			await captureButtonKeySettings( page, outputAbs );
			return;
		}

		if ( entry.id === 'button-overview' ) {
			await captureButtonOverview( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'button-track-callback' ) {
			await captureButtonTrackCallback( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'scope-columns-overview' ) {
			await captureScopeColumnsOverview( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'scope-enable-checkout' ) {
			await captureScopeEnableCheckout( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'pricing-page-checkout-button' ) {
			await capturePricingPageCheckoutButton(
				page,
				outputAbs,
				entry.capture
			);
			return;
		}

		if ( entry.id === 'pricing-page-modifiers-row' ) {
			await capturePricingPageModifiersRow(
				page,
				outputAbs,
				entry.capture
			);
			return;
		}

		if ( entry.id === 'scope-modifiers' ) {
			await captureScopeModifiers( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'pricing-page-plan-column' ) {
			await capturePricingPagePlanColumn(
				page,
				outputAbs,
				entry.capture
			);
			return;
		}

		if ( entry.id === 'pricing-page-preview' ) {
			await capturePricingPagePreview( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'docs-homepage-preview' ) {
			await captureDocsHomepagePreview( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'settings-editor' ) {
			await captureSettingsEditor( page, outputAbs, entry.capture );
			return;
		}

		if ( entry.id === 'settings-products' ) {
			await captureSettingsProducts( page, outputAbs, entry.capture );
			return;
		}

		if ( isEditorCanvasCapture( entry ) ) {
			await captureScopePricingMapped( page, outputAbs, entry.capture );
			return;
		}

		if ( isFrontendCapture( entry ) ) {
			const target = page.locator( entry.capture.selector ).first();
			if ( ( await target.count() ) === 0 ) {
				throw new Error(
					`Capture selector not found: ${ entry.capture.selector }`
				);
			}

			const padding = entry.capture.padding ?? 0;

			if ( padding > 0 ) {
				const box = await target.boundingBox();
				if ( ! box ) {
					throw new Error(
						`Capture selector is not visible: ${ entry.capture.selector }`
					);
				}

				const x = Math.max( 0, box.x - padding );
				const y = Math.max( 0, box.y - padding );
				const viewportSize = page.viewportSize();
				const viewportWidth = viewportSize?.width ?? viewport.width;
				const viewportHeight = viewportSize?.height ?? viewport.height;
				const right = Math.min(
					viewportWidth,
					box.x + box.width + padding
				);
				const bottom = Math.min(
					viewportHeight,
					box.y + box.height + padding
				);

				await page.screenshot( {
					path: outputAbs,
					clip: {
						x,
						y,
						width: right - x,
						height: bottom - y,
					},
				} );
				return;
			}

			await target.screenshot( { path: outputAbs } );
			return;
		}

		if ( isSettingsCapture( entry ) ) {
			const target = page.locator( entry.capture.selector ).first();
			if ( ( await target.count() ) === 0 ) {
				throw new Error(
					`Capture selector not found: ${ entry.capture.selector }`
				);
			}

			const padding = entry.capture.padding ?? 0;

			if ( padding > 0 ) {
				const box = await target.boundingBox();
				if ( ! box ) {
					throw new Error(
						`Capture selector is not visible: ${ entry.capture.selector }`
					);
				}

				const x = Math.max( 0, box.x - padding );
				const y = Math.max( 0, box.y - padding );
				const viewportSize = page.viewportSize();
				const viewportWidth = viewportSize?.width ?? viewport.width;
				const viewportHeight = viewportSize?.height ?? viewport.height;
				const right = Math.min(
					viewportWidth,
					box.x + box.width + padding
				);
				const bottom = Math.min(
					viewportHeight,
					box.y + box.height + padding
				);

				await page.screenshot( {
					path: outputAbs,
					clip: {
						x,
						y,
						width: right - x,
						height: bottom - y,
					},
				} );
				return;
			}

			await target.screenshot( { path: outputAbs } );
			return;
		}

		await ensureComplementaryAreaOpen( page );

		const target = sidebarLocator( page );
		if ( ( await target.count() ) === 0 ) {
			throw new Error(
				`Capture selector not found: ${ entry.capture.selector }`
			);
		}

		if ( entry.capture.regionFrom && entry.capture.regionTo ) {
			const clip = await measureRegionClip( page, entry.capture );
			await page.screenshot( {
				path: outputAbs,
				clip,
			} );
			return;
		}

		const padding = entry.capture.padding ?? 0;

		if ( padding > 0 ) {
			const box = await target.boundingBox();
			if ( ! box ) {
				throw new Error(
					`Capture selector is not visible: ${ entry.capture.selector }`
				);
			}

			const x = Math.max( 0, box.x - padding );
			const y = Math.max( 0, box.y - padding );
			const viewportSize = page.viewportSize();
			const viewportWidth = viewportSize?.width ?? viewport.width;
			const viewportHeight = viewportSize?.height ?? viewport.height;
			const right = Math.min(
				viewportWidth,
				box.x + box.width + padding
			);
			const bottom = Math.min(
				viewportHeight,
				box.y + box.height + padding
			);

			await page.screenshot( {
				path: outputAbs,
				clip: {
					x,
					y,
					width: right - x,
					height: bottom - y,
				},
			} );
			return;
		}

		await target.screenshot( { path: outputAbs } );
		return;
	}

	await page.screenshot( { path: outputAbs, fullPage: false } );
}

/**
 * @param {import('playwright').BrowserType} chromium
 * @param {string} url
 */
async function assertSiteReachable( chromium, url ) {
	let browser;
	try {
		browser = await chromium.launch( { timeout: 30_000 } );
		const page = await browser.newPage( { ignoreHTTPSErrors: true } );
		const response = await page.goto( url, {
			waitUntil: 'domcontentloaded',
			timeout: 30_000,
		} );
		const status = response?.status() ?? 0;
		if ( ! response || ( status >= 400 && status < 600 ) ) {
			throw new Error( `HTTP ${ status || 'error' }` );
		}
	} finally {
		await browser?.close();
	}
}

/**
 * @param {string} id
 * @returns {string}
 */
function reviewSourcePath( id ) {
	return `screenshots/${ id }/source.png`;
}

/**
 * @param {string[]} argv
 * @returns {{ filterId: string | null, help: boolean, force: boolean }}
 */
function parseCliArgs( argv ) {
	const args = argv.slice( 2 );

	if ( args.includes( '--help' ) || args.includes( '-h' ) ) {
		return { filterId: null, help: true, force: false };
	}

	const force = args.includes( '--force' ) || args.includes( '-f' );
	const filteredArgs = args.filter(
		( arg ) =>
			arg !== '--force' &&
			arg !== '-f' &&
			arg !== '--help' &&
			arg !== '-h'
	);

	const idFlag = filteredArgs.find( ( arg ) => arg.startsWith( '--id=' ) );
	if ( idFlag ) {
		const id = idFlag.slice( '--id='.length ).trim();
		if ( ! id ) {
			console.error( '--id requires a manifest entry id.' );
			process.exit( 1 );
		}
		return { filterId: id, help: false, force };
	}

	const positional = filteredArgs.filter( ( arg ) => ! arg.startsWith( '-' ) );

	if ( positional.length > 1 ) {
		console.error(
			'Pass at most one manifest id, or omit the argument to capture all docs entries.'
		);
		process.exit( 1 );
	}

	return {
		filterId: positional[ 0 ] ?? null,
		help: false,
		force,
	};
}

/**
 * @param {Array<{ id: string }>} captureEntries
 * @param {Array<{ id: string }>} reviewCaptureEntries
 */
function printUsage( captureEntries, reviewCaptureEntries = [] ) {
	const ids = captureEntries.map( ( entry ) => entry.id ).sort();
	const reviewIds = reviewCaptureEntries.map( ( entry ) => entry.id ).sort();

	console.log( `Usage:
  npm run update-screenshots
  npm run update-screenshots -- <manifest-id>
  npm run update-screenshots -- --force <manifest-id>

Capturable docs ids (${ ids.length }):
${ ids.map( ( id ) => `  - ${ id }` ).join( '\n' ) }
${
	reviewIds.length
		? `\nReview-only ids (single-id capture only, ${
				reviewIds.length
		  }):\n${ reviewIds.map( ( id ) => `  - ${ id }` ).join( '\n' ) }`
		: ''
}
` );
}

/**
 * @param {Array<{ status: string }>} batchResults
 * @returns {'ok' | 'error' | 'skipped'}
 */
function captureLineStatus( batchResults ) {
	if ( batchResults.some( ( row ) => row.status === 'error' ) ) {
		return 'error';
	}

	if (
		batchResults.length > 0 &&
		batchResults.every( ( row ) => row.status === 'unchanged' )
	) {
		return 'skipped';
	}

	return 'ok';
}

/**
 * @param {string} linePrefix
 * @param {'ok' | 'error' | 'skipped'} status
 */
function logCaptureLine( linePrefix, status ) {
	console.log( `${ linePrefix } ${ status }` );
}

/**
 * @param {import('playwright').BrowserType} chromium
 * @param {unknown} manifest
 * @param {{ id: string, capture: { url: string } }} entry
 */
async function captureReviewEntry( chromium, manifest, entry ) {
	const probeUrl = resolveCaptureUrl( entry.capture.url );
	console.log( `  Checking ${ probeUrl }…` );

	try {
		await assertSiteReachable( chromium, probeUrl );
	} catch ( error ) {
		if ( isMissingBrowserError( error ) ) {
			printPlaywrightHelp();
			process.exit( 1 );
		}
		console.error(
			`Local site not reachable at ${ probeUrl } — start dev.local and ensure auto-login works.`
		);
		console.error( String( error ) );
		process.exit( 1 );
	}

	let browser;
	try {
		browser = await chromium.launch();
	} catch ( error ) {
		if ( isMissingBrowserError( error ) ) {
			printPlaywrightHelp();
			process.exit( 1 );
		}
		throw error;
	}

	const page = await browser.newPage( { ignoreHTTPSErrors: true } );
	const outputPath = reviewSourcePath( entry.id );

	try {
		await captureScreenshot(
			page,
			entry,
			manifest.viewports,
			outputPath
		);
		logCaptureLine( `  [1/1] Capturing ${ entry.id }…`, 'ok' );
	} catch ( error ) {
		logCaptureLine( `  [1/1] Capturing ${ entry.id }…`, 'error' );
		console.error( String( error ) );
		process.exit( 1 );
	} finally {
		await browser.close();
	}

	console.log( 'Ready.. (1 updated)' );
}

async function main() {
	const { filterId, help, force } = parseCliArgs( process.argv );

	const chromium = loadChromium();
	if ( ! chromium ) {
		printPlaywrightHelp();
		process.exit( 1 );
	}

	const manifest = JSON.parse( readFileSync( manifestPath, 'utf8' ) );
	const allDocsEntries = manifest.images.filter(
		( entry ) => entry.use === 'docs' && entry.embed
	);
	const allCaptureEntries = allDocsEntries.filter(
		( entry ) => entry.capture
	);
	const allReviewCaptureEntries = manifest.images.filter(
		( entry ) => entry.use === 'review' && entry.capture
	);

	if ( help ) {
		printUsage( allCaptureEntries, allReviewCaptureEntries );
		process.exit( 0 );
	}

	if ( filterId ) {
		const entry = manifest.images.find( ( item ) => item.id === filterId );

		if ( ! entry ) {
			console.error( `Unknown manifest id "${ filterId }".` );
			printUsage( allCaptureEntries, allReviewCaptureEntries );
			process.exit( 1 );
		}

		if ( ! entry.capture ) {
			console.error(
				`"${ filterId }" has no capture block — add capture.url and capture.viewports first.`
			);
			process.exit( 1 );
		}

		if ( entry.use === 'review' ) {
			console.log( `Starting.. (1 review screenshot: ${ filterId })` );
			await captureReviewEntry( chromium, manifest, entry );
			return;
		}

		if ( entry.use !== 'docs' || ! entry.embed ) {
			console.error(
				`"${ filterId }" is not a docs embed entry (use: docs with embed block required).`
			);
			process.exit( 1 );
		}
	}

	if ( allCaptureEntries.length === 0 ) {
		console.error(
			'No docs manifest entries with capture blocks — add capture.url and capture.viewports first.'
		);
		process.exit( 1 );
	}

	let docsEntries = allDocsEntries;
	let captureEntries = allCaptureEntries;

	if ( filterId ) {
		const entry = manifest.images.find( ( item ) => item.id === filterId );
		docsEntries = [ entry ];
		captureEntries = [ entry ];
	}

	const captureCount = captureEntries.length;
	console.log(
		filterId
			? `Starting.. (1 screenshot: ${ filterId })`
			: `Starting.. (${ captureCount } screenshots)`
	);

	const probeUrl = resolveCaptureUrl( captureEntries[ 0 ].capture.url );
	console.log( `  Checking ${ probeUrl }…` );
	const compareOptions = getScreenshotCompareOptions();
	if ( force ) {
		compareOptions.disabled = true;
	}

	try {
		await assertSiteReachable( chromium, probeUrl );
	} catch ( error ) {
		if ( isMissingBrowserError( error ) ) {
			printPlaywrightHelp();
			process.exit( 1 );
		}
		console.error(
			`Local site not reachable at ${ probeUrl } — start dev.local and ensure auto-login works.`
		);
		console.error( String( error ) );
		process.exit( 1 );
	}

	/** @type {Map<string, typeof docsEntries>} */
	const bySource = new Map();
	for ( const entry of docsEntries ) {
		const key = entry.embed.from;
		if ( ! bySource.has( key ) ) {
			bySource.set( key, [] );
		}
		bySource.get( key ).push( entry );
	}

	/** @type {Map<string, typeof captureEntries[number]>} */
	const captureBySource = new Map();
	for ( const entry of captureEntries ) {
		if ( filterId ) {
			captureBySource.set( entry.embed.from, entry );
			continue;
		}

		if ( ! captureBySource.has( entry.embed.from ) ) {
			captureBySource.set( entry.embed.from, entry );
		}
	}

	/** @type {Array<{ id: string, url: string, output: string, status: string, detail?: string }>} */
	const results = [];
	let manifestDirty = false;

	let browser;
	try {
		browser = await chromium.launch();
	} catch ( error ) {
		if ( isMissingBrowserError( error ) ) {
			printPlaywrightHelp();
			process.exit( 1 );
		}
		throw error;
	}

	const page = await browser.newPage( { ignoreHTTPSErrors: true } );

	let captureIndex = 0;

	try {
		for ( const [ sourcePath, primary ] of captureBySource ) {
			const url = resolveCaptureUrl( primary.capture.url );
			let captureError = null;

			captureIndex += 1;
			const relatedEntries = bySource.get( sourcePath ) ?? [ primary ];
			const relatedIds = relatedEntries
				.map( ( entry ) => entry.id )
				.join( ', ' );
			const linePrefix = `  [${ captureIndex }/${ captureBySource.size }] Capturing ${ relatedIds }…`;
			/** @type {Array<{ id: string, url: string, output: string, status: string, detail?: string }>} */
			const batchResults = [];

			try {
				const tempCapturePath = `${ sourcePath }.capture-tmp.png`;
				await captureScreenshot(
					page,
					primary,
					manifest.viewports,
					tempCapturePath
				);

				const baselinePath = resolveBaselinePath(
					relatedEntries,
					sourcePath
				);
				const entryCompareOptions = resolveCompareOptionsForCapture(
					compareOptions,
					primary.capture
				);
				const compareResult = baselinePath
					? await compareScreenshotFiles(
							resolve( rootDir, baselinePath ),
							resolve( rootDir, tempCapturePath ),
							entryCompareOptions
					  )
					: {
							action: 'update',
							diffRatio: 1,
							reason: 'no baseline file',
					  };

				const tempCaptureAbs = resolve( rootDir, tempCapturePath );

				if ( compareResult.action === 'skip' ) {
					unlinkSync( tempCaptureAbs );
					for ( const entry of relatedEntries ) {
						batchResults.push( {
							id: entry.id,
							url,
							output: entry.embed.path,
							status: 'unchanged',
							detail: compareResult.reason,
						} );
					}
					logCaptureLine(
						linePrefix,
						captureLineStatus( batchResults )
					);
					results.push( ...batchResults );
					continue;
				}

				if ( compareResult.action === 'abort' ) {
					unlinkSync( tempCaptureAbs );
					for ( const entry of relatedEntries ) {
						batchResults.push( {
							id: entry.id,
							url,
							output: entry.embed.path,
							status: 'error',
							detail: `Screenshot comparison aborted: ${ compareResult.reason }`,
						} );
					}
					logCaptureLine(
						linePrefix,
						captureLineStatus( batchResults )
					);
					results.push( ...batchResults );
					continue;
				}

				copyAsset( tempCapturePath, sourcePath );
				unlinkSync( tempCaptureAbs );
			} catch ( error ) {
				captureError = error;
			}

			if ( captureError ) {
				for ( const entry of relatedEntries ) {
					batchResults.push( {
						id: entry.id,
						url,
						output: entry.embed.path,
						status: 'error',
						detail: String( captureError ),
					} );
				}
				logCaptureLine( linePrefix, captureLineStatus( batchResults ) );
				results.push( ...batchResults );
				continue;
			}

			for ( const entry of relatedEntries ) {
				try {
					copyAsset( sourcePath, entry.embed.path );
					verifyDocImageReference( entry );
					entry.embed.status = 'captured';
					manifestDirty = true;
					batchResults.push( {
						id: entry.id,
						url,
						output: entry.embed.path,
						status: relatedEntries.length > 1 ? 'copied' : 'ok',
					} );
				} catch ( error ) {
					batchResults.push( {
						id: entry.id,
						url,
						output: entry.embed.path,
						status: 'error',
						detail: String( error ),
					} );
				}
			}

			logCaptureLine( linePrefix, captureLineStatus( batchResults ) );
			results.push( ...batchResults );
		}
	} finally {
		await browser.close();
	}

	if ( manifestDirty ) {
		writeManifest( manifest );
		console.log( '  Syncing screenshots inventory…' );
		syncScreenshotsDocsPage();
	}

	results.sort( ( a, b ) => a.id.localeCompare( b.id ) );

	const failures = results.filter( ( row ) => row.status === 'error' );
	const unchanged = results.filter( ( row ) => row.status === 'unchanged' );
	const updated = results.filter( ( row ) =>
		[ 'ok', 'copied' ].includes( row.status )
	);

	if ( failures.length === 0 ) {
		const parts = [];
		if ( updated.length > 0 ) {
			parts.push( `${ updated.length } updated` );
		}
		if ( unchanged.length > 0 ) {
			parts.push( `${ unchanged.length } unchanged` );
		}
		console.log( `Ready.. (${ parts.join( ', ' ) || 'no captures' })` );
	} else {
		console.log(
			`Ready.. (${ updated.length } updated, ${ unchanged.length } unchanged, ${ failures.length } failed)`
		);
	}

	console.log( '\nDoc screenshot summary:\n' );
	console.log(
		'| id | url | output | status |',
		'\n| --- | --- | --- | --- |'
	);
	for ( const row of results ) {
		const detail = row.detail ? ` (${ row.detail })` : '';
		console.log(
			`| ${ row.id } | ${ row.url } | ${ row.output } | ${ row.status }${ detail } |`
		);
	}

	if ( failures.length > 0 ) {
		process.exit( 1 );
	}
}

main().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
