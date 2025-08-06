# Production Bugs Fix Implementation Roadmap

## **Objective**
Fix three critical production issues discovered after deploying the full Shopify product integration:
1. Product detail page 404s due to invalid SKU routing
2. Category filter showing only 2 categories instead of 17 mapped categories
3. Image 400 errors in console

## **Current Production Issues**

### Issue 1: Product Detail 404s
**Problem**: "View Details" buttons generate 404s because some products have Shopify GraphQL IDs as SKUs
- URL pattern: `/product/gid:/shopify/Product/8032459817007` (invalid)
- Expected: `/product/valid-sku-string`

### Issue 2: Missing Category Filters  
**Problem**: Category dropdown only shows "Variant Products" and "PDF Specifications"
- Expected: 17 mapped owner categories from `categoryMappingService`
- Current: Using old Shopify `fetchAll(250)` in categories API

### Issue 3: Image 400 Errors
**Problem**: Console shows `image:1 Failed to load resource: the server responded with a status of 400 ()`
- Impact: Missing/broken product images
- Need to investigate image URL generation

## **Root Cause Analysis**

### SKU Routing Issue
- GraphQL products have Shopify GIDs as IDs, not user-friendly SKUs
- Frontend expects readable SKU strings for URLs
- Need URL-safe routing approach

### Category API Issue
- `/api/products/categories/route.ts` still uses old Shopify-only approach
- Doesn't integrate with `categoryMappingService` from previous implementation
- Missing owner category mapping logic

### Image URL Issue
- Likely related to Shopify CDN URLs vs local image paths
- Need to verify `getImageUrl()` function with GraphQL product structure

## **Acceptance Criteria**

### ✅ Product Detail Navigation
- [ ] "View Details" buttons navigate successfully to product pages
- [ ] Product URLs are clean and user-friendly
- [ ] All 952 products are accessible via direct URLs
- [ ] No more 404 errors in console for product routes

### ✅ Category Filtering
- [ ] Category dropdown shows all 17 owner categories
- [ ] Each category displays correct product count
- [ ] Category filtering works for all mapped categories
- [ ] No more "Variant Products" / "PDF Specifications" placeholder categories

### ✅ Image Display
- [ ] No more image 400 errors in console
- [ ] All product images load correctly
- [ ] Image URLs are properly formatted and accessible

## **Technical Risks**

### High Risk
- **URL conflicts**: Shopify GIDs contain special characters that break routing
- **Data inconsistency**: GraphQL products may have different field structure than expected

### Medium Risk
- **Image URL format**: Shopify CDN URLs may need different handling
- **Performance**: Category mapping may add latency to API calls

### Low Risk
- **Existing functionality**: Changes shouldn't break current working features

## **Implementation Strategy**

### Phase 1: Fix Product Routing (Critical)
1. **Analyze product data structure** from new GraphQL integration
2. **Implement URL-safe product identification**:
   - Option A: Use Shopify handle/slug if available
   - Option B: Create URL-safe mapping from GID to readable identifier
   - Option C: Use last portion of GID as route parameter
3. **Update routing in catalog, search, and product components**

### Phase 2: Restore Category Mapping
1. **Update categories API** to use `categoryMappingService`
2. **Integrate with GraphQL product data** to map Shopify categories to owner categories
3. **Test all 17 categories** for correct filtering

### Phase 3: Fix Image URLs
1. **Debug image URL generation** with GraphQL product structure
2. **Update `getImageUrl()` function** if needed for Shopify CDN format
3. **Verify all product images** load correctly

## **Test Hooks**

### Product Routing Tests
```bash
# Test specific product URL patterns
curl -I https://izerwaren.mcmichaelbuild.com/product/[test-product-id]

# Verify no 404s in browser console when clicking "View Details"
# Test sample of products from different categories
```

### Category API Tests
```bash
# Verify categories API returns 17 owner categories
curl https://izerwaren.mcmichaelbuild.com/api/products/categories | jq '.categories | length'

# Test category filtering
curl "https://izerwaren.mcmichaelbuild.com/api/products?ownerCategory=MARINE%20LOCKS"
```

### Image Loading Tests
```bash
# Check for image 400 errors in console
# Verify product images display correctly across catalog
# Test image URL generation with sample products
```

## **Implementation Steps**

### Step 1: Investigate Current Data Structure
- [ ] Analyze GraphQL product response structure
- [ ] Identify available fields for URL routing (handle, slug, etc.)
- [ ] Test sample product image URLs

### Step 2: Fix Product URL Generation
- [ ] Determine best routing strategy for GraphQL IDs
- [ ] Update catalog product links
- [ ] Update search product links
- [ ] Test product detail page routing

### Step 3: Restore Category Mapping
- [ ] Update `/api/products/categories/route.ts` to use mapping service
- [ ] Map Shopify productType to owner categories
- [ ] Test category dropdown functionality

### Step 4: Fix Image Issues
- [ ] Debug image URL problems with sample products
- [ ] Update image utility functions if needed
- [ ] Verify all images load correctly

### Step 5: Testing & Verification
- [ ] End-to-end testing of all fixed functionality
- [ ] Performance testing of category filtering
- [ ] Console error verification

## **Timeline**
- **Investigation**: 30 minutes
- **Product routing fix**: 60 minutes
- **Category mapping restoration**: 45 minutes  
- **Image fixes**: 30 minutes
- **Testing**: 30 minutes
- **Total estimated**: 3.25 hours

## **Success Metrics**
- Zero 404 errors for product detail navigation
- All 17 owner categories visible and functional
- Zero image 400 errors in console
- Full product catalog accessibility maintained

---

**Next Steps**: Start with data structure investigation to understand GraphQL product format and determine optimal routing strategy.

🤖 Generated with [Memex](https://memex.tech)
Co-Authored-By: Memex <noreply@memex.tech>