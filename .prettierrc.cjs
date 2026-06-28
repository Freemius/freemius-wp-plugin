/**
 * Same formatting rules as `npm run format` / `wp-scripts format`
 * (@wordpress/prettier-config + wp-prettier).
 */
const base = require( '@wordpress/prettier-config' );

module.exports = {
	...base,
	overrides: [
		...( Array.isArray( base.overrides ) ? base.overrides : [] ),
		{
			files: '*.{css,scss,sass}',
			options: {
				useTabs: true,
				tabWidth: 4,
			},
		},
	],
};
