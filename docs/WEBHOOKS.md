# Shopify Webhook Integration

This document describes the webhook infrastructure for real-time synchronization between Shopify and the local B2B database.

## Overview

The webhook system enables real-time data synchronization by receiving notifications from Shopify when products, inventory, or orders change. This ensures the local database stays current without requiring frequent polling.

## Webhook Endpoints

All webhook endpoints are available at `/api/v1/webhooks/` and require proper HMAC-SHA256 signature validation.

### Product Webhooks

#### `POST /api/v1/webhooks/shopify/products/create`
- **Purpose**: Handle new product creation in Shopify
- **Trigger**: When a product is created in Shopify Admin
- **Action**: Creates corresponding product record in local database with variants and images

#### `POST /api/v1/webhooks/shopify/products/update`
- **Purpose**: Handle product updates in Shopify
- **Trigger**: When product details are modified in Shopify Admin
- **Action**: Updates local product record, variants, and images

#### `POST /api/v1/webhooks/shopify/products/delete`
- **Purpose**: Handle product deletion in Shopify
- **Trigger**: When a product is deleted in Shopify Admin
- **Action**: Soft deletes local product (marks as archived, unlinks from Shopify)

### Inventory Webhooks

#### `POST /api/v1/webhooks/shopify/inventory_levels/update`
- **Purpose**: Handle inventory level changes
- **Trigger**: When product inventory quantities change
- **Action**: Updates local variant inventory quantities

### Order Webhooks

#### `POST /api/v1/webhooks/shopify/orders/create`
- **Purpose**: Handle new order creation
- **Trigger**: When a new order is placed
- **Action**: Creates local order record for tracking and analytics

#### `POST /api/v1/webhooks/shopify/orders/updated`
- **Purpose**: Handle order status changes
- **Trigger**: When order status changes (payment, fulfillment, etc.)
- **Action**: Updates local order record

### Health Check

#### `GET /api/v1/webhooks/health`
- **Purpose**: Verify webhook system health
- **Response**: System status and configuration information

## Security

### HMAC Signature Validation

All webhook requests are validated using HMAC-SHA256 signatures:

1. **Signature Header**: `X-Shopify-Hmac-Sha256`
2. **Secret**: Configured via `SHOPIFY_WEBHOOK_SECRET` environment variable
3. **Validation**: Timing-safe comparison of calculated vs. received signature

### Additional Security Measures

- **Shop Domain Verification**: Validates `X-Shopify-Shop-Domain` header
- **Rate Limiting**: Prevents abuse (Redis-based in production)
- **Raw Body Preservation**: Maintains request integrity for signature validation
- **Error Handling**: Comprehensive logging without exposing sensitive data

## Configuration

### Environment Variables

```env
# Required
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com

# Development only
NODE_ENV=development  # Skips signature validation with dev secret
```

### Shopify Admin Setup

1. **Navigate to**: Settings → Notifications → Webhooks
2. **Create webhooks** for each endpoint:
   - **Product creation**: `https://your-domain.com/api/v1/webhooks/shopify/products/create`
   - **Product update**: `https://your-domain.com/api/v1/webhooks/shopify/products/update`
   - **Product deletion**: `https://your-domain.com/api/v1/webhooks/shopify/products/delete`
   - **Inventory update**: `https://your-domain.com/api/v1/webhooks/shopify/inventory_levels/update`
   - **Order creation**: `https://your-domain.com/api/v1/webhooks/shopify/orders/create`
   - **Order update**: `https://your-domain.com/api/v1/webhooks/shopify/orders/updated`
3. **Set format**: JSON
4. **Configure secret**: Use the same value as `SHOPIFY_WEBHOOK_SECRET`

## Database Integration

### Sync Logging

All webhook events are logged in the `ProductSyncLog` table:

```sql
INSERT INTO ProductSyncLog (
  operation,      -- e.g., 'webhook_product_create'
  status,         -- 'SUCCESS' or 'ERROR'
  productId,      -- Local product ID (if applicable)
  shopifyProductId, -- Shopify product/variant/order ID
  errorMessage,   -- Error details (if failed)
  syncedAt        -- Timestamp
)
```

### Data Mapping

#### Products
- **Shopify → Local**: Maps product fields, variants, and images
- **Status Mapping**: `active` → `active`, `archived` → `archived`, `draft` → `draft`
- **Relationships**: Maintains parent-child relationships for variants

#### Inventory
- **Real-time Updates**: Inventory changes trigger immediate local updates
- **Variant Mapping**: Links Shopify inventory items to local product variants

#### Orders
- **Order Tracking**: Creates local records for B2B analytics
- **Status Monitoring**: Tracks payment and fulfillment status changes

## Error Handling

### Retry Logic

Shopify automatically retries failed webhooks:
- **Intervals**: 1min, 5min, 10min, 15min, 30min, 1hr, 6hrs, 12hrs
- **Maximum**: 19 retry attempts over ~3 days
- **Response Codes**: 2xx = success, others trigger retry

### Dead Letter Handling

Failed webhooks after all retries:
1. **Logged**: Complete error details in `ProductSyncLog`
2. **Alerting**: Manual review required
3. **Recovery**: Manual sync available via `/api/v1/sync` endpoints

### Error Types

- **400**: Invalid payload (Zod validation failures)
- **401**: Invalid signature or shop domain
- **500**: Database or processing errors

## Testing

### Manual Testing

Use the test script to validate webhook functionality:

```bash
npm run test:webhooks
```

### Test Endpoints

The script tests:
- ✅ Health check endpoint
- ✅ Product create/update/delete workflows
- ✅ Inventory update processing
- ✅ Order create/update workflows
- ✅ Signature validation
- ✅ Error handling

### Development Testing

In development mode with placeholder webhook secret:
- **Signature validation**: Skipped for convenience
- **Logging**: Enhanced debug information
- **Error details**: Full error messages in responses

## Monitoring

### Metrics to Monitor

1. **Webhook Success Rate**: Should be >99%
2. **Processing Time**: Should be <5 seconds
3. **Error Frequency**: Monitor for spikes
4. **Sync Lag**: Time between Shopify change and local update

### Health Indicators

- **Recent Sync Activity**: Check `ProductSyncLog` for recent successful operations
- **Error Patterns**: Monitor for repeated failures
- **Configuration Status**: Verify webhook secret and domain settings

### Troubleshooting

#### Common Issues

1. **Signature Validation Failures**
   - Verify webhook secret matches Shopify configuration
   - Check that raw body is preserved for signature calculation

2. **Product Not Found Errors**
   - Normal for create operations
   - Service automatically handles create vs. update logic

3. **Database Connection Issues**
   - Check database connectivity
   - Verify Prisma schema matches database structure

4. **Timeout Errors**
   - Webhooks must respond within 5 seconds
   - Optimize database queries and processing logic

## Performance Considerations

### Optimizations

1. **Bulk Processing**: Group related operations when possible
2. **Selective Updates**: Only update changed fields
3. **Image Handling**: Defer large image processing
4. **Inventory Batching**: Collect inventory updates for batch processing

### Scaling

For high-volume stores:
1. **Queue System**: Implement Redis/Bull for webhook processing
2. **Database Indexing**: Ensure proper indexes on Shopify ID fields
3. **Connection Pooling**: Configure appropriate database connection limits
4. **Monitoring**: Implement comprehensive metrics and alerting

## Security Best Practices

1. **Webhook Secret Rotation**: Regularly update webhook secrets
2. **HTTPS Only**: Never accept webhooks over HTTP in production
3. **Request Validation**: Always validate request structure and content
4. **Rate Limiting**: Implement proper rate limiting for webhook endpoints
5. **Logging**: Log webhook events but avoid logging sensitive data
6. **Error Handling**: Don't expose internal system details in error responses

---

For more information, see:
- [Shopify Webhook Documentation](https://shopify.dev/api/admin-rest/2023-10/resources/webhook)
- [HMAC Verification Guide](https://shopify.dev/tutorials/manage-webhooks#verify-webhook)