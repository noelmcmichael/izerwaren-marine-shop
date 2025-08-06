# Shopify API Setup Guide

This guide will help you configure the Shopify API credentials needed to
complete the integration for your Izerwaren marine hardware store.

## Current Status

✅ **Products Synced**: 947 products (100% complete) ✅ **Images Synced**:
12,071 images (100% complete)  
✅ **Shopify Packages**: All necessary Shopify integration packages are
installed ✅ **Store Domain**: `izerw-marine.myshopify.com` is configured ⚠️
**Missing**: Valid Storefront API token and webhook secret

## Required API Credentials

### 1. Shopify Admin API Access Token ✅ (Appears configured)

**Current value**: `[CONFIGURED_IN_SECRET_MANAGER]` **Purpose**: Backend
operations (inventory management, order processing, webhooks) **Status**: ✅
Appears to be a valid token

### 2. Shopify Storefront API Access Token ❌ (Needs configuration)

**Current value**: `dev-storefront-token` (placeholder) **Purpose**: Frontend
catalog browsing and checkout **Status**: ❌ Needs real token

### 3. Webhook Secret ❌ (Needs configuration)

**Current value**: `dev-webhook-secret` (placeholder) **Purpose**: Secure
webhook verification **Status**: ❌ Needs real secret

## How to Get Missing Credentials

### Step 1: Access Your Shopify Admin

1. Go to `https://izerw-marine.myshopify.com/admin`
2. Log in with your Shopify admin credentials

### Step 2: Create Storefront API Access Token

1. In Shopify Admin, go to **Settings** → **Apps and sales channels**
2. Click **Develop apps** (or **Private apps** in older versions)
3. Click **Create an app** or find existing app
4. Click **API credentials** tab
5. Under **Storefront API**, click **Configure**
6. Enable the following permissions:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collections`
   - ✅ `unauthenticated_read_checkouts`
   - ✅ `unauthenticated_write_checkouts`
7. Click **Save**
8. Copy the **Storefront access token**

### Step 3: Create Webhook Secret

1. In Shopify Admin, go to **Settings** → **Notifications**
2. Scroll down to **Webhooks** section
3. Click **Create webhook**
4. Set **Event**: `Product creation`, `Product update`,
   `Inventory level update`, `Order creation`
5. Set **URL**: `https://your-domain.com/api/v1/sync/webhooks/products/update`
6. Set **Format**: `JSON`
7. Copy the webhook secret that's generated

### Step 4: Update Environment Variables

Once you have the credentials, update your `.env` file:

```bash
# Shopify Storefront API (Public)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="izerw-marine.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-actual-storefront-token"

# Shopify Admin API (Server-side)
SHOPIFY_SHOP_DOMAIN="izerw-marine.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_your_admin_access_token"
SHOPIFY_WEBHOOK_SECRET="your-actual-webhook-secret"
```

## Verification Steps

After updating the credentials, we can test the integration:

### Test 1: Admin API Connection

```bash
curl -X GET "http://localhost:3001/api/v1/sync/shopify/connection"
```

### Test 2: Storefront API Access

The frontend catalog should be able to fetch real-time inventory and enable
checkout.

### Test 3: Webhook Endpoint

```bash
curl -X GET "http://localhost:3001/api/v1/sync/webhooks"
```

## Security Notes

- ⚠️ **Never commit real API tokens to git**
- ✅ The `.env` file is already in `.gitignore`
- ✅ Use environment-specific tokens (dev/staging/production)
- ✅ Rotate tokens regularly for security

## Next Steps After Configuration

Once credentials are configured, we'll implement:

1. **Shopping Cart Integration** - Add to cart functionality
2. **Shopify Checkout** - Seamless handoff to Shopify's checkout
3. **Real-time Inventory** - Live stock level updates
4. **Order Management** - Sync orders between systems
5. **Webhook Processing** - Real-time data synchronization

## Troubleshooting

**If Admin API token doesn't work:**

- Check token permissions include: `read_products`, `write_products`,
  `read_inventory`, `write_inventory`
- Verify token format starts with `shpat_`

**If Storefront API token doesn't work:**

- Ensure app is published to your store
- Check storefront permissions are enabled
- Verify token format (usually shorter than admin tokens)

**If webhooks don't trigger:**

- Ensure webhook URL is publicly accessible
- Check webhook secret matches exactly
- Verify SSL certificate if using HTTPS
