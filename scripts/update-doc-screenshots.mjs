/**
 * Regenerate documentation screenshots from screenshots/image-manifest.json.
 *
 * Usage:
 *   node scripts/update-doc-screenshots.mjs              # all docs entries with capture
 *   node scripts/update-doc-screenshots.mjs <id>         # single manifest id
 *   npm run update-screenshots -- button-checkout
 *   npm run update-screenshots -- --force button-checkout
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
 */
async function ensureBlockSidebarOpen( page ) {
	const settingsTab = page.getByRole( 'button', {
		name: 'Settings',
		exact: true,
	} );

	if (
		( await settingsTab.count() ) > 0 &&
		( await settingsTab.isVisible().catch( () => false ) )
	) {
		await settingsTab.click();
		await page.waitForTimeout( 300 );
	}
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
 * @param {import('playwright').Page} page
 */
async function waitForEditorReady( page ) {
	await page.waitForSelector(
		'.edit-post-layout, .block-editor-block-list__layout, .interface-interface-skeleton__editor',
		{ timeout: 30_000 }
	);
	await page.waitForTimeout( 1000 );
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
		await freemiusHeading.click();
		await page.waitForTimeout( 300 );
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
async function prepareButtonCheckout( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonScopes( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonKeySettings( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonPopoutEditor( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonCallbackEditor( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );

	const popout = page.getByRole( 'button', { name: /Popout Editor/i } );
	if ( ( await popout.count() ) > 0 ) {
		await popout.click();
		await page.waitForTimeout( 500 );
	}
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareButtonPreview( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopeEnableCheckout( page ) {
	await selectFirstButtonBlock( page );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopePricingMapped( page ) {
	const mapped = canvasButtonLocator( page );

	if ( ( await mapped.count() ) > 0 ) {
		await mapped.click();
	} else {
		await selectFirstButtonBlock( page );
	}

	await page.waitForTimeout( 500 );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareScopeModifiers( page ) {
	const modifier = canvasModifierLocator( page );

	if ( ( await modifier.count() ) === 0 ) {
		throw new Error(
			'Freemius Scope modifier block not found on fixture post 428'
		);
	}

	await modifier.click();
	await page.waitForTimeout( 500 );
	await openFreemiusPanel( page );
}

/**
 * @param {import('playwright').Page} page
 */
async function prepareSettingsFreemius( page ) {
	await page.waitForSelector( '#freemius-settings-root, .wrap', {
		timeout: 15_000,
	} );
}

/** @type {Record<string, (page: import('playwright').Page) => Promise<void>>} */
const PRE_CAPTURE_ACTIONS = {
	'button-checkout': prepareButtonCheckout,
	'button-scopes': prepareButtonScopes,
	'button-key-settings': prepareButtonKeySettings,
	'button-popout-editor': prepareButtonPopoutEditor,
	'button-callback-editor': prepareButtonCallbackEditor,
	'button-preview': prepareButtonPreview,
	'scope-enable-checkout': prepareScopeEnableCheckout,
	'scope-pricing-mapped': prepareScopePricingMapped,
	'scope-modifiers': prepareScopeModifiers,
	'settings-freemius': prepareSettingsFreemius,
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
 * @param {{ id: string, capture: { url: string, viewports: string[], selector?: string, padding?: number } }} entry
 * @param {Record<string, { width: number, height: number }>} viewports
 * @param {string} outputPath Repo-root-relative PNG path.
 */
async function captureScreenshot( page, entry, viewports, outputPath ) {
	const viewport = viewports[ DOC_VIEWPORT ];
	if ( ! viewport ) {
		throw new Error(
			`Desktop viewport is not defined in image-manifest.json viewports.${ DOC_VIEWPORT }`
		);
	}

	await page.setViewportSize( viewport );
	await page.goto( resolveCaptureUrl( entry.capture.url ), {
		waitUntil: 'domcontentloaded',
	} );
	await waitForEditorReady( page );
	await page.waitForTimeout( CAPTURE_WAIT_MS );

	const preAction = PRE_CAPTURE_ACTIONS[ entry.id ];
	if ( preAction ) {
		await preAction( page );
		await page.waitForTimeout( 500 );
	}

	await blurFocusedElement( page );

	const outputAbs = resolve( rootDir, outputPath );
	mkdirSync( dirname( outputAbs ), { recursive: true } );

	if ( entry.capture.selector ) {
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

	await page.screenshot( { path: outputAbs, fullPage: false } );
}

/**
 * @param {import('playwright').BrowserType} chromium
 * @param {string} url
 */
async function assertSiteReachable( chromium, url ) {
	let browser;
	try {
		browser = await chromium.launch();
		const page = await browser.newPage( { ignoreHTTPSErrors: true } );
		const response = await page.goto( url, {
			waitUntil: 'domcontentloaded',
			timeout: 30_000,
		} );
		if ( ! response || ! response.ok() ) {
			throw new Error( `HTTP ${ response?.status() ?? 'error' }` );
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
