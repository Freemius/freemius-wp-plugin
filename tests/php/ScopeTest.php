<?php
/**
 * Tests for Freemius Scope.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Freemius\Scope;

class ScopeTest extends Freemius_TestCase {

	public function test_render_scope_returns_unchanged_without_attrs(): void {
		$scope   = Scope::get_instance();
		$content = '<div class="wp-block-group">Original</div>';

		$result = $scope->render_scope( $content, array(), array() );

		$this->assertSame( $content, $result );
	}

	public function test_render_scope_returns_unchanged_when_disabled(): void {
		$scope   = Scope::get_instance();
		$content = '<div class="wp-block-group">Original</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => false,
				'freemius'         => array(
					'product_id' => 19794,
				),
			),
		);

		$result = $scope->render_scope( $content, $block, array() );

		$this->assertSame( $content, $result );
	}

	public function test_render_scope_injects_scope_json_scripts(): void {
		$this->options['freemius_defaults'] = array(
			'currency' => 'usd',
		);

		$scope   = Scope::get_instance();
		$content = '<div class="wp-block-group">Original</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => true,
				'freemius'         => array(
					'plan_id' => '32842',
				),
			),
		);

		$result = $scope->render_scope( $content, $block, array() );

		$this->assertStringContainsString( 'freemius-global-scope-data', $result );
		$this->assertStringContainsString( 'freemius-scope-data', $result );
		$this->assertStringContainsString( '"plan_id":"32842"', $result );
		$this->assertStringContainsString( $content, $result );
	}

	public function test_render_scope_includes_matrix_for_product(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$scope   = Scope::get_instance();
		$content = '<div class="wp-block-group">Original</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => true,
				'freemius'         => array(
					'product_id' => 19794,
				),
			),
		);

		$result = $scope->render_scope( $content, $block, array() );

		$this->assertStringContainsString( 'freemius-matrix-data', $result );
		$this->assertStringContainsString( 'data-freemius-product-id="19794"', $result );
		$this->assertStringContainsString( '"32841"', $result );
		$this->assertStringContainsString( '"32842"', $result );
	}

	public function test_render_scope_deduplicates_matrix_per_product(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$scope   = Scope::get_instance();
		$content = '<div>Block</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => true,
				'freemius'         => array(
					'product_id' => 19794,
				),
			),
		);

		$first  = $scope->render_scope( $content, $block, array() );
		$second = $scope->render_scope( $content, $block, array() );

		$this->assertSame( 1, substr_count( $first, 'freemius-matrix-data' ) );
		$this->assertSame( 0, substr_count( $second, 'freemius-matrix-data' ) );
	}
}
