<?php
/**
 * Freemius Button
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Button
 *
 * @package Freemius
 */
class Button {
	/**
	 * Instance of this class
	 *
	 * @var Button
	 */
	private static $instance = null;

	/**
	 * Constructor
	 */
	private function __construct() {

		// Enqueue the block script and styles
		// \add_action( 'enqueue_block_assets', array( $this, 'block_script_styles' ), 1 );

		// Render the button
		\add_filter( 'render_block_core/button', array( $this, 'render_button' ), 10, 3 );

		// // Register the post meta
		// \add_action( 'init', array( $this, 'register_post_meta' ) );
		// \add_action( 'rest_api_init', array( $this, 'register_post_meta' ) );

		// // Register the setting
		// \add_action( 'init', array( $this, 'register_my_setting' ) );
		// \add_action( 'rest_api_init', array( $this, 'register_my_setting' ) );
	}

	/**
	 * Get instance of this class
	 *
	 * @return Button
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Prevent cloning of the instance
	 */
	private function __clone() {}

	/**
	 * Prevent unserializing of the instance
	 */
	public function __wakeup() {}


	/**
	 * Enqueue the block script and styles
	 */
	public function block_script_styles() {

		if ( ! is_admin() ) {
			return;
		}

		return;

		// load from assets.php
		$freemius_dependencies = include FREEMIUS_PLUGIN_DIR . '/build/button/index.asset.php';

		\wp_enqueue_code_editor( array( 'type' => 'application/javascript' ) );

		// Freemius Button Block
		\wp_enqueue_script( 'freemius-button', FREEMIUS_PLUGIN_URL . '/build/button/index.js', $freemius_dependencies['dependencies'], $freemius_dependencies['version'], true );
		\wp_enqueue_style( 'freemius-button', FREEMIUS_PLUGIN_URL . '/build/button/style-index.css', array(), $freemius_dependencies['version'] );

		// TODO: load this via API in the editor.js
		\wp_add_inline_script( 'freemius-button', 'const freemius_button_schema = ' . wp_json_encode( $this->get_schema() ) . '', true );
	}


	/**
	 * Render the button
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block.
	 * @param array  $instance      The instance.
	 * @return string The block content.
	 */
	public function render_button( $block_content, $block, $instance ) {

		if ( ! isset( $block['attrs'] ) ) {
			return $block_content;
		}

		if ( ! isset( $block['attrs']['freemius_enabled'] ) || $block['attrs']['freemius_enabled'] === false ) {
			return $block_content;
		}

		// // merge the data from the site, the page and the block
		// $site_data = \get_option( 'freemius_button', array() );
		// // $page_data   = \get_post_meta( get_the_ID(), 'freemius_button', true );
		// $plugin_data = isset( $block['attrs']['freemius'] ) ? $block['attrs']['freemius'] : array();

		// $data = array_merge( (array) $site_data, (array) $plugin_data );

		// /**
		// * Filter the data that will be passed to the Freemius checkout.
		// *
		// * @param array $data The data that will be passed to the Freemius checkout.
		// */
		// $data = \apply_filters( 'freemius_button_data', $data );

		// $extra = '';
		// $extra .= '<script type="application/json" class="freemius-button-data">' . wp_json_encode( $data ) . '</script>';

		\wp_enqueue_script( 'freemius-button-checkout', 'https://checkout.freemius.com/js/v1/', array(), 'v1', true );

		// load from assets.php
		$dependecied = include FREEMIUS_PLUGIN_DIR . '/build/button/view.asset.php';
		\wp_enqueue_script( 'freemius-button-view', FREEMIUS_PLUGIN_URL . '/build/button/view.js', $dependecied['dependencies'], $dependecied['version'], true );
		// \wp_enqueue_style( 'freemius-button-view', FREEMIUS_PLUGIN_URL . '/build/button/view.css', array(), $dependecied['version'] );

		return $block_content;
	}


	/**
	 * Register the post meta
	 */
	public function register_post_meta() {

		\register_post_meta(
			'', // registered for all post types
			'freemius_button',
			array(
				'single'            => true,
				'type'              => 'object',
				'sanitize_callback' => array( $this, 'sanitize_schema' ),
				'default'           => array(),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'properties'           => $this->get_schema(),
						'additionalProperties' => false,

					),

				),
			)
		);
	}


	/**
	 * Register the setting
	 */
	public function register_my_setting() {

		// Register API settings
		\register_setting(
			'freemius_settings',
			'freemius_button',
			array(
				'type'              => 'object',
				'label'             => __( 'Freemius Button', 'freemius' ),
				'description'       => __( 'Define the site wide default values for the Freemius Button. You can override these values on a per-page basis.', 'freemius' ),
				'sanitize_callback' => array( $this, 'sanitize_schema' ),
				'default'           => array(),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'properties'           => $this->get_schema(),
						'additionalProperties' => false,

					),

				),
			)
		);
	}


	/**
	 * Sanitize the schema
	 *
	 * @param array $settings The settings.
	 * @return array The sanitized settings.
	 */
	public function sanitize_schema( $settings ) {

		foreach ( $settings as $key => $value ) {
			if ( $settings[ $key ] === '' ) {
				unset( $settings[ $key ] );
			}
		}

		return $settings;
	}

	/**
	 * Get the schema
	 *
	 * @return array The schema.
	 */
	public function get_schema() {

		$schema = include FREEMIUS_PLUGIN_DIR . '/schemas/button.php';

		return $schema;
	}
}
