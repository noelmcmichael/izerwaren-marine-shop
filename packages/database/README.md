# Database Package - B2B Supplements E-commerce

Enterprise-grade PostgreSQL database with Prisma ORM for B2B supplements e-commerce platform.

## 🏗️ Database Overview

- **Database Engine**: PostgreSQL 14+
- **ORM**: Prisma 5.22.0
- **Models**: 29 core models
- **Performance**: 59 strategic indexes
- **Data Volume**: 947+ products, 24,291+ technical specifications

## 📁 Package Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma           # Primary schema definition
│   ├── schema-enhanced.prisma  # Enhanced version with new features
│   ├── seed.ts                 # Original seed script
│   └── seed-b2b-scenarios.ts   # B2B testing scenarios
├── migrations/
│   ├── 001_initial_schema.sql  # Complete schema deployment
│   ├── performance-optimizations.sql
│   └── data-constraints.sql
├── scripts/
│   ├── migration-manager.js     # Migration management tool
│   ├── test-schema-enhancements.js
│   └── validate-final-setup.js
├── docs/
│   └── DATABASE_SCHEMA_DOCUMENTATION.md
└── src/
    └── index.ts                 # Database utilities
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"

# Or create .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"' > .env
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Deploy schema and optimizations
npm run setup:full

# Generate Prisma client
npm run generate

# Seed with B2B test data
npm run seed:b2b
```

### 3. Development Commands

```bash
# Database management
npm run migrate        # Apply migrations
npm run push          # Push schema changes
npm run studio        # Open Prisma Studio
npm run validate      # Validate setup

# Data operations
npm run seed          # Run basic seed
npm run seed:b2b      # Run B2B scenarios
npm run reset         # Reset and reseed
```

## 🏛️ Schema Architecture

### Core Business Models

#### 1. Account Management
- **Account**: Unified account model (Dealers, Pros, Account Reps)
- **Dealer**: Legacy model for backward compatibility
- **AccountShopifyCustomer**: Shopify integration junction table

#### 2. Product Catalog
- **Product**: Core product information with variant support
- **ProductVariant**: Shopify variant shadows
- **CatalogProductVariant**: Local variant configurations
- **TechnicalSpecification**: Searchable product attributes
- **ProductImage**: Media asset management

#### 3. B2B Pricing
- **AccountPricing**: Customer-specific pricing rules
- **VolumeDiscount**: Quantity-based automatic discounts
- **DealerPricing**: Legacy pricing (backward compatibility)

#### 4. Quote Management
- **RfqRequest**: Request for Quote workflows
- **RfqItem**: Individual quote line items

#### 5. Shopping Experience
- **CartItem**: Current cart persistence
- **SavedCart**: Named cart collections
- **SavedCartItem**: Saved cart contents

### Business Logic Support

- **Multi-tier Accounts**: STANDARD, PREMIUM, ENTERPRISE
- **Account Types**: DEALER, PRO, ACCOUNT_REP
- **Product Types**: SIMPLE (884 products), VARIABLE (63 products)
- **RFQ Workflow**: PENDING → IN_REVIEW → QUOTED → ACCEPTED
- **Territory Management**: Geographic account rep assignment

## ⚡ Performance Optimizations

### Strategic Indexes

```sql
-- Product catalog browsing (< 100ms)
CREATE INDEX idx_products_catalog_browsing 
ON products (status, product_type, category_name, created_at DESC)
WHERE status = 'active';

-- Account pricing lookups (< 50ms)
CREATE INDEX idx_account_pricing_active_lookup 
ON account_pricing (account_id, shopify_product_id, is_active, effective_from DESC) 
WHERE is_active = true;

-- Full-text product search
CREATE INDEX idx_products_fulltext_search 
ON products USING GIN(to_tsvector('english', title || ' ' || description));
```

### Performance Targets
- **Product Search**: < 100ms
- **Pricing Calculation**: < 50ms per product
- **Account Authentication**: < 25ms
- **RFQ Operations**: < 200ms

## 🔒 Data Integrity

### Business Rule Constraints

```sql
-- Pricing validation
ALTER TABLE account_pricing 
ADD CONSTRAINT valid_markdown_percent 
CHECK (markdown_percent >= 0 AND markdown_percent <= 100);

-- Quantity validation
ALTER TABLE rfq_items 
ADD CONSTRAINT positive_quantity 
CHECK (quantity > 0);

-- Date logic
ALTER TABLE account_pricing 
ADD CONSTRAINT valid_effective_dates 
CHECK (effective_until IS NULL OR effective_until > effective_from);
```

## 🛠️ Development Tools

### Migration Manager

```bash
# Full database setup
node scripts/migration-manager.js full-setup

# Check status
node scripts/migration-manager.js status

# Apply specific components
node scripts/migration-manager.js optimize
node scripts/migration-manager.js constraints
```

### Validation Tools

```bash
# Comprehensive validation
node scripts/validate-final-setup.js

# Schema enhancement testing
node scripts/test-schema-enhancements.js
```

## 🧪 Testing & Development

### B2B Test Scenarios

The `seed-b2b-scenarios.ts` script creates comprehensive test data:

- **5 Test Accounts**: Enterprise, Premium, Standard dealers + Pro + Account Rep
- **Pricing Rules**: Tier-based and account-specific pricing
- **RFQ Workflows**: Pending and quoted scenarios
- **Cart Persistence**: Current and saved cart scenarios
- **Volume Discounts**: Quantity-based pricing tiers

### Test Data Overview

```typescript
// Enterprise Dealer (25% markdown)
const enterpriseAccount = {
  accountType: 'DEALER',
  tier: 'ENTERPRISE',
  companyName: 'MegaCorp Industrial Solutions'
};

// RFQ Scenario
const testRfq = {
  requestNumber: 'RFQ-TEST-001',
  status: 'PENDING',
  priority: 'HIGH',
  items: [
    { quantity: 100, notes: 'Bulk order for new facility' }
  ]
};
```

## 🔗 API Integration

### Prisma Client Usage

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Product search with performance
const products = await prisma.product.findMany({
  where: { 
    status: 'active',
    title: { contains: searchTerm, mode: 'insensitive' }
  },
  include: {
    technicalSpecs: { where: { isSearchable: true } },
    images: { where: { fileExists: true } }
  },
  take: 20
});

// Account-specific pricing
const pricing = await prisma.accountPricing.findFirst({
  where: {
    accountId: customerId,
    shopifyProductId: productId,
    isActive: true,
    effectiveFrom: { lte: new Date() },
    OR: [
      { effectiveUntil: null },
      { effectiveUntil: { gte: new Date() } }
    ]
  }
});
```

### Error Handling

```typescript
try {
  await prisma.accountPricing.create(data);
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new Error('Pricing rule already exists');
  }
  if (error.message.includes('check constraint')) {
    // Business rule violation
    throw new Error('Invalid pricing data');
  }
}
```

## 📊 Monitoring & Maintenance

### Database Health Checks

```sql
-- Index usage monitoring
SELECT 
  schemaname, tablename, indexname,
  idx_scan, seq_scan,
  ROUND(idx_scan::numeric / GREATEST(seq_scan + idx_scan, 1) * 100, 2) AS index_usage_pct
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY index_usage_pct DESC;

-- Table statistics
SELECT 
  schemaname, tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public';
```

### Performance Views

The migration scripts create monitoring views:

- `v_performance_monitoring`: Query statistics and table health
- `v_index_usage`: Index utilization tracking

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Migrations applied
- [ ] Performance optimizations deployed
- [ ] Data constraints validated
- [ ] Backup strategy implemented

### Deployment Commands

```bash
# Production migration
npx prisma migrate deploy

# Validate production setup
node scripts/validate-final-setup.js

# Monitor performance
npx prisma studio
```

## 📚 Documentation

- **[Complete Schema Documentation](./docs/DATABASE_SCHEMA_DOCUMENTATION.md)**: Comprehensive model reference
- **[Prisma Schema](./prisma/schema.prisma)**: Source of truth for data models
- **[Migration Scripts](./migrations/)**: Database deployment and optimization

## 🤝 Contributing

### Schema Changes

1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name descriptive_name`
3. Update documentation
4. Test with validation scripts
5. Update seed data if needed

### Performance Optimization

1. Identify slow queries with monitoring views
2. Add strategic indexes in `migrations/performance-optimizations.sql`
3. Test performance impact
4. Update documentation

---

**Database Schema Version**: 1.0  
**Last Updated**: 2025-01-30  
**Production Ready**: ✅  

For questions or support, contact the development team or refer to the comprehensive schema documentation.