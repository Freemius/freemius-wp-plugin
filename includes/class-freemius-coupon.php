<?php
/**
 * Freemius Coupon helpers
 *
 * @package    Freemius
 * @category   WordPress_Plugin
 * @author     Freemius <support@freemius.com>
 * @license    MIT
 * @link       https://freemius.com/
 */

namespace Freemius;

/**
 * Class Coupon
 *
 * @package Freemius
 * @since 0.5.0
 */
class Coupon {
	/**
	 * Fetch coupon metadata by code.
	 *
	 * @since 0.5.0
	 *
	 * @param int    $product_id Product ID.
	 * @param string $code       Coupon code.
	 * @return array<string, mixed>|null Coupon data or null when not found.
	 */
	public static function get_by_code( int $product_id, string $code ): ?array {
		if ( '' === $code ) {
			return null;
		}

		$api    = Api::get_instance();
		$result = $api->get_request(
			'products/' . $product_id . '/coupons.json',
			array( 'code' => $code )
		);

		if ( \is_wp_error( $result ) ) {
			return null;
		}

		$data = $result->get_data();

		if ( empty( $data['coupons'][0] ) || ! \is_array( $data['coupons'][0] ) ) {
			return null;
		}

		return $data['coupons'][0];
	}

	/**
	 * Whether a coupon applies to the given plan.
	 *
	 * @since 0.5.0
	 *
	 * @param array<string, mixed> $coupon  Coupon metadata.
	 * @param int|string|null      $plan_id Plan ID.
	 * @return bool
	 */
	public static function applies_to_plan( array $coupon, $plan_id ): bool {
		if ( empty( $coupon['plans'] ) ) {
			return true;
		}

		$plan_ids = \array_map( 'trim', \explode( ',', (string) $coupon['plans'] ) );

		return \in_array( (string) $plan_id, $plan_ids, true );
	}

	/**
	 * Apply coupon discount to a base price.
	 *
	 * @since 0.5.0
	 *
	 * @param float                $price    List price.
	 * @param array<string, mixed> $coupon   Coupon metadata.
	 * @param string               $currency Currency code.
	 * @return float Discounted price, floored at zero.
	 */
	public static function apply_discount( float $price, array $coupon, string $currency ): float {
		$discounted = $price;

		if ( isset( $coupon['discount_type'] ) && 'percentage' === $coupon['discount_type'] ) {
			$discounted = $price * ( 1 - ( (float) $coupon['discount'] / 100 ) );
		} else {
			$currency_key = strtolower( $currency );
			$amount       = $coupon['discounts'][ $currency_key ] ?? (float) $coupon['discount'];
			$discounted   = $price - (float) $amount;
		}

		return max( 0.0, $discounted );
	}

	/**
	 * Coupon fields to embed on the frontend.
	 *
	 * @since 0.5.0
	 *
	 * @param array<string, mixed> $coupon Full coupon payload.
	 * @return array<string, mixed>
	 */
	public static function to_embed_data( array $coupon ): array {
		return array(
			'discount'      => $coupon['discount'] ?? 0,
			'discount_type' => $coupon['discount_type'] ?? 'percentage',
			'plans'         => $coupon['plans'] ?? null,
			'discounts'     => $coupon['discounts'] ?? array(),
		);
	}
}
