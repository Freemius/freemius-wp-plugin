<?php
/**
 * Freemius Scope
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Scope
 *
 * @package Freemius
 */
class Scope {
	/**
	 * Instance of this class
	 *
	 * @var Pricing
	 */
	private static $instance = null;


	private $scope = null;


	/**
	 * Constructor
	 */
	private function __construct() {

		// Enqueue the block script and styles
		\add_action( 'enqueue_block_assets', array( $this, 'block_script_styles' ), 1 );

		// Render the scope
		\add_filter( 'render_block_core/group', array( $this, 'render_scope' ), 10, 3 );
		\add_filter( 'render_block_core/columns', array( $this, 'render_scope' ), 10, 3 );
		\add_filter( 'render_block_core/column', array( $this, 'render_scope' ), 10, 3 );
		\add_filter( 'render_block_core/button', array( $this, 'render_scope' ), 10, 3 );
	}

	/**
	 * Get instance of this class
	 *
	 * @return Scope
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

		// load from assets.php
		$deps = include FREEMIUS_PLUGIN_DIR . '/build/scope/index.asset.php';

		\wp_enqueue_code_editor( array( 'type' => 'application/javascript' ) );

		// Freemius Scope
		\wp_enqueue_script( 'freemius-scope', FREEMIUS_PLUGIN_URL . '/build/scope/index.js', $deps['dependencies'], $deps['version'], true );
		\wp_enqueue_style( 'freemius-scope', FREEMIUS_PLUGIN_URL . '/build/scope/style-index.css', array(), $deps['version'] );
	}


	/**
	 * Render the scope
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block.
	 * @param array  $instance      The instance.
	 * @return string The block content.
	 */
	public function render_scope( $block_content, $block, $instance ) {

		if ( ! isset( $block['attrs'] ) ) {
			return $block_content;
		}
		if ( ! isset( $block['attrs']['freemius_enabled'] ) || $block['attrs']['freemius_enabled'] === false ) {
			return $block_content;
		}

		$this->scope = \get_option( 'freemius_editor_settings', array() );

		$extra = '<script type="application/json" class="freemius-scope-data">' . wp_json_encode( $this->scope ) . '</script>';

		$extra .= '<script type="application/json" class="freemius-matrix-data">' . wp_json_encode( $this->get_matrix( $this->scope ) ) . '</script>';

		$block_content = $extra . $block_content;

		return $block_content;
	}

	/**
	 * Get the matrix of all pricing options
	 *
	 * @param array $scope The scope.
	 * @return array The matrix.
	 */
	private function get_matrix( $scope ) {

		// TODO: handling empty scope with proper error notice
		if ( ! is_array( $scope ) ) {
			return array();
		}

		if ( ! isset( $scope['product_id'] ) ) {
			return array();
		}

		$product_id = $scope['product_id'];

		$api = Api::get_instance();

		$result = $api->get_request( 'products/' . $product_id . '/pricing.json' );

		if ( is_wp_error( $result ) ) {
			return array();
		}

		$plans = $result->get_data();

		$matrix = array();

		foreach ( $plans['plans'] as $plan ) {
			$planId = $plan['id'];

			$pricing_by_currency = array();

			if ( ! empty( $plan['pricing'] ) ) {
				foreach ( $plan['pricing'] as $pricing ) {
					$currency = strtolower( $pricing['currency'] ?? 'unknown' );
					$licenses = $pricing['licenses'] !== null ? (string) $pricing['licenses'] : 'unlimited';

					// Add prices grouped by billing cycle and licenses
					$pricing_by_currency[ $currency ]['monthly'][ $licenses ]  = $pricing['monthly_price'];
					$pricing_by_currency[ $currency ]['annual'][ $licenses ]   = $pricing['annual_price'];
					$pricing_by_currency[ $currency ]['lifetime'][ $licenses ] = $pricing['lifetime_price'];
				}
			}

			$matrix[ $planId ] = array(
				'name'        => $plan['name'] ?? null,
				'title'       => $plan['title'] ?? null,
				'description' => $plan['description'] ?? null,
				'pricing'     => $pricing_by_currency,
			);
		}

		return $matrix;
	}
}
