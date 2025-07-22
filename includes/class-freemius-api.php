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
	 * Freemius API settings
	 *
	 * @var array
	 */
	private $api_settings = null;

	/**
	 * Cache expiry time in seconds (1 hour)
	 *
	 * @var int
	 */
	private $cache_expiry = 3600;

	/**
	 * Freemius API base URL
	 *
	 * @var string
	 */
	private $api_base_url = 'https://api.freemius.com/v1';

	/**
	 * Constructor
	 */
	private function __construct() {
		// Register REST API endpoints.
		\add_action( 'rest_api_init', array( $this, 'register_rest_endpoints' ) );
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

	/**
	 * Register REST API endpoints
	 */
	public function register_rest_endpoints() {
		// Register namespace for Freemius API proxy.
		\register_rest_route(
			'freemius/v1',
			'/proxy/(?P<endpoint>.*)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'proxy_get_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'endpoint' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		\register_rest_route(
			'freemius/v1',
			'/proxy/(?P<endpoint>.*)',
			array(
				'methods'             => array( 'POST', 'PUT', 'DELETE' ),
				'callback'            => array( $this, 'proxy_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'endpoint' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Clear cache endpoint.
		\register_rest_route(
			'freemius/v1',
			'/cache/clear',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'clear_cache' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);
	}

	/**
	 * Check permissions for API access
	 *
	 * @return bool
	 */
	public function check_permissions() {
		return \current_user_can( 'manage_options' );
	}

	/**
	 * Set cache expiry time in seconds
	 *
	 * @param int $expiry Cache expiry time in seconds.
	 */
	public function set_cache_expiry( $expiry ) {
		$this->cache_expiry = $expiry;
	}

	/**
	 * Get Freemius API settings
	 *
	 * @return array|null
	 */
	private function get_api_settings() {
		if ( null !== $this->api_settings ) {
			return $this->api_settings;
		}

		$this->api_settings = \get_option( 'freemius_api', array() );

		if ( empty( $this->api_settings['token'] ) ) {
			return null;
		}

		// Set default values.
		$this->api_settings = wp_parse_args(
			$this->api_settings,
			array(
				'token' => '',
			)
		);

		return $this->api_settings;
	}

	/**
	 * Generate authentication signature for Freemius API
	 *
	 * @param string $method HTTP method.
	 * @param string $endpoint API endpoint.
	 * @param array  $params Request parameters.
	 * @param string $timestamp Unix timestamp.
	 * @return string
	 */
	private function generate_signature( $method, $endpoint, $params, $timestamp ) {
		$settings = $this->get_api_settings();
		if ( null === $settings ) {
			return '';
		}

		$canonical_string  = strtoupper( $method ) . '&';
		$canonical_string .= urlencode( $this->api_base_url . $endpoint ) . '&';

		// Sort parameters.
		ksort( $params );
		$param_string = '';
		foreach ( $params as $key => $value ) {
			if ( ! empty( $param_string ) ) {
				$param_string .= '&';
			}
			$param_string .= $key . '=' . $value;
		}
		$canonical_string .= urlencode( $param_string );

		return base64_encode( hash_hmac( 'sha1', $canonical_string, $settings['secret_key'], true ) );
	}

	/**
	 * Handle GET proxy requests with caching
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function proxy_get_request( $request ) {

		$endpoint     = $request->get_param( 'endpoint' );
		$query_params = $request->get_query_params();

		// Remove endpoint from query params.
		unset( $query_params['endpoint'] );
		unset( $query_params['_locale'] );

		return $this->get_request( $endpoint, $query_params );
	}

	/**
	 * Make a GET request to Freemius API
	 *
	 * @param string $endpoint API endpoint.
	 * @param array  $query_params Request parameters.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_request( $endpoint, $query_params = array() ) {

		// Generate cache key.
		$cache_key = $this->generate_cache_key( 'GET', $endpoint, $query_params );

		// Try to get from cache first.
		$cached_response = \get_transient( $cache_key );
		if ( false !== $cached_response ) {
			$response = new \WP_REST_Response( $cached_response['data'], $cached_response['status'] );
			$response->header( 'X-Freemius-Cache', 'HIT' );
			return $response;
		}

		// Make the actual API request.
		$result = $this->make_freemius_request( 'GET', $endpoint, $query_params );

		if ( \is_wp_error( $result ) ) {
			return $result;
		}

		// Cache successful responses.
		if ( $result['status'] >= 200 && $result['status'] < 300 ) {
			\set_transient( $cache_key, $result, $this->cache_expiry );
		}

		$response = new \WP_REST_Response( $result['data'], $result['status'] );
		$response->header( 'X-Freemius-Cache', 'MISS' );
		return $response;
	}

	/**
	 * Handle non-GET proxy requests (no caching)
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function proxy_request( $request ) {
		$endpoint = $request->get_param( 'endpoint' );
		$method   = $request->get_method();
		$body     = $request->get_json_params();

		// Make the actual API request.
		$result = $this->make_freemius_request( $method, $endpoint, $body );

		if ( \is_wp_error( $result ) ) {
			return $result;
		}

		// Clear related cache entries for write operations.
		if ( in_array( $method, array( 'POST', 'PUT', 'DELETE' ), true ) ) {
			$this->clear_related_cache( $endpoint );
		}

		return new \WP_REST_Response( $result['data'], $result['status'] );
	}

	/**
	 * Make request to Freemius API
	 *
	 * @param string $method HTTP method.
	 * @param string $endpoint API endpoint.
	 * @param array  $data Request data.
	 * @return array|\WP_Error
	 */
	private function make_freemius_request( $method, $endpoint, $data = array() ) {
		$settings = $this->get_api_settings();

		if ( null === $settings ) {
			return new \WP_Error(
				'freemius_api_not_configured',
				__( 'Freemius API is not configured. Please check your API settings.', 'freemius-button' ),
				array( 'status' => 500 )
			);
		}

		try {
			$endpoint = '/' . ltrim( $endpoint, '/' );

			$token = $settings['token'];

			$plugin_data = get_plugin_data( FREEMIUS_PLUGIN_DIR . '/freemius.php' );

			// Prepare request arguments.
			$request_args = array(
				'method'  => strtoupper( $method ),
				'timeout' => 30,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
					'Authorization' => 'Bearer ' . $token,
					'User-Agent'    => $plugin_data['Name'] . '/' . $plugin_data['Version'] . ';',
				),
			);

			$url = $this->api_base_url . $endpoint;

			if ( 'GET' === strtoupper( $method ) ) {
				// For GET requests, add all parameters to URL.
				$url = add_query_arg( $data, $url );
			} else {
				// For other methods, add data to body.
				if ( ! empty( $data ) ) {
					$request_args['body'] = wp_json_encode( $data );
				}
			}

			// Make the HTTP request.
			$response = wp_remote_request( $url, $request_args );

			if ( is_wp_error( $response ) ) {
				return new \WP_Error(
					'freemius_api_request_failed',
					$response->get_error_message(),
					array( 'status' => 500 )
				);
			}

			$response_code = wp_remote_retrieve_response_code( $response );
			$response_body = wp_remote_retrieve_body( $response );

			// Decode JSON response.
			$decoded_response = json_decode( $response_body, true );

			if ( null === $decoded_response ) {
				return new \WP_Error(
					'freemius_api_invalid_response',
					__( 'Invalid JSON response from Freemius API.', 'freemius-button' ),
					array( 'status' => 500 )
				);
			}

			// Handle API errors.
			if ( $response_code >= 400 ) {
				$error_message = isset( $decoded_response['error']['message'] )
					? $decoded_response['error']['message']
					: __( 'Unknown Freemius API error.', 'freemius-button' );
				// error_log( print_r( $error_message, true ) );
				return new \WP_Error(
					'freemius_api_error',
					$error_message,
					array( 'status' => $response_code )
				);
			}

			return array(
				'data'   => $decoded_response,
				'status' => $response_code,
			);

		} catch ( \Exception $e ) {
			\error_log( 'Freemius API request error: ' . $e->getMessage() );
			return new \WP_Error(
				'freemius_api_exception',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Generate cache key for API requests
	 *
	 * @param string $method HTTP method.
	 * @param string $endpoint API endpoint.
	 * @param array  $data Request data.
	 * @return string
	 */
	private function generate_cache_key( $method, $endpoint, $data = array() ) {
		$key_data = array(
			'method'   => $method,
			'endpoint' => $endpoint,
			'data'     => $data,
			'seed'     => 123,
		);

		return 'freemius_api_' . md5( wp_json_encode( $key_data ) );
	}

	/**
	 * Clear related cache entries
	 *
	 * @param string $endpoint The endpoint that was modified.
	 */
	private function clear_related_cache( $endpoint ) {
		global $wpdb;

		// Clear all transients that start with freemius_api_.
		$transient_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
				'_transient_freemius_api_%'
			)
		);

		foreach ( $transient_keys as $transient_key ) {
			$key = str_replace( '_transient_', '', $transient_key );
			\delete_transient( $key );
		}
	}

	/**
	 * Clear all API cache
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public function clear_cache( $request ) {
		$this->clear_related_cache( '' );

		return new \WP_REST_Response(
			array( 'message' => __( 'Cache cleared successfully.', 'freemius-button' ) ),
			200
		);
	}
}
