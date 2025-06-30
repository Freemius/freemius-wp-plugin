# Freemius Button

The Freemius Button allows you to add Freemius Checkout to any button of your WordPress content using the block editor.

## Overview

The Freemius Button extends the core Button block with Freemius Checkout functionality. When enabled, clicking the button will open the Freemius Checkout popup to process payments.

![Freemius Checkout](https://raw.githubusercontent.com/Freemius/freemius-wp-plugin/refs/heads/main/docs/assets/checkout.png)

## Getting Started

1. Install the Freemius Button plugin from the WordPress.org repository.
2. Add a new button block to your content.
3. Enable the Freemius Button by checking the "Freemius Checkout" checkbox.
4. Configure the button settings as needed.

## Configuration Scopes

The button settings can be configured at three different scopes:

1. **Global** - Settings that apply site-wide
2. **Page** - Settings that apply to the current page/post
3. **Button** - Settings specific to the individual button

Settings cascade down from global to button level, with more specific scopes overriding broader ones.

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

## Customization

The button appearance can be customized using the standard WordPress button block settings for:

- Colors
- Typography
- Dimensions
- Border
- Spacing

## Events & Callbacks

You can add custom JavaScript code to handle various checkout events:

- `purchaseCompleted` - Called after successful purchase
- `success` - Called after successful transaction
- `cancel` - Called when checkout is cancelled
- `track` - Called for tracking events

## Preview

Use the Preview button in the toolbar or sidebar to test your checkout configuration before publishing.

The Auto Refresh option will automatically update the preview when settings change.

## Tips

- Configure common settings at the global scope
- Override specific settings at page/button level as needed
- Test the checkout flow using Preview mode
- Use event callbacks to integrate with other functionality
- Refer to [Freemius documentation](https://freemius.com/help/documentation/) for detailed options
