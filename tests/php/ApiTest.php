<?php
/**
 * Tests for Freemius Api.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Brain\Monkey\Functions;
use Freemius\Api;
use WP_REST_Request;

class ApiTest extends Freemius_TestCase {

	public function test_check_permissions_delegates_to_current_user_can(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$this->assertTrue( Api::get_instance()->check_permissions() );
	}

	public function test_check_permissions_returns_false_when_user_cannot_manage_options(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$this->assertFalse( Api::get_instance()->check_permissions() );
	}

	public function test_get_request_returns_error_when_not_configured(): void {
		$this->options['freemius_settings'] = array();

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'freemius_api_not_configured', $result->get_error_code() );
	}

	public function test_get_request_returns_dummy_pricing_with_cache_miss_header(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'MISS', $result->get_header( 'X-Freemius-Cache' ) );

		$data = $result->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'plans', $data );
	}

	public function test_get_request_returns_cache_hit_on_second_call(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$api = Api::get_instance();
		$api->get_request( 'products/19794/pricing.json' );

		$result = $api->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 'HIT', $result->get_header( 'X-Freemius-Cache' ) );
	}

	public function test_set_cache_expiry_controls_transient_ttl_argument(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$api = Api::get_instance();
		$api->set_cache_expiry( 7200 );
		$api->get_request( 'products/19794/pricing.json' );

		$this->assertSame( 7200, $this->get_last_transient_expiry() );
	}

	public function test_get_request_uses_product_specific_token(): void {
		$this->options['freemius_settings'] = array(
			'token' => 'global-token',
		);
		$this->options['freemius_products'] = array(
			array(
				'product_id' => 19794,
				'token'      => '1234567890',
			),
		);

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertArrayHasKey( 'plans', $result->get_data() );
	}

	public function test_proxy_get_request_strips_endpoint_and_locale_from_query_params(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$request = new WP_REST_Request( 'GET', '/freemius/v1/proxy/products/19794/pricing.json' );
		$request->set_param( 'endpoint', 'products/19794/pricing.json' );
		$request->set_query_params(
			array(
				'endpoint' => 'products/19794/pricing.json',
				'_locale'  => 'user',
				'currency' => 'usd',
			)
		);

		$result = Api::get_instance()->proxy_get_request( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
	}

	public function test_proxy_request_forwards_post_body(): void {
		global $wpdb;

		$wpdb          = new class() {
			public $options = 'wp_options';

			/**
			 * @param string $query SQL query.
			 * @param mixed  $like  LIKE value.
			 * @return string
			 */
			public function prepare( $query, $like ) {
				unset( $like );
				return $query;
			}

			/**
			 * @param string $query SQL query.
			 * @return array<int, string>
			 */
			public function get_col( $query ) {
				unset( $query );
				return array();
			}
		};

		$this->options['freemius_settings'] = array(
			'token' => 'real-token',
		);

		Functions\expect( 'wp_remote_request' )
			->once()
			->with(
				\Mockery::type( 'string' ),
				\Mockery::type( 'array' )
			)
			->andReturn(
				array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode( array( 'success' => true ) ),
				)
			);

		$request = new WP_REST_Request( 'POST', '/freemius/v1/proxy/products/19794.json' );
		$request->set_param( 'endpoint', 'products/19794.json' );
		$request->set_json_params( array( 'title' => 'Updated' ) );

		$result = Api::get_instance()->proxy_request( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( array( 'success' => true ), $result->get_data() );
	}

	public function test_get_request_handles_wp_remote_request_failure(): void {
		$this->options['freemius_settings'] = array(
			'token' => 'real-token',
		);

		Functions\expect( 'wp_remote_request' )
			->once()
			->andReturn( new \WP_Error( 'http_request_failed', 'Connection timed out' ) );

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'freemius_api_request_failed', $result->get_error_code() );
	}

	public function test_get_request_handles_api_error_response(): void {
		$this->options['freemius_settings'] = array(
			'token' => 'real-token',
		);

		Functions\expect( 'wp_remote_request' )
			->once()
			->andReturn(
				array(
					'response' => array(
						'code'    => 403,
						'message' => 'Forbidden',
					),
					'body'     => wp_json_encode(
						array(
							'error' => array(
								'message' => 'Invalid token',
							),
						)
					),
				)
			);

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'freemius_api_error', $result->get_error_code() );
		$this->assertSame( 'Invalid token', $result->get_error_message() );
	}

	public function test_get_request_handles_invalid_json_response(): void {
		$this->options['freemius_settings'] = array(
			'token' => 'real-token',
		);

		Functions\expect( 'wp_remote_request' )
			->once()
			->andReturn(
				array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => 'not-json',
				)
			);

		$result = Api::get_instance()->get_request( 'products/19794/pricing.json' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'freemius_api_invalid_response', $result->get_error_code() );
	}

	public function test_clear_cache_returns_success_message(): void {
		global $wpdb;

		$wpdb          = new class() {
			public $options = 'wp_options';

			/**
			 * @param string $query SQL query.
			 * @param mixed  $like  LIKE value.
			 * @return string
			 */
			public function prepare( $query, $like ) {
				unset( $like );
				return $query;
			}

			/**
			 * @param string $query SQL query.
			 * @return array<int, string>
			 */
			public function get_col( $query ) {
				unset( $query );
				return array(
					'_transient_freemius_api_abc123',
					'_transient_freemius_api_def456',
				);
			}
		};

		$this->transients['freemius_api_abc123'] = array( 'data' => array(), 'status' => 200 );
		$this->transients['freemius_api_def456'] = array( 'data' => array(), 'status' => 200 );

		$request = new WP_REST_Request( 'POST', '/freemius/v1/cache/clear' );
		$result  = Api::get_instance()->clear_cache( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'Cache cleared successfully.', $result->get_data()['message'] );
		$this->assertArrayNotHasKey( 'freemius_api_abc123', $this->transients );
		$this->assertArrayNotHasKey( 'freemius_api_def456', $this->transients );
	}
}
