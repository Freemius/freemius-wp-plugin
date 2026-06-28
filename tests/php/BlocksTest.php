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

	public function test_register_blocks_registers_modifier_block(): void {
		$registered_path = null;

		Functions\when( 'register_block_type' )->alias(
			static function ( $path ) use ( &$registered_path ) {
				$registered_path = $path;
			}
		);

		Blocks::get_instance()->register_blocks();

		$this->assertSame( FREEMIUS_PLUGIN_DIR . '/build/blocks/modifier', $registered_path );
	}
}
