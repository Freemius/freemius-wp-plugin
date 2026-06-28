/**
 * Shared helpers for manifest-driven screenshot captions in doc markdown.
 */

/**
 * @param {string} description Manifest `description` (falls back to alt when empty).
 * @param {'placeholder' | 'captured' | string} status Manifest `embed.status`.
 * @returns {string} Italic caption line (without surrounding newlines).
 */
export function buildCaptionLine( description, status ) {
	const text = ( description ?? '' ).trim().replace( /\.$/, '' );
	if ( status === 'placeholder' ) {
		return `*Placeholder: ${ text } (screenshot capture pending).*`;
	}
	return `*${ text }.*`;
}

/**
 * @param {string} alt
 */
export function escapeRegExp( alt ) {
	return alt.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Match `![alt](path)` and an optional following italic caption line.
 *
 * @param {string} alt
 */
export function imageWithCaptionPattern( alt ) {
	return new RegExp(
		`!\\[${ escapeRegExp( alt ) }\\]\\([^)]+\\)(?:\\n\\n\\*.+\\*)?`,
		'g'
	);
}

/**
 * @param {string} markdown
 * @param {string} alt
 * @returns {boolean}
 */
export function hasImageReference( markdown, alt ) {
	const pattern = new RegExp(
		`!\\[${ escapeRegExp( alt ) }\\]\\([^)]+\\)`
	);
	return pattern.test( markdown );
}

/**
 * Upsert caption after a manifest image reference in markdown.
 *
 * @param {string} markdown
 * @param {string} alt
 * @param {string} relativeAsset Path relative to the doc file.
 * @param {string} description
 * @param {'placeholder' | 'captured' | string} status
 * @returns {{ markdown: string, updated: boolean, found: boolean }}
 */
export function upsertImageCaption(
	markdown,
	alt,
	relativeAsset,
	description,
	status
) {
	if ( ! hasImageReference( markdown, alt ) ) {
		return { markdown, updated: false, found: false };
	}

	const pattern = imageWithCaptionPattern( alt );
	const captionLine = buildCaptionLine( description, status );
	const imageLine = `![${ alt }](${ relativeAsset })`;
	const replacement = `${ imageLine }\n\n${ captionLine }`;
	const nextMarkdown = markdown.replace( pattern, replacement );

	return {
		markdown: nextMarkdown,
		updated: nextMarkdown !== markdown,
		found: true,
	};
}
