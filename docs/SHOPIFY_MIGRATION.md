# Shopify Migration Guide

This guide covers migrating product data from the local database to Shopify using the automated migration system.

## 🚀 Quick Start

### Prerequisites
- **Shopify Admin API Access**: Custom app with product write permissions
- **Environment Variables**: Shopify credentials configured
- **Local Data**: Products imported into local database
- **Development Environment**: Docker setup running

### Basic Migration

```bash
# Check current status
npm run shopify:status

# Validate data before migration
npm run shopify:validate

# Dry run migration (no changes to Shopify)
npm run shopify:migrate:dry-run

# Start actual migration
npm run shopify:migrate
```

## 📋 Migration Process Overview

### Architecture
```
Local Database → Data Transform → Shopify API → Validation → Local Sync Update
     ↓              ↓              ↓           ↓           ↓
  Products        Mapping      Bulk Ops   Verification  Tracking
  Variants        Validation   Rate Limit  Rollback     Logging
  Media           Optimization  Retry      Recovery     Monitoring
```

### Migration Phases
1. **Preparation**: Data analysis and validation
2. **Products**: Core product data migration
3. **Variants**: Product variant creation
4. **Images**: Media asset processing and upload
5. **Validation**: Cross-system verification

## 🔧 Configuration

### Environment Variables
```bash
# Required for migration
SHOPIFY_SHOP_DOMAIN="your-store.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_your-admin-access-token"

# Optional
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"
```

### Migration Configuration
The migration system supports extensive configuration options:

```bash
# Batch processing
--batch-size 10              # Products per batch (default: 10)
--max-retries 3              # Retry attempts (default: 3)

# Content control
--skip-images                # Skip image migration
--skip-pdfs                  # Skip PDF migration
--include-types "Hardware"   # Only migrate specific product types
--exclude-types "Draft"      # Exclude specific product types

# Migration control
--dry-run                    # Test run without changes
--validate-only              # Only validate data
--resume-from PRODUCT_ID     # Resume from specific product
```

## 📊 Data Mapping

### Product Mapping
```typescript
Local Product → Shopify Product
├── title → title
├── description → description  
├── vendor → vendor
├── categoryName → product_type
├── tags → tags (enhanced with specifications)
├── status → status
└── handle → handle (auto-generated if missing)
```

### Variant Mapping
```typescript
Local Variant → Shopify Variant
├── title → title
├── price → price
├── sku → sku
├── inventoryQty → inventory_quantity
├── compareAtPrice → compare_at_price
├── weight → weight
└── weightUnit → weight_unit
```

### Image Processing
- **Optimization**: Sharp.js for size and quality
- **Format**: JPEG with progressive loading
- **Dimensions**: Max 2048x2048 pixels
- **Quality**: 90% compression
- **Position**: Ordered by local image sequence

## 🎛️ Command Reference

### Migration Commands

```bash
# Start migration
npm run shopify:migrate [options]

# Available options:
  --dry-run                   # Test without making changes
  --batch-size <number>       # Products per batch (default: 10)
  --max-retries <number>      # Max retry attempts (default: 3)
  --skip-images              # Skip image migration
  --skip-pdfs                # Skip PDF migration
  --include-types <types>    # Comma-separated product types to include
  --exclude-types <types>    # Comma-separated product types to exclude
  --resume-from <productId>  # Resume from specific product
  --validate-only            # Only validate, don't migrate
```

### Status and Monitoring

```bash
# Check migration status
npm run shopify:status

# Validate product data
npm run shopify:validate [--product-id ID] [--sample-size 50]

# Generate migration report
npm run shopify:report [--days 7] [--output report.json]

# Test migration with sample
npm run shopify:test
```

## 📈 Monitoring and Progress

### Real-time Progress
The migration provides real-time updates:

```
🚀 Migration started
📊 Total products: 947
🖼️  Total images: 12,071

📁 Starting phase: preparation
✅ Completed phase: preparation

📁 Starting phase: products
✅ Product PRD_001: success
❌ Product PRD_002: failed - Invalid SKU format
⏭️  Product PRD_003: skipped - Already migrated
📈 Progress - Products: 3/947, Images: 0/12,071
```

### Status Dashboard
```bash
npm run shopify:status
```

Output:
```
📈 Migration Status:
════════════════════════════════════════
📦 Total products: 947
✅ Synced products: 245
⏳ Pending products: 702
📊 Progress: 25.9%

📝 Recent sync activity:
✅ CREATE - Product ABC123 (2025-08-01 14:30:22)
❌ CREATE - Product DEF456 (2025-08-01 14:29:45)
```

## 🚨 Error Handling

### Common Errors and Solutions

**API Rate Limiting**
```
Error: Shopify API rate limit exceeded
Solution: Migration automatically handles rate limiting with exponential backoff
```

**Invalid Product Data**
```
Error: Product title is required
Solution: Fix data in local database and resume migration
```

**Image Processing Failed**
```
Error: Unable to process image: /path/to/image.jpg
Solution: Check image file exists and is valid format (JPEG, PNG, GIF)
```

**SKU Conflicts**
```
Error: SKU already exists in Shopify
Solution: Update local SKU or remove duplicate from Shopify
```

### Error Recovery

The migration system provides robust error recovery:

- **Automatic Retry**: Failed operations retry with exponential backoff
- **Resume Capability**: Migration can resume from any point
- **Rollback Support**: Failed migrations can be cleaned up
- **Detailed Logging**: All errors logged with context

```bash
# Resume failed migration
npm run shopify:migrate --resume-from LAST_SUCCESSFUL_PRODUCT_ID

# Check specific product errors
npm run shopify:validate --product-id PRODUCT_ID
```

## 🔍 Validation and Testing

### Pre-migration Validation
```bash
# Validate all products
npm run shopify:validate

# Validate specific product
npm run shopify:validate --product-id abc123

# Sample validation (50 products)
npm run shopify:validate --sample-size 50
```

### Test Migration
```bash
# Dry run with sample data
npm run shopify:test

# Full dry run
npm run shopify:migrate:dry-run
```

### Post-migration Verification
The migration automatically validates:
- Product creation success
- Variant count matching
- Image upload success
- Data integrity between systems

## 📊 Performance Optimization

### Batch Processing
- **Default Batch Size**: 10 products
- **Recommended Range**: 5-20 products
- **Large Products**: Use smaller batches (5-10)
- **Simple Products**: Use larger batches (15-20)

### Parallel Processing
- **Image Processing**: Up to 5 concurrent image optimizations
- **API Calls**: Rate limit compliant (2 requests/second)
- **Memory Management**: Automatic cleanup of temporary files

### Optimization Tips
```bash
# For fast networks and simple products
npm run shopify:migrate --batch-size 20 --max-concurrency 5

# For slower networks or complex products
npm run shopify:migrate --batch-size 5 --max-concurrency 2

# Skip images for faster product migration
npm run shopify:migrate --skip-images
```

## 🔐 Security Considerations

### API Credentials
- **Secure Storage**: Use environment variables or secret management
- **Minimal Permissions**: Grant only required Shopify permissions
- **Token Rotation**: Regularly rotate access tokens

### Data Privacy
- **Local Data**: Remains in local database
- **Migration Logs**: Contain no sensitive customer data
- **Temporary Files**: Automatically cleaned up

## 📚 Advanced Usage

### Selective Migration
```bash
# Migrate only hardware products
npm run shopify:migrate --include-types "Hardware,Tools"

# Exclude draft products
npm run shopify:migrate --exclude-types "Draft,Discontinued"

# Resume from specific product
npm run shopify:migrate --resume-from cljx8r2p40001xyz123
```

### Integration with CI/CD
```yaml
# Example GitHub Actions workflow
- name: Migrate to Shopify Staging
  run: npm run shopify:migrate --dry-run
  env:
    SHOPIFY_SHOP_DOMAIN: ${{ secrets.SHOPIFY_STAGING_DOMAIN }}
    SHOPIFY_ADMIN_ACCESS_TOKEN: ${{ secrets.SHOPIFY_STAGING_TOKEN }}
```

### Custom Configuration
```typescript
// scripts/custom-migration.ts
import { MigrationEngine, MigrationConfig } from '@izerwaren/shopify-integration';

const customConfig: MigrationConfig = {
  batchSize: 15,
  maxRetries: 5,
  skipImages: false,
  includeProductTypes: ['Hardware'],
  // ... other options
};
```

## 🆘 Troubleshooting

### Migration Stuck
```bash
# Check current status
npm run shopify:status

# Generate detailed report
npm run shopify:report --days 1

# Stop and restart migration
# Stop current migration (Ctrl+C)
npm run shopify:migrate --resume-from LAST_PRODUCT_ID
```

### Memory Issues
```bash
# Reduce batch size
npm run shopify:migrate --batch-size 5

# Skip images temporarily
npm run shopify:migrate --skip-images
```

### API Connection Issues
```bash
# Verify credentials
echo $SHOPIFY_SHOP_DOMAIN
echo $SHOPIFY_ADMIN_ACCESS_TOKEN

# Test connection
npm run shopify:validate --sample-size 1
```

## 📞 Support

### Logs and Debugging
- **Application Logs**: Check console output during migration
- **Database Logs**: ProductSyncLog table contains detailed operation history
- **Error Reports**: Generated automatically for failed operations

### Getting Help
- **Documentation**: This guide and inline help (`--help`)
- **Status Check**: `npm run shopify:status` for current state
- **Validation**: `npm run shopify:validate` for data issues
- **Reports**: `npm run shopify:report` for historical analysis

---

## 🎯 Migration Checklist

### Pre-Migration
- [ ] Shopify Admin API credentials configured
- [ ] Local database populated with product data
- [ ] Environment variables set correctly
- [ ] Validation passes for sample products
- [ ] Backup of current Shopify data (if any)

### During Migration
- [ ] Monitor progress with status checks
- [ ] Watch for error patterns in logs
- [ ] Verify sample products in Shopify admin
- [ ] Check API rate limit compliance

### Post-Migration
- [ ] Run final validation
- [ ] Generate migration report
- [ ] Verify product data in Shopify admin
- [ ] Test frontend integration
- [ ] Update local database sync status

---

**Ready to migrate your 947 products and 12,071 images to Shopify!** 🚀