# Freemius for WordPress

The Freemius for WordPress is a toolkit to help people sell products on their WordPress sites.

## General Idea

This plugin helps you quickly set up a sales page for your WordPress product that you sell via Freemius.

## How it works

The plugin uses the Freemius API to fetch the product data and display it in the block editor.

The plugin also allows you to add Freemius Checkout to any button of your WordPress content using the block editor.

## Requirements

- WordPress 6.7+
- Freemius account
- Freemius product

## Installation

1. Install the plugin via the WordPress admin panel.
2. Activate the plugin.
3. Go to the Freemius settings page (Settings => Freemius) and enter your Freemius Token.
4. Go to the "Editor Settings" page and enter `product_id`, `public_key`.

## Checkout Button

The easiest way to enable a checkout button is to create a new page (or edit an existing one) and add a new button block to the content.


https://github.com/user-attachments/assets/c07268f2-0dc1-439a-840c-7e52215016cb


Enable the checkout for this button in the inspector panel.

You can instantly preview the button by clicking the "Preview" button in the inspector panel. Change the properties for this specific button with the settings below.

## Working with Scopes

The plugin allows you to create multiple scopes for your product. Each scope can have different pricing and checkout buttons.

A scope can be enabled on these blocks (or their children):

- Group Block
- Columns Block
- Column Block
- Button Block

<img width="280" height="284" alt="enable_checkout_full" src="https://github.com/user-attachments/assets/52b2e108-f3f2-4fd2-8760-c730a8c48315" />



Each scope inherits the properties of the parent scope. The first scope in the hierarchy will inherit the properties of the "Editor Settings" page.

### Mapping

You can map certain fields from your plans (e.g., "title", "description", "price", etc.) to the content of the blocks.

The following blocks can "receive" data from the scope:

- Paragraph Block
- HeadingBlock
- Button Block

Currently, 5 fields are supported:

- Title
- Description
- Price
- Licenses (1, 2, 3, Unlimited)
- Billing Cycle (Monthly, Yearly, Lifetime)

You can see a purple outline around all blocks with a scope. The dotted outline indicates a mapped field:

<img width="1243" height="703" alt="pricing_with_scopes" src="https://github.com/user-attachments/assets/c84d5c2f-07c0-46df-8ac3-843f2961d493" />

### Scope Modifiers

Modifiers can be used to change the settings of the scope in which they are placed. They always change the scope of the next parent scope.

The scope is enabled by adding the "Freemius Scope" block to the content.
<img width="2439" height="609" alt="modifiers" src="https://github.com/user-attachments/assets/2f9441a1-4fa4-4285-a5e7-8e1f025dfe50" />

You can click on the modifier directly in the editor to change the scope.

https://github.com/user-attachments/assets/6a25e2cb-c169-4d2d-898c-d6a48f90e0c6



