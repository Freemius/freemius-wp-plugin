<?php

namespace Freemius;

use EverPress\WPUpdater;

/**
 * Plugin Name:       Freemius
 * Description:       Freemius Toolkit
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Version:           0.2.0
 * Author:            Xaver
 * Author URI:        https://freemius.com
 * License:           MIT
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/vendor/autoload.php';


// Initialize the updater
class_exists( 'EverPress\WPUpdater' ) && WPUpdater::add(
	'freemius/freemius.php',
	array(
		'repository' => 'Freemius/freemius-wp-plugin',
	)
);


\add_action( 'enqueue_block_assets', __NAMESPACE__ . '\block_script_styles', 1 );
function block_script_styles() {

	if ( ! is_admin() ) {
		return;
	}

	$plugin_dir = \plugin_dir_path( __FILE__ );
	$plugin_url = \plugin_dir_url( __FILE__ );

	// load from assets.php
	$freemius_dependencies = include $plugin_dir . 'build/freemius-button/editor.asset.php';

	// Freemius Button Block
	\wp_enqueue_script( 'freemius-button', $plugin_url . 'build/freemius-button/editor.js', $freemius_dependencies['dependencies'], $freemius_dependencies['version'], true );
	\wp_enqueue_style( 'freemius-button', $plugin_url . 'build/freemius-button/editor.css', array(), $freemius_dependencies['version'] );

	// TODO: load this via API in the editor.js
	\wp_add_inline_script( 'freemius-button', 'const freemius_button_schema = ' . wp_json_encode( get_schema() ) . '', true );
}



\add_filter( 'render_block_core/button', __NAMESPACE__ . '\render_button', 10, 3 );
function render_button( $block_content, $block, $instance ) {

	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}
	if ( ! isset( $block['attrs']['freemius_enabled'] ) || $block['attrs']['freemius_enabled'] === false ) {
		return $block_content;
	}

	// merge the data from the site, the page and the block
	$site_data   = \get_option( 'freemius_button', array() );
	$page_data   = \get_post_meta( get_the_ID(), 'freemius_button', true );
	$plugin_data = isset( $block['attrs']['freemius'] ) ? $block['attrs']['freemius'] : array();

	$data = array_merge( (array) $site_data, (array) $page_data, (array) $plugin_data );

	/**
	 * Filter the data that will be passed to the Freemius checkout.
	 *
	 * @param array $data The data that will be passed to the Freemius checkout.
	 */
	$data = \apply_filters( 'freemius_button_data', $data );

	$extra  = '';
	$extra .= '<script type="application/json" class="freemius-button-data">' . wp_json_encode( $data ) . '</script>';

	$plugin_dir = \plugin_dir_path( __FILE__ );
	$plugin_url = \plugin_dir_url( __FILE__ );

	\wp_enqueue_script( 'freemius-button-checkout', 'https://checkout.freemius.com/js/v1/', array(), 'v1', true );

	// load from assets.php
	$dependecied = include $plugin_dir . 'build/freemius-button/view.asset.php';
	\wp_enqueue_script( 'freemius-button-frontend', $plugin_url . 'build/freemius-button/view.js', $dependecied['dependencies'], $dependecied['version'], true );
	\wp_enqueue_style( 'freemius-button-frontend', $plugin_url . 'build/freemius-button/view.css', array(), $dependecied['version'] );

	return $extra . $block_content;
}


// register custom post meta to store the button data
\add_action( 'init', __NAMESPACE__ . '\register_post_meta' );
function register_post_meta() {

	\register_post_meta(
		'', // registered for all post types
		'freemius_button',
		array(
			'single'            => true,
			'type'              => 'object',
			'sanitize_callback' => __NAMESPACE__ . '\sanitize_schema',
			'default'           => array(),
			'show_in_rest'      => array(
				'schema' => array(
					'type'                 => 'object',
					'properties'           => get_schema(),
					'additionalProperties' => false,

				),

			),
		)
	);
}

// register a setting to store the button data
\add_action( 'init', __NAMESPACE__ . '\register_my_setting' );
\add_action( 'rest_api_init', __NAMESPACE__ . '\register_my_setting' );


function register_my_setting() {

	\register_setting(
		'options',
		'freemius_button',
		array(
			'single'            => true,
			'label'             => 'Freemius Button',
			'type'              => 'object',
			'sanitize_callback' => __NAMESPACE__ . '\sanitize_schema',
			'show_in_rest'      => array(
				'schema' => array(
					'type'                 => 'object',
					'properties'           => get_schema(),
					'additionalProperties' => false,

				),

			),
		)
	);
}


function sanitize_schema( $settings ) {

	foreach ( $settings as $key => $value ) {
		if ( $settings[ $key ] === '' ) {
			unset( $settings[ $key ] );
		}
	}

	return $settings;
}

function get_schema() {

	$plugin_dir = \plugin_dir_path( __FILE__ );
	$schema     = include $plugin_dir . 'includes/schema.php';

	return $schema;
}

\add_filter( 'render_block_core/group', __NAMESPACE__ . '\render_group', 10, 3 );
function render_group( $block_content, $block, $instance ) {
	if ( ! isset( $block['attrs']['testEnabled'] ) || ! $block['attrs']['testEnabled'] ) {
		return $block_content;
	}

	$test_text = isset( $block['attrs']['testText'] ) ? $block['attrs']['testText'] : '';

	// Add data attributes for styling
	$block_content = str_replace(
		'class="wp-block-group',
		sprintf(
			'class="wp-block-group" data-test-enabled="true" data-test-text="%s"',
			esc_attr( $test_text )
		),
		$block_content
	);

	return $block_content;
}
