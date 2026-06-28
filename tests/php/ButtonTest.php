<?php
/**
 * Tests for Freemius Button.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Brain\Monkey\Functions;
use Freemius\Button;

class ButtonTest extends Freemius_TestCase {

	public function test_render_button_returns_unchanged_without_attrs(): void {
		$button  = Button::get_instance();
		$content = '<div class="wp-block-button">Buy</div>';

		$result = $button->render_button( $content, array(), array() );

		$this->assertSame( $content, $result );
	}

	public function test_render_button_returns_unchanged_when_disabled(): void {
		$button  = Button::get_instance();
		$content = '<div class="wp-block-button">Buy</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => false,
			),
		);

		$result = $button->render_button( $content, $block, array() );

		$this->assertSame( $content, $result );
	}

	public function test_render_button_enqueues_scripts_when_enabled(): void {
		$enqueue_calls = 0;

		Functions\when( 'wp_enqueue_script' )->alias(
			static function () use ( &$enqueue_calls ) {
				++$enqueue_calls;
			}
		);

		$button  = Button::get_instance();
		$content = '<div class="wp-block-button">Buy</div>';
		$block   = array(
			'attrs' => array(
				'freemius_enabled' => true,
			),
		);

		$result = $button->render_button( $content, $block, array() );

		$this->assertSame( $content, $result );
		$this->assertSame( 2, $enqueue_calls );
	}
}
