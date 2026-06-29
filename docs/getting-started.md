# Getting started

## Installation

1. Install the plugin via the WordPress admin panel (Plugins → Add New, or upload the zip).
2. Activate the plugin.
3. Open **Settings → Freemius** and add your product under **Products** (Product ID and Token from the [Freemius Developer Dashboard](https://dashboard.freemius.com/)).
4. Under **Editor Settings**, set site-wide defaults such as Product ID and Plan.

See [Settings](settings.md) for the full admin screen.

## First checkout button

1. Edit a page or post.
2. Add a **Button** block.
3. In the block sidebar, open **Freemius** and enable **Freemius Checkout**.
4. Use **Preview** in the sidebar to test checkout before publishing.

Details: [Freemius Button](button.md).

## Pricing page

1. Create a new page and add a **Group** block (or **Section**) as an outer scope — enable **Freemius** and set your **Product ID**.
2. Inside the outer scope, add **Freemius Scope** modifiers for currency, billing cycle, and licenses.
3. Add one **Column** per plan; enable **Freemius** on each column, set **Plan ID**, and map fields such as **Price**, **Title**, and **Description**.
4. Add a **Button** with **Freemius Checkout** in each column, then use **Preview** before publishing.

Details: [Creating your Pricing page](creating-your-pricing-page.md).
