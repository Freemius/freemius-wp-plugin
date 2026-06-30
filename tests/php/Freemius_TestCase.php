<?php
/**
 * Base TestCase with Brain Monkey lifecycle for WordPress function stubs.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Freemius\Api;
use Freemius\Blocks;
use Freemius\Button;
use Freemius\Scope;
use Freemius\Settings;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

abstract class Freemius_TestCase extends TestCase {

	/**
	 * Shared mutable state for option/transient stubs across tests.
	 *
	 * @var array{options: array<string, mixed>, transients: array<string, mixed>, last_transient_expiry: int|null}
	 */
	private $storage = array(
		'options'               => array(),
		'transients'            => array(),
		'last_transient_expiry' => null,
	);

	/**
	 * @var array<string, mixed>
	 */
	protected $options = array();

	/**
	 * @var array<string, mixed>
	 */
	protected $transients = array();

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		$this->storage['options']               = array();
		$this->storage['transients']            = array();
		$this->storage['last_transient_expiry'] = null;
		$this->options                          = &$this->storage['options'];
		$this->transients                       = &$this->storage['transients'];

		Functions\when( '__' )->returnArg( 1 );
		Functions\when( 'apply_filters' )->alias(
			static function ( $hook, $value, ...$args ) {
				unset( $hook, $args );
				return $value;
			}
		);
		Functions\when( 'esc_attr' )->alias(
			static function ( $text ) {
				return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
			}
		);
		Functions\when( 'wp_json_encode' )->alias(
			static function ( $data ) {
				return json_encode( $data );
			}
		);
		Functions\when( 'is_wp_error' )->alias(
			static function ( $thing ) {
				return $thing instanceof \WP_Error;
			}
		);
		Functions\when( 'sanitize_text_field' )->alias(
			static function ( $text ) {
				return trim( strip_tags( (string) $text ) );
			}
		);
		Functions\when( 'wp_parse_args' )->alias(
			static function ( $args, $defaults = array() ) {
				if ( ! is_array( $args ) ) {
					return $defaults;
				}

				return array_merge( $defaults, $args );
			}
		);

		$this->stub_options_and_transients();
		$this->reset_singletons();
	}

	protected function tearDown(): void {
		global $wpdb;

		$this->reset_singletons();
		$wpdb = null;
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Stub get_option, update_option, get_transient, set_transient, delete_transient.
	 */
	protected function stub_options_and_transients(): void {
		$storage = &$this->storage;

		Functions\when( 'get_option' )->alias(
			static function ( $option, $default = false ) use ( &$storage ) {
				return $storage['options'][ $option ] ?? $default;
			}
		);
		Functions\when( 'update_option' )->alias(
			static function ( $option, $value ) use ( &$storage ) {
				$storage['options'][ $option ] = $value;
				return true;
			}
		);
		Functions\when( 'get_transient' )->alias(
			static function ( $key ) use ( &$storage ) {
				return $storage['transients'][ $key ] ?? false;
			}
		);
		Functions\when( 'set_transient' )->alias(
			static function ( $key, $value, $expiry = 0 ) use ( &$storage ) {
				$storage['last_transient_expiry'] = (int) $expiry;
				$storage['transients'][ $key ]    = $value;
				return true;
			}
		);
		Functions\when( 'delete_transient' )->alias(
			static function ( $key ) use ( &$storage ) {
				unset( $storage['transients'][ $key ] );
				return true;
			}
		);
	}

	/**
	 * Reset singleton instances and Scope matrix state between tests.
	 */
	protected function reset_singletons(): void {
		$classes = array(
			Api::class,
			Settings::class,
			Scope::class,
			Button::class,
			Blocks::class,
		);

		foreach ( $classes as $class ) {
			$reflection = new ReflectionClass( $class );
			$property   = $reflection->getProperty( 'instance' );
			$property->setAccessible( true );
			$property->setValue( null, null );
		}

		$scope = Scope::get_instance();
		$ref   = new ReflectionClass( $scope );
		if ( $ref->hasProperty( 'matrix_added' ) ) {
			$matrix = $ref->getProperty( 'matrix_added' );
			$matrix->setAccessible( true );
			$matrix->setValue( $scope, array() );
		}
		if ( $ref->hasProperty( 'coupon_added' ) ) {
			$coupon_added = $ref->getProperty( 'coupon_added' );
			$coupon_added->setAccessible( true );
			$coupon_added->setValue( $scope, array() );
		}

		$api     = Api::get_instance();
		$api_ref = new ReflectionClass( $api );
		if ( $api_ref->hasProperty( 'api_settings' ) ) {
			$settings_prop = $api_ref->getProperty( 'api_settings' );
			$settings_prop->setAccessible( true );
			$settings_prop->setValue( $api, null );
		}
	}

	/**
	 * @return int|null
	 */
	protected function get_last_transient_expiry(): ?int {
		return $this->storage['last_transient_expiry'];
	}
}
