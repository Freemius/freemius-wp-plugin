# Freemius Button

The Freemius Button extends the core Button block with Freemius Checkout. When enabled, clicking the button opens the Freemius Checkout popup.

Use it **standalone** on any Button block — enable Freemius Checkout and configure checkout on the button itself. Or place it **inside a scope** (a Freemius-enabled Group, Column, or similar block) so it inherits product, plan, and modifiers from that scope.

## Overview

![Freemius Checkout button selected in the editor with Freemius sidebar settings](../assets/button-checkout.png)

The example above uses a scoped group with a plan modifier and a core Button block with Freemius Checkout enabled. See [Scopes](scopes/README.md) and [Mapping](scopes/mapping.md) for building similar layouts.

For installation, your first checkout button, and testing with Preview, see [Getting started](getting-started.md).

## Key settings

- **Product ID** — Freemius product ID (required)
- **Public Key** — Freemius public key (required)
- **Plan ID**, **Pricing ID**, **Billing Cycle**, **Currency**, **Quantity**, **Coupon**
- **Success URL**, **Cancel URL**, **Custom Fields**

See [Freemius checkout documentation](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/) for details.

Hidden settings are listed in the Freemius **options menu** (three dots on the Freemius panel header). Open it to show or hide fields such as Product ID and Plan:

![Freemius options menu with additional checkout field toggles](../assets/button-key-settings.png)

## Customization

Use standard WordPress button block controls for colors, typography, dimensions, border, and spacing.

## Events and callbacks

Handle checkout events with custom JavaScript:

- `purchaseCompleted`, `success`, `cancel`, `track`

![Popout Editor control in the Freemius button settings](../assets/button-popout-editor.png)

Open **Popout Editor** for a larger code editor:

![Callback popout editor with custom JavaScript](../assets/button-callback-editor.png)

Examples: [Freemius tracking docs](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#tracking_purchases_with_google_analytics_and_facebook).

## Preview

![Preview button in the Freemius button settings sidebar](../assets/button-preview.png)

Use **Preview** in the sidebar or toolbar to test checkout. **Auto Refresh** updates the preview when settings change.

## Tips

- Inside a scope, the button inherits parent settings; override on the button only when needed
- Test with Preview before publishing
- Use callbacks to integrate analytics or custom flows
