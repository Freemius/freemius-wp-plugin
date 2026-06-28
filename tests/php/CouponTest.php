<?php
/**
 * Tests for Freemius Coupon helpers.
 *
 * @package Freemius
 */

declare(strict_types=1);

namespace Freemius\Tests;

use Freemius\Coupon;

class CouponTest extends Freemius_TestCase {

	public function test_applies_to_plan_when_plans_is_null(): void {
		$coupon = array(
			'plans' => null,
		);

		$this->assertTrue( Coupon::applies_to_plan( $coupon, 32842 ) );
	}

	public function test_applies_to_plan_when_plan_is_listed(): void {
		$coupon = array(
			'plans' => '32841,32842',
		);

		$this->assertTrue( Coupon::applies_to_plan( $coupon, 32842 ) );
		$this->assertFalse( Coupon::applies_to_plan( $coupon, 32843 ) );
	}

	public function test_apply_discount_percentage(): void {
		$coupon = array(
			'discount'      => 10,
			'discount_type' => 'percentage',
		);

		$this->assertSame( 45.0, Coupon::apply_discount( 50.0, $coupon, 'usd' ) );
	}

	public function test_apply_discount_dollar(): void {
		$coupon = array(
			'discount'      => 5,
			'discount_type' => 'dollar',
		);

		$this->assertSame( 45.0, Coupon::apply_discount( 50.0, $coupon, 'usd' ) );
	}

	public function test_apply_discount_dollar_uses_currency_specific_amount(): void {
		$coupon = array(
			'discount'      => 5,
			'discount_type' => 'dollar',
			'discounts'     => array(
				'eur' => 9,
			),
		);

		$this->assertSame( 41.0, Coupon::apply_discount( 50.0, $coupon, 'eur' ) );
	}

	public function test_apply_discount_floors_at_zero(): void {
		$coupon = array(
			'discount'      => 100,
			'discount_type' => 'dollar',
		);

		$this->assertSame( 0.0, Coupon::apply_discount( 50.0, $coupon, 'usd' ) );
	}

	public function test_to_embed_data_returns_frontend_fields_only(): void {
		$embedded = Coupon::to_embed_data(
			array(
				'code'          => 'SAVE20',
				'discount'      => 10,
				'discount_type' => 'percentage',
				'plans'         => '32842',
				'discounts'     => array( 'usd' => 10 ),
				'redemptions'   => 5,
			)
		);

		$this->assertSame(
			array(
				'discount'      => 10,
				'discount_type' => 'percentage',
				'plans'         => '32842',
				'discounts'     => array( 'usd' => 10 ),
			),
			$embedded
		);
	}

	public function test_get_by_code_returns_null_for_empty_code(): void {
		$this->assertNull( Coupon::get_by_code( 19794, '' ) );
	}

	public function test_get_by_code_returns_coupon_from_api(): void {
		$this->options['freemius_settings'] = array(
			'token' => '1234567890',
		);

		$coupon = Coupon::get_by_code( 19794, 'SAVE20' );

		$this->assertIsArray( $coupon );
		$this->assertSame( 'SAVE20', $coupon['code'] );
		$this->assertSame( 'percentage', $coupon['discount_type'] );
	}
}
