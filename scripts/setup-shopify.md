# Shopify Development Store Setup

## 1. Create Shopify Partner Account

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Sign up for a free Partner account
3. Verify your email and complete profile

## 2. Create Development Store

1. In Partner Dashboard, click "Stores" in sidebar
2. Click "Add store" → "Development store"
3. Store details:
   - Store name: `izerwaren-dev` (or your preference)
   - Purpose: "Testing new app or theme"
   - Store type: Choose appropriate option
4. Click "Save"
5. Wait for store creation

## 3. Configure Store Settings

1. Click "Log in to store" to access admin
2. Go to Settings → General
3. Set appropriate store details (optional for development)
4. Note your store domain: `your-store-name.myshopify.com`

## 4. Create Private App (for API access)

1. In Shopify Admin, go to Apps → "App and sales channel settings"
2. Click "Develop apps for your store"
3. Click "Allow custom app development"
4. Click "Create an app"
5. App name: `Izerwaren API Client`
6. Click "Create app"

## 5. Configure App Scopes

1. Click "Configuration" tab
2. In "Admin API access scopes", enable:
   - `read_products`
   - `write_products`
   - `read_customers`
   - `write_customers`
   - `read_orders`
   - `write_orders`
   - `read_inventory`
   - `write_inventory`
3. In "Storefront API access scopes", enable:
   - `unauthenticated_read_products`
   - `unauthenticated_read_product_listings`
4. Click "Save"

## 6. Generate API Tokens

1. Click "API credentials" tab
2. Click "Install app"
3. Click "Install" to confirm
4. Copy these values:
   - **Admin API access token** (starts with `shpat_`)
   - **Storefront access token** (for public API)

## 7. Optional: Add Sample Products

1. Go to Products → "Add product"
2. Create 2-3 test products for sync testing
3. Set prices, SKUs, and inventory

## Ready for Configuration

Once you have:

- Store domain (e.g., `my-store.myshopify.com`)
- Admin API token (starts with `shpat_`)
- Storefront API token

You're ready to configure the application!
