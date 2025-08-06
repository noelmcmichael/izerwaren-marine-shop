# Product Catalog Integration Implementation Roadmap

**Objective**: Integrate comprehensive product data from the Izerwaren Revival
project into the Izerwaren 2.0 system to enable customer-facing product catalog
with account-specific pricing.

**Date**: 2025-01-27 **Estimated Duration**: 3-4 hours

---

## Acceptance Criteria

### 1. Product Data Migration ✓

- [ ] Import 947 products from Revival API into Izerwaren 2.0 database
- [ ] Migrate product specifications (341k+ entries)
- [ ] Import product images (12k+ images) to public storage
- [ ] Import PDF catalogs (377 documents) to secure storage
- [ ] Maintain data integrity and relationships

### 2. Enhanced Product Schema ✓

- [ ] Extend existing `Product` model to include Revival data fields
- [ ] Add `ProductSpecification` model for technical specifications
- [ ] Add `ProductImage` model for image management
- [ ] Add `ProductCatalog` model for PDF documentation
- [ ] Add `Category` model for product categorization

### 3. Customer-Facing Catalog ✓

- [ ] Public product browsing interface (`/catalog`)
- [ ] Category-based navigation with hierarchical structure
- [ ] Product search and filtering capabilities
- [ ] Individual product detail pages with specifications
- [ ] Account-specific pricing display (when authenticated)

### 4. Account-Specific Pricing Integration ✓

- [ ] Display customer-specific pricing based on account type
- [ ] Show tier-based discounts (Standard/Premium/Enterprise)
- [ ] Integrate with existing `AccountPricing` system
- [ ] Fallback to base pricing for unauth users

---

## Implementation Strategy

### Phase 1: Database Schema Extension (45 minutes)

#### Current vs Revival Schema Mapping:

```
Current Izerwaren 2.0          →    Revival Project Data
=====================             ===================
Product.shopifyProductId       ←    products.sku (primary key)
Product.title                  ←    products.name
Product.description           ←    products.description
Product.productType           ←    products.category_name
Product.vendor                ←    "Izerwaren" (default)
Product.handle                ←    generated from name
Product.tags                  ←    [main_category, category_name]

New Models Required:
- ProductSpecification         ←    product_specifications table
- ProductImage                ←    product_images table
- ProductCatalog              ←    product_catalogs table
- Category                    ←    categories table
```

#### Database Migration Plan:

1. **Extend Product Model**:
   - Add fields: `sku`, `retailPrice`, `partNumber`, `availability`,
     `imageCount`, `primaryImagePath`
   - Add relationships to new models
2. **Add New Models**:

   ```prisma
   model Category {
     id           String    @id @default(cuid())
     reviralId    String    @unique  // Original category ID from Revival
     name         String
     parentId     String?
     level        Int
     productCount Int       @default(0)
     products     Product[]
   }

   model ProductSpecification {
     id         String  @id @default(cuid())
     productId  String
     specType   String
     specValue  String
     specOrder  Int?
     product    Product @relation(fields: [productId], references: [id])
   }

   model ProductImage {
     id          String  @id @default(cuid())
     productId   String
     imageUrl    String?
     localPath   String?
     imageOrder  Int?
     isPrimary   Boolean @default(false)
     fileExists  Boolean @default(false)
     product     Product @relation(fields: [productId], references: [id])
   }

   model ProductCatalog {
     id            String    @id @default(cuid())
     productId     String
     pdfUrl        String
     localPdfPath  String?
     fileSize      Int?
     downloadStatus String   @default("pending")
     product       Product   @relation(fields: [productId], references: [id])
   }
   ```

### Phase 2: Data Import Service (60 minutes)

#### Import Strategy:

```
Data Source: http://localhost:8000 (Revival API)
Target: Izerwaren 2.0 PostgreSQL database
Method: Batched imports with transaction safety
```

#### Import Service Structure:

```typescript
// src/lib/import/
├── import-service.ts      // Main orchestrator
├── category-importer.ts   // Categories first (dependencies)
├── product-importer.ts    // Products second
├── spec-importer.ts       // Specifications third
├── image-importer.ts      // Images fourth (with file downloads)
├── catalog-importer.ts    // PDF catalogs last
└── types.ts              // Import data types
```

#### Batch Processing Logic:

- **Categories**: Single batch (91 records)
- **Products**: Batches of 50 (947 total = ~19 batches)
- **Specifications**: Batches of 1000 (341k total = ~341 batches)
- **Images**: Batches of 100 with file downloads (12k total = ~120 batches)
- **Catalogs**: Single batch with PDF downloads (377 records)

### Phase 3: File Storage Integration (30 minutes)

#### Asset Management Strategy:

```
Product Images:
Source: Revival project ./images/ directory
Target: /public/product-images/ (for public access)
Process: Copy files, update paths in database

PDF Catalogs:
Source: Revival project PDF URLs/local paths
Target: /storage/product-catalogs/ (private, auth-required)
Process: Download/copy PDFs, secure access control
```

#### File Transfer Plan:

1. **Image Migration**:
   - Copy from `/Users/noelmcmichael/Workspace/izerwaren_revival/images/`
   - To
     `/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/public/product-images/`
   - Update `ProductImage.localPath` to reference new location

2. **PDF Catalog Migration**:
   - Create secure storage directory
   - Implement auth-protected download endpoint
   - Update paths in `ProductCatalog` model

### Phase 4: Customer Catalog Interface (90 minutes)

#### Customer-Facing Pages:

```
/catalog                    // Main catalog browsing
/catalog/[category]         // Category listing
/catalog/[category]/[sku]   // Product detail page
/api/catalog/products       // Product search API
/api/catalog/categories     // Category tree API
/api/catalog/pricing        // Account-specific pricing API
```

#### Pricing Integration Logic:

```typescript
// Account-specific pricing hierarchy
1. AccountPricing override (if exists)
2. Tier-based discount from base price
3. Base retail price (fallback)
4. Guest pricing (limited access)
```

#### UI Components:

- **CategoryNav**: Hierarchical category browsing
- **ProductGrid**: Paginated product listing
- **ProductCard**: Product preview with pricing
- **ProductDetail**: Full product page with specs
- **SpecificationTable**: Technical specifications display
- **PricingDisplay**: Account-aware pricing component

---

## Risk Assessment & Mitigation

### High Risks:

1. **Data Volume**: 341k+ specifications could cause memory issues
   - _Mitigation_: Batched processing with transaction boundaries
2. **Image File Size**: 12k+ images may be large
   - _Mitigation_: Check available disk space, implement file size limits
3. **API Availability**: Revival API must remain accessible
   - _Mitigation_: Check API health before starting, implement retry logic

### Medium Risks:

1. **Database Constraints**: Foreign key violations during import
   - _Mitigation_: Import in dependency order (categories→products→specs)
2. **File Path Conflicts**: Image/PDF file naming collisions
   - _Mitigation_: Use UUID-based naming, check file existence

### Low Risks:

1. **Shopify Integration**: Need to map Revival SKUs to Shopify products
   - _Mitigation_: Design for manual mapping initially, auto-sync later

---

## Test Hooks

### Unit Tests:

```bash
# Import service validation
npm test -- import-service.test.ts

# Database migration verification
npm test -- schema-validation.test.ts

# API endpoint functionality
npm test -- catalog-api.test.ts
```

### Integration Tests:

```bash
# End-to-end import process
npm test -- e2e-import.test.ts

# Customer catalog browsing
npm test -- catalog-browsing.test.ts

# Account-specific pricing
npm test -- pricing-integration.test.ts
```

### Manual Verification:

1. **Data Integrity**: Compare Revival API product count with imported count
2. **Image Display**: Verify random sample of product images render correctly
3. **Pricing Logic**: Test pricing display for different account types
4. **Category Navigation**: Verify hierarchical category structure works
5. **Search Functionality**: Test product search and filtering

---

## Success Metrics

### Quantitative:

- **Data Completeness**: 100% of 947 products imported successfully
- **Image Coverage**: >95% of product images accessible and displayed
- **Specification Coverage**: 100% of specifications imported and searchable
- **Performance**: Catalog pages load within 2 seconds

### Qualitative:

- **User Experience**: Intuitive product browsing and search
- **Pricing Accuracy**: Correct account-specific pricing display
- **Visual Quality**: Product images display properly without broken links
- **Category Navigation**: Logical and discoverable product organization

---

## Post-Implementation

### Immediate Next Steps:

1. **Shopify Sync**: Map imported products to Shopify product IDs
2. **Search Enhancement**: Implement full-text search across specifications
3. **Performance Optimization**: Add caching for frequently accessed products
4. **Admin Tools**: Build admin interface for product management

### Future Enhancements:

1. **Product Recommendations**: Related/similar product suggestions
2. **Inventory Sync**: Real-time inventory status from Shopify
3. **Quote Integration**: One-click "Add to Quote" from product pages
4. **Advanced Filtering**: Specification-based product filtering

---

## Implementation Notes

### Development Environment:

- Revival API must be running on `http://localhost:8000`
- Izerwaren 2.0 dev server on `http://localhost:3000`
- PostgreSQL database accessible via `DATABASE_URL`
- Sufficient disk space for images (~500MB estimated)

### Dependencies:

- No new external dependencies required
- Utilize existing Prisma, Next.js, and React setup
- Use built-in Node.js file system operations for asset migration

### Rollback Plan:

1. Database rollback via Prisma migration down
2. Remove copied image files
3. Revert to previous schema state
4. Maintain backup of current database before starting

---

**Ready to proceed with implementation upon approval.**
