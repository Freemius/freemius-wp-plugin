<?php
/**
 * Freemius API
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Api
 *
 * @package Freemius
 */
class Api {
	/**
	 * Instance of this class
	 *
	 * @var Api
	 */
	private static $instance = null;

	/**
	 * Constructor
	 */
	private function __construct() {
		// Add admin menu
		\add_action( '_admin_menu', array( $this, 'add_admin_menu' ) );
	}

	/**
	 * Get instance of this class
	 *
	 * @return Api
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
}
