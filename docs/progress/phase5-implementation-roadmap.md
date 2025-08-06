# Phase 5 Implementation Roadmap: Final Polish & Sub-Category Filtering

## Objective

Complete final production improvements:

1. Rebuild featured products section with working product links
2. Increase logo prominence by 50%
3. Design and implement sub-category filtering system

## Acceptance Criteria

### 1. Featured Products Section

- [x] Remove existing featured products implementation
- [x] Create new featured products component with real API data
- [x] Ensure all product links work correctly (`/product/[id]` routing)
- [x] Use proper product card component for consistency
- [x] Display 3-4 featured products from different categories
- [x] Fallback gracefully if API fails

### 2. Logo Enhancement

- [x] Increase logo size from 160x50 to 240x75 (50% increase)
- [x] Maintain responsive behavior
- [x] Ensure layout doesn't break on mobile

### 3. Sub-Category Filter Analysis & Implementation

- [x] Analyze current category structure (17 owner categories, ~70
      sub-categories)
- [x] Design UI/UX for sub-category inclusion/exclusion
- [x] Implement backend support for sub-category filtering
- [x] Create intuitive UI component for multi-select sub-categories
- [x] Test with complex filter combinations

## Implementation Plan

### Step 1: Featured Products Rebuild

**Files to modify:**

- `apps/frontend/src/app/page.tsx` - Replace existing featured products logic
- Create new component: `apps/frontend/src/components/home/FeaturedProducts.tsx`

**Technical approach:**

- Fetch from `/api/v1/products?featured=true` or similar
- Use diverse category selection algorithm
- Implement proper routing to `/product/[sku]` or `/product/[id]`

### Step 2: Logo Enhancement

**Files to modify:**

- `apps/frontend/src/components/navigation/MainHeader.tsx`

**Changes:**

- Update Image dimensions from 160x50 to 240x75
- Adjust responsive classes if needed
- Test mobile layout

### Step 3: Sub-Category Filter Design Options

**Option A: Accordion Style**

```
[MARINE LOCKS ▼] (169 products)
  ☑ 25, 30 and 38 mm backset locks (23 products)
  ☐ 40 and 50 mm backset locks (31 products)
  ☐ Italian Marine Locks - Razeto (18 products)
  ...
```

**Option B: Expandable Tags**

```
[MARINE LOCKS] [+ Sub-categories (7)]
  → [25-38mm backset] [40-50mm backset] [Italian Razeto] [X Clear]
```

**Option C: Secondary Dropdown**

```
Category: [MARINE LOCKS ▼]
Sub-category: [All ▼] or [Select multiple ▼]
```

## Risk Assessment

### Low Risk

- Logo size increase - straightforward CSS change
- Featured products rebuild - using existing components

### Medium Risk

- Sub-category filter UX - needs careful design to avoid overwhelming users
- Performance with complex filters - may need query optimization

### High Risk

- None identified

## Test Hooks

### Featured Products

```javascript
// Test 1: API Integration
curl "http://localhost:3001/api/v1/products?limit=4&diverse_categories=true"

// Test 2: Product Links
// Click featured product → should navigate to /product/[sku]
// Verify product detail page loads correctly

// Test 3: Fallback Behavior
// Simulate API failure → should show graceful fallback
```

### Logo Enhancement

```javascript
// Test 1: Desktop Display
// Verify logo is approximately 50% larger
// Check layout doesn't break in header

// Test 2: Mobile Responsive
// Test on mobile devices
// Ensure header remains functional
```

### Sub-Category Filter

```javascript
// Test 1: Basic Functionality
// Select category → sub-categories appear
// Select sub-category → products filter correctly

// Test 2: Complex Combinations
// Multiple sub-categories within same category
// Verify URL state persistence
// Test performance with complex queries

// Test 3: UI/UX
// Intuitive interaction patterns
// Clear visual feedback
// Mobile-friendly interface
```

## Current Project Status

- **Phase 1-4**: ✅ COMPLETED (All 11 original issues resolved)
- **Phase 5**: 🔄 IN PROGRESS
  - Featured Products: ⏳ PENDING
  - Logo Enhancement: ⏳ PENDING
  - Sub-Category Analysis: ⏳ PENDING

## Success Metrics

1. Featured products have 0% broken links
2. Logo is visually more prominent without breaking layout
3. Sub-category filter provides intuitive product discovery
4. All existing functionality remains intact
5. Page load performance maintained < 2s
