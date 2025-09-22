# Freemius for WordPress

Contributors:      freemius, xaverb  
Tags:              freemius, checkout, payment, button  
Tested up to:      6.8  
Stable tag:        0.4.0  
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

### 0.4.0

- **Feature**: Added support for multiple products - you can now manage and configure multiple Freemius products
- **Feature**: Added "Get Started" tab in settings with helpful video tutorial
- **Improved Setup**: Plugin now automatically redirects to settings page after activation
- **Enhanced Product Management**: Better product-specific configuration and data handling
- **Enhanced Security**: Improved API token handling and authentication
- **Better User Experience**: Cleaner interface with improved error messages
- **Breaking Change**: Simplified authentication - no longer requires `public_key` parameter
- **Performance**: Faster loading and improved plugin performance
- **Bug Fixes**: Various improvements and fixes for better stability

### 0.3.0

- **Major Feature**: Added pricing table functionality with dynamic plan display
- **Breaking Change**: Complete refactoring of Freemius settings and API structure
- Enhanced modifier functionality with improved data handling
- Added new Freemius API health management and error handling
- Improved blueprint configuration with updated landing page and plugin URLs
- Added new hooks and stores for better state management
- Enhanced checkout flow with better customization options
- Updated dependencies and improved performance
- Refactored codebase structure with new component organization
- Added support for advanced pricing modifiers and billing cycles

### 0.2.1

- Added popout editor for code fields

### 0.2.0

- changed deprecated argument "plugin_id" to "product_id" (breaking change)

### 0.1.9

- Added support for WordPress 6.8
- Improved button customization options
- Bug fixes and performance improvements

### 0.1.8

- Enhanced checkout flow
- Added new customization options
- Fixed compatibility issues

### 0.1.7

- Improved error handling
- Added support for custom checkout fields
- Performance optimizations

### 0.1.6

- Initial public release
- Basic Freemius checkout integration
- Core functionality implementation

### 0.1.0

- Initial development release
