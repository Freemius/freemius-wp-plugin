# How it works

Freemius for WordPress is a toolkit for selling Freemius products on WordPress sites that use the Block Editor.

For installation, product connection, and guide links, start at the [documentation home](../README.md).

## Architecture

The plugin uses the Freemius API in the **block editor** to load product and plan data while you build a page. You attach **scopes** — Freemius-enabled groups, columns, or buttons — so each area of a page can use its own plan, currency, or billing cycle. Child blocks inherit their parent scope unless you override them.

On the **published frontend**, checkout opens the Freemius checkout overlay from button clicks. Mapped field values (price, title, description, and similar) are stored in the page content when you publish; they are not fetched live on every page view.

## Requirements

- WordPress 6.7+
- Freemius account and product
- Block Editor (Gutenberg)

## Related guides

- [Getting started](getting-started.md)
- [Creating your Pricing page](creating-your-pricing-page.md)
- [Freemius Button](button.md)
- [Scopes](scopes/README.md)
