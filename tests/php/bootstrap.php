<?php
/**
 * PHPUnit bootstrap — defines minimal WordPress constants and loads plugin classes.
 *
 * @package Freemius
 */

declare(strict_types=1);

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals -- WordPress API stubs for PHPUnit.

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', sys_get_temp_dir() . '/freemius-phpunit-abspath/' );
}

$freemius_plugin_root = dirname( __DIR__, 2 );

if ( ! defined( 'FREEMIUS_PLUGIN_DIR' ) ) {
	define( 'FREEMIUS_PLUGIN_DIR', $freemius_plugin_root . '/' );
}

if ( ! defined( 'FREEMIUS_PLUGIN_URL' ) ) {
	define( 'FREEMIUS_PLUGIN_URL', 'http://example.org/wp-content/plugins/freemius/' );
}

if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	define( 'HOUR_IN_SECONDS', 3600 );
}

if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

require_once $freemius_plugin_root . '/vendor/autoload.php';
require_once __DIR__ . '/stubs/wp-classes.php';

/**
 * Copy committed build fixtures into build/ when webpack output is absent.
 *
 * @param string $plugin_root Plugin root path.
 */
function freemius_phpunit_prepare_build_fixtures( string $plugin_root ): void {
	$fixtures_root = $plugin_root . '/tests/fixtures/build';
	$build_root    = $plugin_root . '/build';

	if ( ! is_dir( $fixtures_root ) ) {
		return;
	}

	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $fixtures_root, RecursiveDirectoryIterator::SKIP_DOTS ),
		RecursiveIteratorIterator::SELF_FIRST
	);

	foreach ( $iterator as $item ) {
		if ( ! $item->isFile() ) {
			continue;
		}

		$relative = substr( $item->getPathname(), strlen( $fixtures_root ) + 1 );
		$target   = $build_root . '/' . $relative;

		if ( file_exists( $target ) ) {
			continue;
		}

		$target_dir = dirname( $target );
		if ( ! is_dir( $target_dir ) ) {
			mkdir( $target_dir, 0777, true );
		}

		copy( $item->getPathname(), $target );
	}
}

freemius_phpunit_prepare_build_fixtures( $freemius_plugin_root );

spl_autoload_register(
	static function ( string $class_name ) {
		$prefix = 'Freemius\\';

		$len = strlen( $prefix );
		if ( strncmp( $prefix, $class_name, $len ) !== 0 ) {
			return;
		}

		$relative_class = substr( $class_name, $len );
		$base_dir       = FREEMIUS_PLUGIN_DIR . 'includes/';
		$file           = $base_dir . 'class-freemius-' . strtolower( str_replace( '_', '-', $relative_class ) ) . '.php';

		if ( file_exists( $file ) ) {
			require $file;
		}
	}
);
