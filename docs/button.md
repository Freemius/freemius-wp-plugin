# Freemius Button

The Freemius Button extends the core Button block with Freemius Checkout. When enabled, clicking the button opens the Freemius Checkout popup.

Use it **standalone** on any Button block — enable Freemius Checkout and configure checkout on the button itself. Or place it **inside a scope** (a Freemius-enabled Group, Column, or similar block) so it inherits product, plan, and modifiers from that scope.

## Overview

![Mapped Freemius checkout button in the pricing table with Freemius sidebar settings highlighted](assets/button-overview.png)

The example above shows a mapped checkout button inside a pricing table scope. See [Scopes](scopes.md) and [Mapping](mapping.md) for building similar layouts.

For installation, your first checkout button, and testing with Preview, see [Getting started](getting-started.md).

## Key settings

- **Product ID** — Freemius product ID (required)
- **Plan ID**, **Pricing ID**, **Billing Cycle**, **Currency**, **Quantity**, **Coupon**
- **Success URL**, **Cancel URL**, **Custom Fields**

See [Freemius checkout documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/) for details.

Hidden settings are listed in the Freemius **options menu** (three dots on the Freemius panel header). Open it to show or hide fields such as Product ID and Plan:

![Freemius options menu with additional checkout field toggles](assets/button-key-settings.png)

## Customization

Use standard WordPress button block controls for colors, typography, dimensions, border, and spacing.

## Events and callbacks

Handle checkout events with custom JavaScript:

- `purchaseCompleted`, `success`, `cancel`, `track`

Use **Track Callback** for advanced tracking across checkout events (currency changes, billing cycle updates, license count, and more). Open **Popout Editor** for a larger code editor:

![Track Callback in the Freemius button sidebar with Popout Editor open](assets/button-track-callback.png)

For more `track` events, see the [Freemius checkout track documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#track).

## Preview

![Pricing page editor with checkout preview open and the Preview button outlined](assets/pricing-page-preview.png)

Use **Preview** in the sidebar or toolbar to test checkout. **Auto Refresh** updates the preview when settings change.

## Tips

- Inside a scope, the button inherits parent settings; override on the button only when needed
- Test with Preview before publishing
- Use callbacks to integrate analytics or custom flows
