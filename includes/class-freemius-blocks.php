<?php
/**
 * Freemius Blocks
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Blocks
 *
 * @package Freemius
 */
class Blocks {
	/**
	 * Instance of this class
	 *
	 * @var Blocks
	 */
	private static $instance = null;


	/**
	 * Constructor
	 */
	private function __construct() {
		// Register blocks.
		\add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Get instance of this class
	 *
	 * @return Blocks
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
	 * Register blocks
	 */
	public function register_blocks() {
		\register_block_type( FREEMIUS_PLUGIN_DIR . '/build/blocks/modifier' );
	}
}
