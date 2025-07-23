<?php
/**
 * Freemius Settings
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Settings
 *
 * @package Freemius
 */
class Settings {
	/**
	 * Instance of this class
	 *
	 * @var Settings
	 */
	private static $instance = null;

	/**
	 * Constructor
	 */
	private function __construct() {
		// Add admin menu
		\add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );

		// Enqueue admin scripts and styles
		\add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );

		// Register settings
		\add_action( 'init', array( $this, 'register_settings' ) );
		\add_action( 'rest_api_init', array( $this, 'register_settings' ) );

		// Add plugin action links
		\add_filter( 'plugin_action_links_freemius/freemius.php', array( $this, 'add_plugin_action_links' ) );
	}

	/**
	 * Get instance of this class
	 *
	 * @return Settings
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
	 * Add admin menu
	 */
	public function add_admin_menu() {
		\add_options_page(
			__( 'Freemius Settings', 'freemius' ),
			__( 'Freemius', 'freemius' ),
			'manage_options',
			'freemius-settings',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Render the settings page
	 */
	public function render_settings_page() {
		echo '<div id="freemius-settings-root" class="wrap">';
		echo '<div id="freemius-settings-app"></div>';
		echo '</div>';
	}

	/**
	 * Add plugin action links
	 *
	 * @param array $links The current array of links.
	 * @return array The modified array of links.
	 */
	public function add_plugin_action_links( $links ) {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			\admin_url( 'options-general.php?page=freemius-settings' ),
			__( 'Settings', 'freemius' )
		);

		// Add the settings link to the beginning of the links array
		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public function admin_scripts( $hook_suffix ) {
		// Only load on our settings page
		if ( 'settings_page_freemius-settings' !== $hook_suffix ) {
			return;
		}

		// Check if build files exist before enqueueing
		$asset_path = FREEMIUS_PLUGIN_DIR . '/build/settings/index.asset.php';
		if ( ! file_exists( $asset_path ) ) {
			return;
		}

		// Load dependencies
		$freemius_dependencies = include $asset_path;

		// Enqueue settings script
		\wp_enqueue_script(
			'freemius-settings',
			FREEMIUS_PLUGIN_URL . '/build/settings/index.js',
			$freemius_dependencies['dependencies'],
			$freemius_dependencies['version'],
			true
		);

		// Enqueue settings styles
		\wp_enqueue_style(
			'freemius-settings',
			FREEMIUS_PLUGIN_URL . '/build/settings/style-index.css',
			array( 'wp-block-editor' ), // load WordPress block editor styles
			$freemius_dependencies['version']
		);

		// Localize script with settings data
		\wp_add_inline_script(
			'freemius-settings',
			'const freemiusSettings = ' . wp_json_encode(
				array(
					'apiUrl' => \rest_url( 'wp/v2/settings' ),
					'nonce'  => \wp_create_nonce( 'wp_rest' ),
					'schema' => $this->get_schema(),
				)
			),
			'before'
		);
	}

	/**
	 * Register settings
	 */
	public function register_settings() {

		// Register general settings
		\register_setting(
			'freemius_settings',
			'freemius_general',
			array(
				'type'              => 'object',
				'label'             => __( 'General Settings', 'freemius' ),
				'description'       => __( 'General settings for the Freemius plugin', 'freemius' ),
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
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

		// Register API settings
		\register_setting(
			'freemius_settings',
			'freemius_api',
			array(
				'type'              => 'object',
				'label'             => __( 'API Settings', 'freemius' ),
				'description'       => __( 'API settings for the Freemius plugin', 'freemius' ),
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
				'default'           => array(),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'properties'           => $this->get_api_schema(),
						'additionalProperties' => false,
					),
				),
			)
		);

		// Register API settings
		\register_setting(
			'freemius_settings',
			'freemius_editor_settings',
			array(
				'type'              => 'object',
				'label'             => __( 'Editor Settings', 'freemius' ),
				'description'       => __( 'Define the site wide default values. You can override these values on a per-scope basis.', 'freemius' ),
				'sanitize_callback' => array( $this, 'sanitize_schema' ),
				'default'           => array(),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'properties'           => $this->get_button_schema(),
						'additionalProperties' => false,

					),

				),
			)
		);
	}

	/**
	 * Sanitize settings
	 *
	 * @param array $settings The settings to sanitize.
	 * @return array The sanitized settings.
	 */
	public function sanitize_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}

		$sanitized = array();

		foreach ( $settings as $key => $value ) {
			if ( is_string( $value ) ) {
				$sanitized[ $key ] = sanitize_text_field( $value );
			} elseif ( is_bool( $value ) ) {
				$sanitized[ $key ] = (bool) $value;
			} elseif ( is_numeric( $value ) ) {
				$sanitized[ $key ] = is_float( $value ) ? (float) $value : (int) $value;
			} elseif ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitize_settings( $value );
			}
		}

		return $sanitized;
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
	 * Get general settings schema
	 *
	 * @return array The schema.
	 */
	public function get_schema() {

		$schema = include FREEMIUS_PLUGIN_DIR . '/schemas/general.php';

		return $schema;
	}

	/**
	 * Get API settings schema
	 *
	 * @return array The schema.
	 */
	public function get_api_schema() {

		$schema = include FREEMIUS_PLUGIN_DIR . '/schemas/api.php';

		return $schema;
	}

	/**
	 * Get button settings schema
	 *
	 * @return array The schema.
	 */
	public function get_button_schema() {
		$schema = include FREEMIUS_PLUGIN_DIR . '/schemas/button.php';
		return $schema;
	}
}
