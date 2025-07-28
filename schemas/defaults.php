<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'product_id'                    => array(
		'label'            => __( 'Product ID', 'freemius' ),
		'type'             => 'integer',
		'default'          => '',
		'description'      => __( 'Required product ID (whether it\'s a plugin, theme, add-on, bundle, or SaaS).', 'freemius' ),
		'isRequired'       => true,
		'isShownByDefault' => true,
	),
	'plugin_id'                     => array(
		'label'        => __( 'Plugin ID', 'freemius' ),
		'type'         => 'integer',
		'default'      => '',
		'description'  => __( 'Required product ID (whether it\'s a plugin, theme, add-on, bundle, or SaaS).', 'freemius' ),
		'isDeprecated' => true,
	),
	'public_key'                    => array(
		'label'            => __( 'Public Key', 'freemius' ),
		'type'             => 'string',
		'default'          => '',
		'description'      => __( 'Required product public key.', 'freemius' ),
		'isRequired'       => true,
		'isShownByDefault' => true,
	),
	'plan_id'                       => array(
		'label'       => __( 'Plan', 'freemius' ),
		'type'        => 'integer',
		'default'     => '',
		'description' => __(
			'The ID of the plan that will load with the checkout. When selling multiple plans you can set the param when calling the open() method.',
			'freemius'
		),
	),
	'pricing_id'                    => array(
		'label'       => __( 'Pricing ID', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'Use the licenses param instead. An optional ID of the exact multi-site license prices that will load once the checkout opened.',
			'freemius'
		),
	),
	'id'                            => array(
		'label'       => __( 'Body ID', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional ID to set the id attribute of the checkout's body HTML element. This argument is particularly useful if you have multiple checkout instances that need to have a slightly different design or visibility of UI components. You can assign a unique ID for each instance and customize it differently using the CSS stylesheet that you can attach through the PLANS - CUSTOMIZATION in the Developer Dashboard.",
			'freemius'
		),
	),
	'name'                          => array(
		'label'        => __( 'Name', 'freemius' ),
		'type'         => 'string',
		'default'      => '',
		'isDeprecated' => true,
		'description'  => __(
			"An optional string to override the product's title. (deprecated, use 'title' instead)",
			'freemius'
		),
	),
	'title'                         => array(
		'label'       => __( 'Title', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional string to override the checkout's title when buying a new license.",
			'freemius'
		),
	),
	'subtitle'                      => array(
		'label'        => __( 'Subtitle', 'freemius' ),
		'type'         => 'string',
		'default'      => '',
		'isDeprecated' => true,
		'description'  => __(
			"This has been deprecated and removed in the new phase2 Checkout (more on it below). An optional string to override the checkout's subtitle.",
			'freemius'
		),
	),
	'image'                         => array(
		'label'       => __( 'Image', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional icon that loads at the checkout and will override the product's icon uploaded to the Freemius Dashboard. Use a secure path to the image over HTTPS. While the checkout will remain PCI compliant, credit-card automatic prefill by the browser will not work.",
			'freemius'
		),
	),
	'licenses'                      => array(
		'label'       => __( 'Licenses', 'freemius' ),
		'type'        => 'integer',
		'default'     => 1,
		'description' => __(
			"A multi-site licenses prices that will load immediately with the checkout. A developer-friendly param that can be used instead of the pricing_id. To specify unlimited licenses prices, use one of the following values: 0, null, or 'unlimited'.",
			'freemius'
		),
	),
	'disable_licenses_selector'     => array(
		'label'       => __( 'Disable licenses selector', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Set this param to true if you like to disable the licenses selector when the product is sold with multiple license activation options.',
			'freemius'
		),
	),
	'hide_licenses'                 => array(
		'label'       => __( 'Hide Licenses', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Set this param to true if you like to entirely hide the 3rd row in the header with the license selector.',
			'freemius'
		),
	),
	'billing_cycle'                 => array(
		'label'       => __( 'Billing Cycle', 'freemius' ),
		'type'        => 'string',
		'default'     => 'annual',
		'description' => __(
			"An optional billing cycle that will be auto selected when the checkout is opened. Can be one of the following values: 'monthly', 'annual', 'lifetime'.",
			'freemius'
		),
		'options'     => array(
			'annual'   => 'annual',
			'monthly'  => 'monthly',
			'lifetime' => 'lifetime',
		),
	),
	'hide_billing_cycles'           => array(
		'label'        => __( 'Hide billing cycles', 'freemius' ),
		'type'         => 'boolean',
		'default'      => false,
		'isDeprecated' => true,
		'description'  => __(
			'This has been deprecated and removed in phase2 Checkout, with the introduction of show_upsells. Set this param to true if you like to hide the billing cycles selector when the product is sold in multiple billing frequencies.',
			'freemius'
		),
	),
	'currency'                      => array(
		'label'       => __( 'Currency', 'freemius' ),
		'type'        => 'string',
		'default'     => 'usd',
		'description' => __(
			"One of the following 3-char currency codes (ISO 4217) or 'auto': 'usd', 'eur', 'gbp'. You could set the parameter to 'auto' to let the checkout automatically choose the currency based on the geolocation of the user. If you decide to choose the 'auto' option, you may also want to dynamically show the prices on your pricing page according to the user's geo. Therefore, we created checkout.freemius.com/geo.json to allow you to identify the browser's geo and currency that the checkout will use by default.",
			'freemius'
		),
		'options'     => array(
			'auto' => 'auto',
			'usd'  => 'usd',
			'eur'  => 'eur',
			'gbp'  => 'gbp',
		),
	),
	'default_currency'              => array(
		'label'       => __( 'Default Currency', 'freemius' ),
		'type'        => 'string',
		'default'     => 'usd',
		'description' => __(
			"You could use this when the 'currency' param is set to 'auto'. In this case, if the auto-detected currency is not associated with any pricing, this will be the fallback currency.",
			'freemius'
		),
		'options'     => array(
			'usd' => 'usd',
			'eur' => 'eur',
			'gbp' => 'gbp',
		),
	),
	'coupon'                        => array(
		'label'       => __( 'Coupon', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'An optional coupon code to be automatically applied on the checkout immediately when opened.',
			'freemius'
		),
	),
	'hide_coupon'                   => array(
		'label'       => __( 'Hide Coupon', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Set this param to true if you pre-populate a coupon and like to hide the coupon code and coupon input field from the user.',
			'freemius'
		),
	),
	'maximize_discounts'            => array(
		'label'        => __( 'Maximize discounts', 'freemius' ),
		'type'         => 'boolean',
		'default'      => true,
		'isDeprecated' => true,
		'description'  => __(
			'This has been deprecated in favor of bundle_discount introduced in phase2 Checkout. Set this param to false when selling a bundle and you want the discounts to be based on the closest licenses quota and billing cycle from the child products. Unlike the default discounts calculation which is maximized by basing the discounts on the child products single-site prices.',
			'freemius'
		),
	),
	'trial'                         => array(
		'label'       => __( 'Trial', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			"When set to true, it will open the checkout in a trial mode and the trial type (free vs. paid) will be based on the plan's configuration. This will only work if you've activated the Free Trial functionality in the plan configuration. If you configured the plan to support a trial that doesn't require a payment method, you can also open the checkout in a trial mode that requires a payment method by setting the value to 'paid'.",
			'freemius'
		),
	),
	'cancel'                        => array(
		'label'       => __( 'Cancel Callback', 'freemius' ),
		'type'        => 'string',
		'code'        => true,
		'default'     => null,
		'description' => __(
			'A callback handler that will execute once a user closes the checkout by clicking the close icon. This handler only executes when the checkout is running in a dialog mode. You can use `data` in your code.',
			'freemius'
		),
	),
	'purchaseCompleted'             => array(
		'label'       => __( 'Purchase Completed Callback', 'freemius' ),
		'type'        => 'string',
		'code'        => true,
		'default'     => null,
		'description' => __(
			'An after successful purchase/subscription completion callback handler. You can use `data` in your code.',
			'freemius'
		),
	),
	'success'                       => array(
		'label'       => __( 'Success Callback', 'freemius' ),
		'type'        => 'string',
		'code'        => true,
		'default'     => null,
		'description' => __(
			'An optional callback handler, similar to purchaseCompleted. The main difference is that this callback will only execute after the user clicks the “Got It”” button that appears in the after purchase screen as a declaration that they successfully received the after purchase email. This callback is obsolete when the checkout is running in a dashboard mode. You can use `data` in your code.',
			'freemius'
		),
	),
	'track'                         => array(
		'label'       => __( 'Track Callback', 'freemius' ),
		'type'        => 'string',
		'code'        => true,
		'default'     => null,
		'description' => __(
			'An optional callback handler for advanced tracking, which will be called on multiple checkout events such as updates in the currency, billing cycle, licenses #, etc. You can use `data` and `event` in your code.',
			'freemius'
		),
	),
	'license_key'                   => array(
		'label'       => __( 'License Key', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'An optional param to pre-populate a license key for license renewal, license extension and more.',
			'freemius'
		),
	),
	'hide_license_key'              => array(
		'label'       => __( 'Hide License Key', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Set this param to true if you like to hide the option to manually enter a license key during checkout for existing license renewal.',
			'freemius'
		),
	),
	'is_payment_method_update'      => array(
		'label'       => __( 'Payment method update', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'An optional param to load the checkout for a payment method update. When set to `true`, the license_key param must be set and associated with a non-canceled subscription.',
			'freemius'
		),
	),
	'user_email'                    => array(
		'label'       => __( 'User Email', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional string to prefill the buyer's email address.",
			'freemius'
		),
	),
	'user_firstname'                => array(
		'label'       => __( 'User Firstname', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional string to prefill the buyer's first name.",
			'freemius'
		),
	),
	'user_lastname'                 => array(
		'label'       => __( 'User Lastname', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			"An optional string to prefill the buyer's last name.",
			'freemius'
		),
	),
	'readonly_user'                 => array(
		'label'       => __( 'Readonly User arguments', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Set this parameter to true to make the user details (name and email) readonly. This is useful for SaaS integration where you are loading the user email and their first and last name from your own DB.',
			'freemius'
		),
	),
	'affiliate_user_id'             => array(
		'label'       => __( 'Affiliate User ID', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'An optional user ID to associate purchases generated through the checkout with their affiliate account.',
			'freemius'
		),
	),
	'locale'                        => array(
		'label'       => __( 'Language (xx_XX)', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'If given the Checkout will load in the selected language and would also show an UI for the user to switch language.',
			'freemius'
		),
	),
	'layout'                        => array(
		'label'       => __( 'Layout', 'freemius' ),
		'type'        => 'string',
		'default'     => 'auto',
		'description' => __(
			'Specify the layout of the form on a larger screen. This cannot be horizontal in cases like payment method updates or free plans. If set  null the system will automatically choose the best default for the current checkout mode.',
			'freemius'
		),
		'options'     => array(
			'auto'       => 'auto',
			'vertical'   => 'vertical',
			'horizontal' => 'horizontal',
		),
	),
	'form_position'                 => array(
		'label'       => __( 'Form position', 'freemius' ),
		'type'        => 'string',
		'default'     => 'left',
		'description' => __(
			'Specifies the position of the form in horizontal layout.',
			'freemius'
		),
		'options'     => array(
			'left'  => 'left',
			'right' => 'right',
		),
	),
	'fullscreen'                    => array(
		'label'       => __( 'Fullscreen', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'If set to true, the Checkout dialog will take the entire screen when opened.',
			'freemius'
		),
	),
	'show_upsells'                  => array(
		'label'       => __( 'Show upsells', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			'Whether or not showing the upsell toggles.',
			'freemius'
		),
	),
	'show_reviews'                  => array(
		'label'       => __( 'Show reviews', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			'Whether or not showing featured reviews in the checkout. By default it will be shown if the checkout page is loaded directly, without any JS snippet (iFrame) integration call.',
			'freemius'
		),
	),
	'review_id'                     => array(
		'label'       => __( 'Review ID', 'freemius' ),
		'type'        => 'integer',
		'default'     => null,
		'description' => __(
			'When showing the review UI in the checkout, you can specify which review you want to show with its ID. By default the latest featured review will be shown.',
			'freemius'
		),
	),
	'show_refund_badge'             => array(
		'label'       => __( 'Show refund badge', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Whether or not showing Refund Policy UI in the checkout. By default it will be shown if the checkout page is loaded directly, without any JS snippet (iFrame) integration call.',
			'freemius'
		),
	),
	'refund_policy_position'        => array(
		'label'       => __( 'Refund policy position', 'freemius' ),
		'type'        => 'string',
		'default'     => 'dynamic',
		'description' => __(
			"Use the parameter to position the refund policy badge when showing the form in horizontal layout. By default with the 'dynamic' value it will be positioned either below the form or the breakdown column. But with static value you have full control.",
			'freemius'
		),
		'options'     => array(
			'dynamic'         => 'dynamic',
			'below_form'      => 'below_form',
			'below_breakdown' => 'below_breakdown',
		),
	),
	'annual_discount'               => array(
		'label'       => __( 'Show Annual discount', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			'Determines whether the annual discount will be shown in the checkout.',
			'freemius'
		),
	),
	'show_monthly_switch'           => array(
		'label'       => __( 'Show monthly switch', 'freemius' ),
		'type'        => 'boolean',
		'default'     => false,
		'description' => __(
			'Switching to the monthly billing cycle is disabled when the Checkout is loaded with annual billing cycle. Use this parameter to show it.',
			'freemius'
		),
	),
	'multisite_discount'            => array(
		'label'       => __( 'Multisite discount', 'freemius' ),
		'type'        => 'string',
		'default'     => 'auto',
		'description' => __(
			'Determines whether the multi-site discount will be shown. When the value is auto, the discount will only be shown if the single license pricing difference does not exceed 10 times more than the current pricing.',
			'freemius'
		),
		'options'     => array(
			'auto'  => 'auto',
			'true'  => 'true',
			'false' => 'false',
		),
	),
	'bundle_discount'               => array(
		'label'       => __( 'Bundle discount', 'freemius' ),
		'type'        => 'boolean',
		'default'     => 'maximize',
		'description' => __(
			'Determines whether the bundle discount will be shown. The bundle discount itself depends on the compound price of its children. By default with maximize, we try to take the compound price from the lowest billing cycle and license. But with the value of true, we take it from the closest billing cycle and licenses.',
			'freemius'
		),
		'options'     => array(
			'maximize' => 'maximize',
			'true'     => 'true',
			'false'    => 'false',
		),
	),
	'show_inline_currency_selector' => array(
		'label'       => __( 'Show inline currency selector', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			"Set it to false to hide the inline currency selector from the “Today's Total” line.",
			'freemius'
		),
	),
	'cancel_url'                    => array(
		'label'       => __( 'Cancel URL', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'When the checkout is loaded in page you can specify a cancel URL to be used for the back button. By default if you link Freemius Checkout from your website, it will be picked up from the Referer header (if present). Using this option you can override the URL as needed.',
			'freemius'
		),
	),
	'cancel_icon'                   => array(
		'label'       => __( 'Cancel icon', 'freemius' ),
		'type'        => 'string',
		'default'     => '',
		'description' => __(
			'By default the website icon (also known as favicon) will be rendered alongside the cancel button. If you want to use any other icon image, please specify the link to the icon using this parameter.',
			'freemius'
		),
	),
	'always_show_renewals_amount'   => array(
		'label'       => __( 'Always show renewals amount', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			'When set to true, a small line mentioning the total renewal price per billing cycle will shown below the total. By default, it only shows up when there is a renewal discount involved.',
			'freemius'
		),
	),
	'is_bundle_collapsed'           => array(
		'label'       => __( 'Bundle is collapsed', 'freemius' ),
		'type'        => 'boolean',
		'default'     => true,
		'description' => __(
			'If present, it will show the billing cycle selector UI in the Checkout. The accepted values are',
			'freemius'
		),
	),
	'billing_cycle_selector'        => array(
		'label'       => __( 'Billing cycle selector', 'freemius' ),
		'type'        => 'string',
		'default'     => 'auto',
		'description' => __(
			'If present, it will show the billing cycle selector UI in the Checkout.',
			'freemius'
		),
		'options'     => array(
			'responsive_list' => __( 'Responsive List', 'freemius' ),
			'dropdown'        => __( 'Dropdown', 'freemius' ),
			'list'            => __( 'List', 'freemius' ),
		),
	),
);
