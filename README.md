# Freemius for WordPress

Contributors:      freemius, xaverb  
Tags:              freemius, checkout, payment, button  
Tested up to:      6.9  
Stable tag:        0.4.2  
License:           MIT  

Freemius for WordPress helps you to add Freemius Checkout to any button of your WordPress content using the block editor.

## Description

Freemius for WordPress is a powerful WordPress plugin that allows you to transform any block-based button into a Freemius checkout button. This makes it easy to integrate Freemius payment processing into your WordPress site with minimal effort.

<https://www.youtube.com/watch?v=MTOuIBGan7E>

### Key features

- Convert any block button to a Freemius checkout button
- Seamless integration with Freemius payment processing
- Customizable checkout experience
- Works with all block-based themes and plugins

### Roadmap

- Support for Pricing tables.
- Better support to measure analytics.
- Dedicated Settings page.
- Testimonials (from the API).

## Installation

1. Upload the plugin files to the `/wp-content/plugins/freemius` directory, or install the plugin through the WordPress plugins screen directly
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Place a button via the block editor into your page/post
4. Enable Freemius checkout in the button settings
5. Configure your product details and the button will automatically handle the checkout process.

## Frequently Asked Questions

### How do I set up a Freemius checkout button?

Simply add a button block to your page or post, then enable the Freemius checkout option in the button settings. Configure your product details and the button will automatically handle the checkout process.

### Can I customize the checkout experience?

Yes, you can customize various aspects of the checkout process through the plugin settings, including product details, pricing, and checkout flow.

### Is this plugin compatible with my theme?

The plugin works with any WordPress theme that supports the block editor (Gutenberg). It's designed to be compatible with all modern WordPress themes and plugins.

### Where do I find the offical Freemius documentation?

[Freemius Documentation](https://freemius.com/help/documentation/)

## Screenshots

1. Button block settings with Freemius checkout option
2. Example of a Freemius checkout button in action

## Changelog

## [0.4.2]

- fixed: missing import for MappingSettings
- updated: dependencies

## [0.4.1]

- fixed: missing import in useMapping hook
- improved: support for button tag in the button block (WordPress 6.9)
- updated: Tested up to 6.9
- updated: dependencies

## [0.4.0]

- added: support for multiple products — manage and configure multiple Freemius products
- added: "Get Started" tab in settings with helpful video tutorial
- improved: plugin now automatically redirects to settings page after activation
- improved: product-specific configuration and data handling
- improved: API token handling and authentication
- improved: cleaner interface with improved error messages
- changed: simplified authentication — no longer requires `public_key` parameter (breaking)
- improved: faster loading and plugin performance
- fixed: various stability improvements

## [0.3.0]

- added: pricing table functionality with dynamic plan display
- changed: complete refactoring of Freemius settings and API structure (breaking)
- improved: modifier functionality with improved data handling
- added: Freemius API health management and error handling
- improved: blueprint configuration with updated landing page and plugin URLs
- added: hooks and stores for better state management
- improved: checkout flow with better customization options
- updated: dependencies and performance
- changed: codebase structure with new component organization
- added: support for advanced pricing modifiers and billing cycles

## [0.2.1]

- added: popout editor for code fields

## [0.2.0]

- changed: deprecated argument `plugin_id` to `product_id` (breaking)

## [0.1.9]

- added: support for WordPress 6.8
- improved: button customization options
- fixed: bug fixes and performance improvements

## [0.1.8]

- improved: checkout flow
- added: new customization options
- fixed: compatibility issues

## [0.1.7]

- improved: error handling
- added: support for custom checkout fields
- improved: performance optimizations

## [0.1.6]

- added: initial public release with basic Freemius checkout integration and core functionality

## [0.1.0]

- added: initial development release
