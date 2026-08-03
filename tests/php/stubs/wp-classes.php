<?php
/**
 * Minimal WordPress REST and error stubs for PHPUnit.
 *
 * @package Freemius
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals -- WordPress API stubs for PHPUnit.

if ( ! class_exists( 'WP_REST_Request', false ) ) {
	/**
	 * Minimal REST request stub for PHPUnit.
	 */
	class WP_REST_Request {
		/**
		 * @var array<string, mixed>
		 */
		private $params = array();

		/**
		 * @var array<string, mixed>
		 */
		private $query_params = array();

		/**
		 * @var string
		 */
		private $method = 'GET';

		/**
		 * @var array<string, mixed>|null
		 */
		private $json_params = null;

		/**
		 * @param string $method HTTP method.
		 * @param string $route  Route path.
		 */
		public function __construct( string $method = 'GET', string $route = '' ) {
			unset( $route );
			$this->method = $method;
		}

		/**
		 * @param string $key Parameter key.
		 * @return mixed
		 */
		public function get_param( string $key ) {
			return $this->params[ $key ] ?? null;
		}

		/**
		 * @param string $key   Parameter key.
		 * @param mixed  $value Parameter value.
		 */
		public function set_param( string $key, $value ): void {
			$this->params[ $key ] = $value;
		}

		/**
		 * @param array<string, mixed> $params Query parameters.
		 */
		public function set_query_params( array $params ): void {
			$this->query_params = $params;
			foreach ( $params as $key => $value ) {
				$this->params[ (string) $key ] = $value;
			}
		}

		/**
		 * @return array<string, mixed>
		 */
		public function get_query_params(): array {
			return $this->query_params;
		}

		/**
		 * @return string
		 */
		public function get_method(): string {
			return $this->method;
		}

		/**
		 * @param string $method HTTP method.
		 */
		public function set_method( string $method ): void {
			$this->method = $method;
		}

		/**
		 * @param array<string, mixed>|null $params JSON body parameters.
		 */
		public function set_json_params( ?array $params ): void {
			$this->json_params = $params;
		}

		/**
		 * @return array<string, mixed>|null
		 */
		public function get_json_params(): ?array {
			return $this->json_params;
		}
	}
}

if ( ! class_exists( 'WP_REST_Response', false ) ) {
	/**
	 * Minimal REST response stub for PHPUnit.
	 */
	class WP_REST_Response {
		/**
		 * @var mixed
		 */
		private $data;

		/**
		 * @var int
		 */
		private $status;

		/**
		 * @var array<string, string>
		 */
		private $headers = array();

		/**
		 * @param mixed $data   Response body.
		 * @param int   $status HTTP status.
		 */
		public function __construct( $data = null, int $status = 200 ) {
			$this->data   = $data;
			$this->status = $status;
		}

		/**
		 * @return mixed
		 */
		public function get_data() {
			return $this->data;
		}

		/**
		 * @return int
		 */
		public function get_status(): int {
			return $this->status;
		}

		/**
		 * @param string $key   Header name.
		 * @param string $value Header value.
		 */
		public function header( string $key, string $value ): void {
			$this->headers[ $key ] = $value;
		}

		/**
		 * @param string $key Header name.
		 * @return string|null
		 */
		public function get_header( string $key ): ?string {
			return $this->headers[ $key ] ?? null;
		}
	}
}

if ( ! class_exists( 'WP_Error', false ) ) {
	/**
	 * Minimal error stub for PHPUnit.
	 */
	class WP_Error {
		/**
		 * @var string
		 */
		private $code;

		/**
		 * @var string
		 */
		private $message;

		/**
		 * @var array<string, mixed>
		 */
		private $data;

		/**
		 * @param string               $code    Error code.
		 * @param string               $message Error message.
		 * @param array<string, mixed> $data    Optional data.
		 */
		public function __construct( string $code = '', string $message = '', array $data = array() ) {
			$this->code    = $code;
			$this->message = $message;
			$this->data    = $data;
		}

		/**
		 * @return string
		 */
		public function get_error_code(): string {
			return $this->code;
		}

		/**
		 * @return string
		 */
		public function get_error_message(): string {
			return $this->message;
		}

		/**
		 * @param string|null $code Optional error code.
		 * @return mixed
		 */
		public function get_error_data( ?string $code = null ) {
			unset( $code );
			return $this->data;
		}
	}
}

if ( ! function_exists( 'wp_remote_retrieve_response_code' ) ) {
	/**
	 * @param array<string, mixed> $response HTTP response array.
	 * @return int
	 */
	function wp_remote_retrieve_response_code( array $response ): int {
		if ( isset( $response['response']['code'] ) ) {
			return (int) $response['response']['code'];
		}

		return (int) ( $response['http_response_code'] ?? 200 );
	}
}

if ( ! function_exists( 'wp_remote_retrieve_body' ) ) {
	/**
	 * @param array<string, mixed> $response HTTP response array.
	 * @return string
	 */
	function wp_remote_retrieve_body( array $response ): string {
		$body = $response['body'] ?? '';

		return is_string( $body ) ? $body : wp_json_encode( $body );
	}
}

if ( ! function_exists( 'get_plugin_data' ) ) {
	/**
	 * @param string $plugin_file Plugin file path.
	 * @return array<string, string>
	 */
	function get_plugin_data( string $plugin_file ): array {
		unset( $plugin_file );
		return array(
			'Name'    => 'Freemius for WordPress',
			'Version' => '0.4.2',
		);
	}
}

if ( ! function_exists( 'add_query_arg' ) ) {
	/**
	 * @param array<string, mixed>|string $args   Query args or key.
	 * @param string                      $url    URL.
	 * @param string|null                 $unused Optional legacy arg.
	 * @return string
	 */
	function add_query_arg( $args, string $url = '', ?string $unused = null ): string {
		unset( $unused );

		if ( is_string( $args ) ) {
			$key   = $args;
			$value = func_num_args() > 2 ? func_get_arg( 2 ) : '';
			$url   = func_num_args() > 1 ? (string) func_get_arg( 1 ) : '';
			$args  = array( $key => $value );
		}

		if ( ! is_array( $args ) || array() === $args ) {
			return $url;
		}

		$separator = str_contains( $url, '?' ) ? '&' : '?';

		return $url . $separator . http_build_query( $args );
	}
}
