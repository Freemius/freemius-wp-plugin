const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

const customEntries = {
	'settings/index': './src/settings/index.js',
	'button/view': './src/button/view.js',
	'scope/index': './src/scope/index.js',
	'scope/view': './src/scope/view.js',

	//'blocks/modifier/index': './src/blocks/modifier/index.js',
	//'blocks/modifier/view': './src/blocks/modifier/view.js',
};

module.exports = [
	...defaultConfig,
	{
		...defaultConfig[ 0 ],
		performance: {
			hints: false,
			maxEntrypointSize: 512000,
			maxAssetSize: 512000,
		},
		entry: {
			...defaultConfig[ 0 ].entry,
			...customEntries,
		},
		module: {
			...defaultConfig[ 0 ].module,
			rules: [ ...defaultConfig[ 0 ].module.rules ],
		},
		plugins: [
			...defaultConfig[ 0 ].plugins,
			new RemoveEmptyScriptsPlugin(),
		],
	},
];
