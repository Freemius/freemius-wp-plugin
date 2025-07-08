<?php

namespace Freemius;

/**
 * Plugin Name:       Freemius for WordPress
 * Description:       Freemius Toolkit
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Version:           0.2.2
 * Author:            Freemius
 * Author URI:        https://freemius.com
 * License:           MIT
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'FREEMIUS_PLUGIN_DIR', __DIR__ );
define( 'FREEMIUS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once __DIR__ . '/vendor/autoload.php';

// Autoload classes
spl_autoload_register(
	function ( $class ) {
		// Project-specific namespace prefix
		$prefix = 'Freemius\\';

		// Base directory for the namespace prefix
		$base_dir = FREEMIUS_PLUGIN_DIR . '/includes/';

		// Check if the class uses the namespace prefix
		$len = strlen( $prefix );
		if ( strncmp( $prefix, $class, $len ) !== 0 ) {
			return;
		}

		// Get the relative class name
		$relative_class = substr( $class, $len );

		// Replace namespace separators with directory separators
		$file = $base_dir . 'class-freemius-' . strtolower( str_replace( '_', '-', $relative_class ) ) . '.php';

		// If the file exists, require it
		if ( file_exists( $file ) ) {
			require $file;
		}
	}
);

function init() {
	Button::get_instance();
	Pricing::get_instance();
}
\add_action( 'plugins_loaded', __NAMESPACE__ . '\\init' );


/**
 * Plugin activation hook
 *
 * @return void
 */
function activate() {
}
register_activation_hook( __FILE__, __NAMESPACE__ . '\\activate' );

/**
 * Plugin deactivation hook
 *
 * @return void
 */
function deactivate() {
}
register_deactivation_hook( __FILE__, __NAMESPACE__ . '\\deactivate' );
