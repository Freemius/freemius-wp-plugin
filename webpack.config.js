const defaultConfig = require('@wordpress/scripts/config/webpack.config');

// Import the helper to find and generate the entry points in the src directory
const { getWebpackEntryPoints } = require('@wordpress/scripts/utils/config');

const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const SoundsPlugin = require('sounds-webpack-plugin');

const path = require('path');
const cp = require('child_process');
const { sprintf } = require('@wordpress/i18n');

const soundPluginOptions = {
	sounds: {
		warning: '/System/Library/Sounds/Basso.aiff',
	},
	notifications: {
		done(stats) {
			let message;
			if (stats.hasErrors()) {
				message = stats.compilation.errors;
			} else if (stats.hasWarnings()) {
				message = stats.compilation.warnings;
			} else {
				return;
			}

			this.play('warning');

			message = message
				.join('')
				.split('\n')
				.slice(-1)
				.join('')
				.replace(path.resolve(__dirname), '');

			message = sprintf(
				'display notification "%s" with title "Error while building" subtitle "More text"',
				message
			);

			cp.spawnSync('osascript', ['-e', message], { encoding: 'utf8' });
		},
	},
};

const customEntries = {
	'settings/index': './src/settings/index.js',
	'button/index': './src/button/index.js',
	'button/view': './src/button/view.js',
	'scope/index': './src/scope/index.js',
	'scope/view': './src/scope/view.js',
};

module.exports = {
	...defaultConfig,
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000,
	},
	entry: {
		...getWebpackEntryPoints(),
		...customEntries,
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			// Add additional rules as needed.
		],
	},

	plugins: [
		...defaultConfig.plugins,
		new SoundsPlugin(soundPluginOptions),
		new RemoveEmptyScriptsPlugin(),
	],
};
