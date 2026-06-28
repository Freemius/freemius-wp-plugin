/**
 * ESLint flat config: WordPress Scripts defaults plus project overrides.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/
 */
const globals = require( 'globals' );
const wpScriptsEslintConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...wpScriptsEslintConfig,
	{
		ignores: [
			'**/build/**',
			'**/node_modules/**',
			'**/vendor/**',
		],
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				FS: 'readonly',
			},
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: [ '.js', '.jsx' ],
				},
			},
		},
		rules: {
			curly: [ 'error', 'multi' ],
			'@wordpress/no-unsafe-wp-apis': 'off',
			'@wordpress/no-base-control-with-label-without-id': 'off',
			'@wordpress/no-unused-vars-before-return': 'off',
			'@wordpress/i18n-translator-comments': 'off',
			'jsdoc/check-line-alignment': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns-description': 'off',
			'no-console': 'off',
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'no-shadow': 'off',
			'no-nested-ternary': 'off',
			'camelcase': 'off',
			'eqeqeq': 'off',
			'react-hooks/rules-of-hooks': 'off',
			'no-unused-expressions': 'off',
			'no-alert': 'off',
			'jsx-a11y/click-events-have-key-events': 'off',
			'jsx-a11y/no-static-element-interactions': 'off',
			'jsx-a11y/anchor-is-valid': 'off',
			'import/no-unresolved': 'off',
			'import/no-extraneous-dependencies': 'off',
		},
	},
];
