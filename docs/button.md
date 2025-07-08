# Freemius Button

The Freemius Button allows you to add Freemius Checkout to any button of your WordPress content using the block editor.

## Overview

The Freemius Button extends the core Button block with Freemius Checkout functionality. When enabled, clicking the button will open the Freemius Checkout popup to process payments.

![Freemius Checkout](https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/checkout.png)

## Getting Started

1. Install the [Freemius for WordPress](https://wordpress.org/plugins/freemius/) plugin from the WordPress.org repository.
2. Add a new button block to your content.
3. Enable the Freemius Button by checking the "Freemius Checkout" checkbox.
4. Configure the button settings as needed.

## Configuration Scopes

The button settings can be configured at three different scopes:

1. **Global** - Settings that apply site-wide
2. **Page** - Settings that apply to the current page/post
3. **Button** - Settings specific to the individual button

<img width="275" alt="scopes" src="https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/scopes.png" />

Settings cascade down from global to button level, with more specific scopes overriding broader ones. This means that if you set a setting at the global level, it will be applied to all buttons on your site. If you set a setting at the page level, it will be applied to all buttons on that page. If you set a setting at the button level, it will only be applied to that specific button.

This way, you can override the global settings for a specific page or button.

## Key Settings

- **Product ID** - Your Freemius product ID (required)
- **Public Key** - Your Freemius public key (required)
- **Plan ID** - Specific plan to offer
- **Pricing ID** - Specific pricing to offer
- **Billing Cycle** - Default billing cycle (monthly/annual)
- **Currency** - Transaction currency
- **Quantity** - Default quantity
- **Coupon** - Default coupon code
- **Custom Fields** - Additional checkout fields
- **Success URL** - Redirect URL after successful purchase
- **Cancel URL** - Redirect URL after cancellation

Please refer to the [Freemius documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/) for more information on these settings.

By default, settings that are not set are hidden. You can find them by clicking on the "three-dots-button" in the toolbar:

<img width="326" alt="key-settings" src="https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/key-settings.png" />

## Customization

The button appearance can be customized using the standard WordPress button block settings for:

- Colors
- Typography
- Dimensions
- Border
- Spacing

## Events & Callbacks

You can add custom JavaScript code to handle various checkout events:

- `purchaseCompleted` - Called after a successful purchase
- `success` - Called after a successful transaction
- `cancel` - Called when checkout is canceled
- `track` - Called for tracking events

To add custom JS, find the specific settings and enter the code you would like to execute when the event is triggered.

<img width="375" alt="popout-editor" src="https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/popout-editor.png" />

You can also click on "**Popout Editor**" to get a bigger editor to enter your custom code.

<img width="645" alt="callback-editor" src="https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/callback-editor.png" />

Find examples on the [Freemius documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#tracking_purchases_with_google_analytics_and_facebook)

## Preview

<img width="375" alt="preview" src="https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/preview.png"  />

Use the Preview button in the toolbar or sidebar to test your checkout configuration before publishing.

The Auto Refresh option will automatically update the preview when settings change.

## Tips

- Configure common settings at the global scope
- Override specific settings at page/button level as needed
- Test the checkout flow using Preview mode
- Use event callbacks to integrate with other functionality
- Refer to [Freemius documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/) for detailed options
