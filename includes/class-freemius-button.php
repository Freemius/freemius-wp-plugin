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

		// Render the button
		\add_filter( 'render_block_core/button', array( $this, 'render_button' ), 10, 3 );
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

		\wp_enqueue_script( 'freemius-button-checkout', 'https://checkout.freemius.com/js/v1/', array(), 'v1', true );

		// load from assets.php
		$deps = include FREEMIUS_PLUGIN_DIR . '/build/button/view.asset.php';
		\wp_enqueue_script( 'freemius-button-view', FREEMIUS_PLUGIN_URL . '/build/button/view.js', $deps['dependencies'], $deps['version'], true );

		return $block_content;
	}
}
