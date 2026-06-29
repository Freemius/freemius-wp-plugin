# Freemius for WordPress

If you use WordPress with the Block Editor, **Freemius for WordPress** lets you integrate Freemius checkout directly while you build landing and sales pages for your Freemius product. No JavaScript snippets, theme hacks, or custom code required.

**Not using the Block Editor?** See [Freemius overlay checkout](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/) or [hosted checkout](https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-hosted-page/) in the main Freemius documentation.

## What you get

Out of the box, the plugin provides:

- **Native Block Editor support (Gutenberg)** — Drop checkout buttons or pricing tables into your layouts like any other block. Add a “Buy Now” button to a landing page in seconds.
- **Dynamic pricing tables** — Show multiple plans with clear comparisons and calls-to-action. For example, present Starter, Pro, and Agency tiers side by side with checkout built in.
- **Plan switching and trials** — Let customers change plan, billing cycle, or currency on the page, and support trials where your product allows them.
- **Compatibility with modern block themes** — Works with block-based themes and plugins without editing your theme.
- **Free and open source** — MIT-licensed; extend or contribute via the [GitHub repository](https://github.com/Freemius/freemius-wp-plugin).

## Resources

- [Download on WordPress.org](https://wordpress.org/plugins/freemius/)
- [GitHub repository](https://github.com/Freemius/freemius-wp-plugin)
- [Try the plugin on WordPress Playground](https://playground.wordpress.net/?plugin=freemius)
- [Plugin readme, roadmap, and changelog](https://github.com/Freemius/freemius-wp-plugin#readme)
- [Freemius documentation hub](https://freemius.com/help/documentation/)

## Quick start: checkout button

1. Install and activate the plugin on your WordPress site.
2. Add a **Button** block to a page or post, then enable **Freemius Checkout** in the block sidebar.
3. Connect your product under **Settings → Freemius**, configure defaults, and use **Preview** in the sidebar to test checkout before you publish.

**Video walkthrough:** [How to set up a Freemius checkout button](https://www.youtube.com/watch?v=MTOuIBGan7E)

For the full setup path, continue with [Getting started](user-guide/getting-started.md).

## Documentation

Step-by-step guides for site owners and editors:

| Guide | What it covers |
| ----- | -------------- |
| [Getting started](user-guide/getting-started.md) | Install the plugin, connect your Freemius product, and add your first checkout button |
| [Creating your Pricing page](user-guide/creating-your-pricing-page.md) | Build a multi-plan pricing page with modifiers, scoped columns, mapped fields, and checkout buttons |
| [Freemius Button](user-guide/button.md) | Enable checkout on a button, scopes, preview, and optional settings |
| [Scopes](user-guide/scopes/README.md) | Nested pricing contexts on one page (groups, columns, buttons) |
| [Field mapping](user-guide/scopes/mapping.md) | Pull plan price, title, description, and billing labels into blocks |
| [Scope modifiers](user-guide/scopes/modifiers.md) | Currency, billing cycle, and license toggles on the page |
| [Settings](user-guide/settings.md) | Admin tabs: Products, Editor Settings, and site-wide defaults |
| [How it works](user-guide/README.md) | Requirements, architecture, and how scopes inherit settings |

## Requirements

- WordPress 6.7 or later
- A [Freemius](https://freemius.com/) account
- A Freemius product (plugin, theme, or SaaS) with checkout enabled

## FAQs

### How do I set up a Freemius checkout button?

Add a **Button** block, turn on **Freemius Checkout** in the Freemius panel, and set your product under **Settings → Freemius**. See [Getting started](user-guide/getting-started.md) and [Freemius Button](user-guide/button.md).

### Can I customize the checkout experience?

Yes. Set product, plan, billing cycle, currency, and other checkout options in **Settings → Freemius** and in block **scopes** on each page. You can also map button labels and use custom success or cancel URLs on buttons. See [Settings](user-guide/settings.md) and [Scopes](user-guide/scopes/README.md).

### Is the plugin compatible with my theme?

The plugin targets the Block Editor (Gutenberg). It works with block themes and classic themes that support the block editor.

### Where is pricing data loaded from?

Mapped prices and plan copy are saved when you edit and publish a page; the frontend does not call the Freemius API on every visit. After you change prices on the Freemius dashboard, reopen the page in the editor and **Update** it. See [Creating your Pricing page](user-guide/creating-your-pricing-page.md#important-pricing-data-is-not-live-on-the-frontend).
