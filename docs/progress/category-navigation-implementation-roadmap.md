# Category Navigation Implementation Roadmap

## **Objective**

Implement owner's 17-category navigation structure to replace inconsistent
database categories, enabling intuitive category-based product browsing for B2B
customers.

## **Acceptance Criteria**

- [ ] Category dropdown/navigation displays 17 owner-defined categories
- [ ] Category selection filters products in ProductSearchModal
- [ ] All 9 mapped categories (436 products) work immediately
- [ ] 8 unmapped categories researched and implemented
- [ ] Product counts displayed per category
- [ ] Integration with existing bulk ordering interface
- [ ] Performance maintained (<2s category switching)

## **Risk Assessment**

### **🔴 High Risk**

- **Category Research Gap**: 8/17 categories (511 products) need mapping
  research
- **Data Inconsistency**: Database categories don't align with owner intent
- **Performance**: Category filtering might slow with 947 products

### **🟡 Medium Risk**

- **UX Confusion**: Users might expect different category organization
- **Maintenance Overhead**: Category mappings need ongoing updates

### **🟢 Low Risk**

- **Technical Implementation**: Standard filtering patterns
- **API Integration**: Products API already functional

## **Implementation Strategy Analysis**

### **Option 1: Category Mapping Service** ⭐ **RECOMMENDED**

**Why This Approach:**

1. **Fastest Time to Value**: Can implement 9 categories immediately (436
   products)
2. **No Database Changes**: Uses existing schema, minimizes risk
3. **Iterative Enhancement**: Add remaining categories as mapped
4. **Rollback Friendly**: Easy to revert if issues arise
5. **Owner Experience Priority**: Delivers intended UX immediately

**Implementation:**

```typescript
interface CategoryMapping {
  ownerCategory: string;
  dbCategories: string[];
  productCount: number;
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    ownerCategory: 'MARINE LOCKS',
    dbCategories: [
      '25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors',
      '40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B',
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      '65 backset mm Marine Grade Mortise Locks for full Size Doors',
    ],
    productCount: 147,
  },
  // ... 8 more mapped categories
];
```

### **Option 2: Database Schema Enhancement**

**Why Not Now:**

- Requires extensive data migration
- High risk for production system
- Longer implementation timeline
- Harder to iterate and adjust

### **Option 3: Hierarchical Filter Interface**

**Why Later:**

- Adds UI complexity before core functionality proven
- Owner's 17 categories already well-organized
- Can enhance after basic implementation working

## **Test Hooks**

### **Unit Tests**

```typescript
// Category mapping service tests
describe('CategoryMappingService', () => {
  test('maps database categories to owner categories', () => {
    const result = categoryService.mapDbCategoryToOwner(
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks'
    );
    expect(result).toBe('MARINE LOCKS');
  });

  test('returns product count for mapped categories', () => {
    const count = categoryService.getProductCount('MARINE LOCKS');
    expect(count).toBe(147);
  });
});
```

### **Integration Tests**

```typescript
// Category filtering API tests
describe('Products API with Category Filtering', () => {
  test('filters products by owner category', async () => {
    const response = await request(app)
      .get('/api/v1/products?ownerCategory=MARINE LOCKS')
      .expect(200);

    expect(response.body.data).toHaveLength(147);
  });
});
```

### **E2E Tests**

```typescript
// Category navigation user flow
test('user can browse products by category', async ({ page }) => {
  await page.goto('/bulk-order');
  await page.click('[data-testid="category-dropdown"]');
  await page.click('[data-testid="category-marine-locks"]');
  await expect(page.locator('[data-testid="product-count"]')).toContainText(
    '147 products'
  );
});
```

## **Implementation Plan**

### **Phase 1: Core Category Service (Day 1)** 🎯

**Goal**: Get 9 mapped categories working immediately

1. **Create Category Mapping Service**

   ```typescript
   // apps/shared/src/services/categoryMappingService.ts
   export class CategoryMappingService {
     private mappings = CATEGORY_MAPPINGS;

     mapDbCategoryToOwner(dbCategory: string): string | null;
     getOwnerCategories(): string[];
     getProductCountByOwnerCategory(ownerCategory: string): number;
     getDbCategoriesForOwner(ownerCategory: string): string[];
   }
   ```

2. **Update Products API**

   ```typescript
   // Add ownerCategory filter to /api/v1/products
   GET /api/v1/products?ownerCategory=MARINE LOCKS
   ```

3. **Update ProductSearchModal**
   - Add category dropdown above search input
   - Display 9 mapped categories with product counts
   - Filter products when category selected

### **Phase 2: Category Research (Day 2-3)** 🔍

**Goal**: Map remaining 8 categories to complete 17-category structure

1. **Research Unmapped Categories**
   - MARINE LEVERS, ESCUTCHEONS & ROSES
   - CABINET HARDWARE, LOCKERS AND DECK BOXES
   - HATCH AND DECK HARDWARE
   - FIRE FIGHTING AND HOSE DOWN EQUIPMENT
   - DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES
   - TUBULAR LOCK SYSTEMS
   - PULLS / GRABRAILS / HOOKS / BRACKETS (partial)
   - FLUSH BOLTS, EDGE BOLTS (partial)

2. **Database Category Analysis**

   ```sql
   -- Find potential matches for unmapped categories
   SELECT category_name, COUNT(*) as product_count
   FROM products
   WHERE category_name NOT IN (/* already mapped categories */)
   GROUP BY category_name
   ORDER BY product_count DESC;
   ```

3. **Update Category Mappings**
   - Add new category mappings as discovered
   - Test with real product data
   - Validate product counts match expectations

### **Phase 3: Enhanced Navigation (Day 4-5)** ✨

**Goal**: Polish UX and add advanced features

1. **Enhanced Category UI**
   - Product count badges per category
   - Search within category results
   - Category + search term combination
   - Loading states and error handling

2. **Performance Optimization**
   - Category-specific API endpoints
   - Product pagination within categories
   - Debounced search within categories

3. **Analytics & Monitoring**
   - Track category usage patterns
   - Monitor API performance by category
   - Log unmapped products for future investigation

## **Technical Architecture**

### **Backend Changes**

```typescript
// apps/backend/src/services/CategoryMappingService.ts
// apps/backend/src/routes/products.ts - Add ownerCategory filter
// apps/backend/src/controllers/ProductController.ts - Category filtering logic
```

### **Frontend Changes**

```typescript
// apps/frontend/src/services/categoryService.ts
// apps/frontend/src/components/b2b/cart/ProductSearchModal.tsx - Category dropdown
// apps/frontend/src/components/shared/CategoryDropdown.tsx - New component
```

### **Shared Services**

```typescript
// apps/shared/src/types/Category.ts - Category type definitions
// apps/shared/src/constants/categoryMappings.ts - Category mapping data
```

## **Migration Path to Database Schema (Future)**

Once category mapping service is proven and stable:

1. **Add owner_category column to products table**
2. **Populate using mapping service logic**
3. **Update API to use database column instead of mapping service**
4. **Remove mapping service complexity**

This provides a clear upgrade path without immediate database risks.

## **Success Metrics**

### **Immediate (Phase 1)**

- 9 categories available with 436 products
- Category filtering functional in ProductSearchModal
- <2 second category switching performance

### **Short Term (Phase 2-3)**

- All 17 categories mapped and functional
- > 90% of products categorized appropriately
- Category navigation increases product discovery

### **Long Term**

- Database schema migrated to use owner categories
- Category-based product recommendations
- Advanced filtering within categories

## **Next Actions**

1. **Implement Phase 1** - Start with Category Mapping Service
2. **Validate with stakeholders** - Test 9-category navigation with owner
3. **Research Phase 2** - Map remaining 8 categories systematically
4. **Enhance incrementally** - Add UX polish and performance optimizations

**This approach balances immediate value delivery with systematic risk
management while moving toward the owner's intended user experience.**
