/**
 * Strip contributor-only caption lines from user-facing docs.
 *
 * User docs under docs/ must not contain manifest placeholders
 * or generated italic captions — only plugin guidance and images.
 *
 * Usage:
 *   node scripts/sync-screenshot-captions.mjs
 *   npm run sync:screenshot-captions
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const docsDir = resolve( rootDir, 'docs' );

/** @param {string} dir */
function collectMarkdownFiles( dir ) {
	/** @type {string[]} */
	const files = [];

	for ( const name of readdirSync( dir ) ) {
		const abs = join( dir, name );
		if ( statSync( abs ).isDirectory() ) {
			files.push( ...collectMarkdownFiles( abs ) );
			continue;
		}
		if ( name.endsWith( '.md' ) ) {
			files.push( abs );
		}
	}

	return files;
}

/**
 * Remove italic lines immediately following an image (placeholder or captured captions).
 *
 * @param {string} markdown
 */
function stripContributorCaptions( markdown ) {
	return markdown.replace(
		/(!\[[^\]]*\]\([^)]+\))\n\n\*(?:Placeholder: )?[^*\n]+\*\n/g,
		'$1\n\n'
	);
}

function main() {
	const files = collectMarkdownFiles( docsDir );
	let updatedCount = 0;

	for ( const abs of files ) {
		const markdown = readFileSync( abs, 'utf8' );
		const next = stripContributorCaptions( markdown );

		if ( next === markdown ) {
			continue;
		}

		writeFileSync( abs, next, 'utf8' );
		updatedCount += 1;
		console.log( `  ok ${ abs.replace( `${ rootDir }/`, '' ) }` );
	}

	console.log(
		`Caption cleanup: ${ updatedCount } updated (${ files.length } doc files scanned).`
	);
}

main();
