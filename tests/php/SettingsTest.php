<?php
/**
 * Tests for Freemius Settings.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Brain\Monkey\Functions;
use Freemius\Settings;

class SettingsTest extends Freemius_TestCase {

	public function test_sanitize_settings_returns_empty_array_for_non_array(): void {
		$settings = Settings::get_instance();

		$this->assertSame( array(), $settings->sanitize_settings( 'invalid' ) );
		$this->assertSame( array(), $settings->sanitize_settings( null ) );
	}

	public function test_sanitize_settings_sanitizes_strings_and_nested_arrays(): void {
		$settings = Settings::get_instance();

		$result = $settings->sanitize_settings(
			array(
				'token'  => '<script>alert(1)</script>secret',
				'nested' => array(
					'label' => '<b>Hello</b>',
				),
			)
		);

		$this->assertSame( 'alert(1)secret', $result['token'] );
		$this->assertSame( 'Hello', $result['nested']['label'] );
	}

	public function test_sanitize_settings_preserves_bools_and_numbers(): void {
		$settings = Settings::get_instance();

		$result = $settings->sanitize_settings(
			array(
				'enabled' => true,
				'count'   => 3,
				'price'   => 9.99,
			)
		);

		$this->assertTrue( $result['enabled'] );
		$this->assertSame( 3, $result['count'] );
		$this->assertSame( 9.99, $result['price'] );
	}

	public function test_sanitize_schema_removes_empty_strings(): void {
		$settings = Settings::get_instance();

		$result = $settings->sanitize_schema(
			array(
				'product_id' => '',
				'plan_id'    => '32842',
				'currency'   => '',
			)
		);

		$this->assertArrayNotHasKey( 'product_id', $result );
		$this->assertArrayNotHasKey( 'currency', $result );
		$this->assertSame( '32842', $result['plan_id'] );
	}

	public function test_get_schema_returns_environment_key(): void {
		$settings = Settings::get_instance();
		$schema   = $settings->get_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( 'environment', $schema );
	}

	public function test_get_button_schema_returns_product_id_key(): void {
		$settings = Settings::get_instance();
		$schema   = $settings->get_button_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( 'product_id', $schema );
	}

	public function test_get_products_schema_returns_expected_keys(): void {
		$settings = Settings::get_instance();
		$schema   = $settings->get_products_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( 'product_id', $schema );
		$this->assertArrayHasKey( 'token', $schema );
	}

	public function test_add_plugin_action_links_prepends_settings_link(): void {
		Functions\when( 'admin_url' )->justReturn( 'http://example.org/wp-admin/options-general.php?page=freemius-settings' );

		$settings = Settings::get_instance();
		$links    = $settings->add_plugin_action_links( array( '<a href="#">Deactivate</a>' ) );

		$this->assertCount( 2, $links );
		$this->assertStringContainsString( 'freemius-settings', $links[0] );
		$this->assertStringContainsString( 'Settings', $links[0] );
	}
}
