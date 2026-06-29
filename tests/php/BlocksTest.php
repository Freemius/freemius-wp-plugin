<?php
/**
 * Tests for Freemius Blocks.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Brain\Monkey\Functions;
use Freemius\Blocks;

class BlocksTest extends Freemius_TestCase {

	public function test_register_blocks_registers_modifier_and_portal_blocks(): void {
		$registered_paths = array();

		Functions\when( 'register_block_type' )->alias(
			static function ( $path ) use ( &$registered_paths ) {
				$registered_paths[] = $path;
			}
		);

		Blocks::get_instance()->register_blocks();

		$this->assertContains( FREEMIUS_PLUGIN_DIR . '/build/blocks/modifier', $registered_paths );
		$this->assertContains( FREEMIUS_PLUGIN_DIR . '/build/blocks/portal', $registered_paths );
	}
}
