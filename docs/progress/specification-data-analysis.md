# Product Specification Data Analysis

**Date**: 2025-01-27  
**Context**: Pre-implementation analysis of Revival project specification data
to understand structure and requirements for product options/variants.

---

## Key Findings

### Data Volume & Coverage

- **Total Products**: 947
- **Products with Specifications**: 942 (99.47% coverage)
- **Total Specification Entries**: 341,148
- **Products without Specifications**: 5 (0.53%)

### Specification Structure - Product Options/Variants

The specifications represent **configurable product options** that customers
must select when ordering, not just descriptive text. Each specification has:

- `spec_type`: The option category (e.g., "orientation", "material",
  "dimension")
- `spec_value`: The available choice within that category (e.g., "left",
  "right")

---

## Specification Categories Analysis

### Primary Option Types (by variety):

```
1. current        - 915 unique values (electrical specifications)
2. force          - 395 unique values (mechanical force ratings)
3. voltage        - 310 unique values (electrical voltage options)
4. dimension      - 258 unique values (size measurements)
5. weight         - 163 unique values (weight specifications)
6. thread_size    - 63 unique values (threading options)
7. angle          - 17 unique values (angular configurations)
8. color          - 12 unique values (finish/color options)
9. material       - 12 unique values (construction material)
10. environment   - 9 unique values (usage environment)
11. orientation   - 9 unique values (left/right/handed options)
12. size          - 6 unique values (general size categories)
```

### Common Option Values:

#### **Orientation Options** (Binary Choice):

```
left:     13,919 entries (56.8%)
right:    10,238 entries (41.8%)
Right:       174 entries (0.7%)
Left:        168 entries (0.7%)
```

_Note: Case inconsistency needs normalization_

#### **Material Options** (Construction Material):

```
Steel:              56,970 entries (44.5%)
Stainless Steel:    48,463 entries (37.9%)
Brass:              12,557 entries (9.8%)
steel:               4,395 entries (3.4%)
STAINLESS STEEL:     1,893 entries (1.5%)
```

_Note: Case inconsistency needs normalization_

#### **Color/Finish Options**:

```
black:              17,852 entries (46.9%)
Brass:              12,427 entries (32.6%)
chrome:              2,514 entries (6.6%)
white:               1,963 entries (5.2%)
brass:               1,640 entries (4.3%)
Chrome:              1,614 entries (4.2%)
```

#### **Size Categories** (Simple):

```
Small:               3,842 entries (49.6%)
Medium:              3,831 entries (49.5%)
medium:                 40 entries (0.5%)
small:                  29 entries (0.4%)
```

---

## Product Option Complexity Examples

### Example Product: IZW-0007 (Door Lock)

- **5 option categories** with 550 total combinations:
  - **dimension**: 6 options (25mm, 30mm, 38mm, 50mm, 52mm, 55mm)
  - **environment**: 5 options (Exterior, MARINE, Marine, interior, marine)
  - **material**: 8 options (Aluminum, Brass, STAINLESS STEEL, STEEL, Stainless
    Steel, Steel, aluminum, steel)
  - **orientation**: 4 options (Left, Right, left, right)
  - **size**: 3 options (Small, Medium, small)

### Calculated Combinations:

```
6 dimensions × 5 environments × 8 materials × 4 orientations × 3 sizes = 2,880 possible combinations
Actual entries: 550 combinations (19% of theoretical maximum)
```

This suggests **not all combinations are valid/available** - the data represents
actual available product variants.

---

## Data Quality Issues

### 1. Case Inconsistency

- **Materials**: "Steel", "steel", "STEEL"
- **Orientations**: "left", "Left", "LEFT"
- **Colors**: "brass", "Brass"
- **Environments**: "marine", "Marine", "MARINE"

### 2. Value Normalization Needed

- Standardize capitalization across all spec values
- Consolidate duplicate entries (e.g., "left" + "Left" = "Left")

### 3. Data Interpretation

- **Force values**: "57n", "7N", "3N" (need unit standardization)
- **Dimensions**: "55 mm", "4mm" (inconsistent spacing)
- **Current/Voltage**: Need electrical specification validation

---

## Recommended Database Structure

### Option-Based Product Model

```prisma
model Product {
  id              String              @id @default(cuid())
  sku             String              @unique
  name            String
  basePrice       Decimal?
  // ... other fields
  optionGroups    ProductOptionGroup[]
  variants        ProductVariant[]
}

model ProductOptionGroup {
  id              String                 @id @default(cuid())
  productId       String
  name            String                 // "orientation", "material", etc.
  displayName     String                 // "Orientation", "Material", etc.
  required        Boolean                @default(true)
  displayOrder    Int?

  product         Product                @relation(fields: [productId], references: [id])
  options         ProductOption[]
}

model ProductOption {
  id              String                 @id @default(cuid())
  optionGroupId   String
  value           String                 // "left", "stainless steel", etc.
  displayName     String                 // "Left", "Stainless Steel", etc.
  priceModifier   Decimal?               @default(0) // Additional cost for this option
  displayOrder    Int?

  optionGroup     ProductOptionGroup     @relation(fields: [optionGroupId], references: [id])
  variantOptions  ProductVariantOption[]
}

model ProductVariant {
  id              String                 @id @default(cuid())
  productId       String
  sku             String                 @unique // Generated SKU for this variant
  price           Decimal?
  inventoryQty    Int                    @default(0)
  isActive        Boolean                @default(true)

  product         Product                @relation(fields: [productId], references: [id])
  selectedOptions ProductVariantOption[]
}

model ProductVariantOption {
  id              String                 @id @default(cuid())
  variantId       String
  optionId        String

  variant         ProductVariant         @relation(fields: [variantId], references: [id])
  option          ProductOption          @relation(fields: [optionId], references: [id])

  @@unique([variantId, optionId])
}
```

---

## Business Logic Requirements

### 1. Customer Product Selection Flow

```
1. Customer browses base product (IZW-0007)
2. System displays option groups (Orientation, Material, Dimension, etc.)
3. Customer selects one option from each required group
4. System validates combination exists as ProductVariant
5. System displays final price (base + option modifiers)
6. Customer adds configured variant to cart/quote
```

### 2. Admin Product Management

```
1. Import base products from Revival data
2. Parse specifications into normalized option groups/options
3. Generate ProductVariants for existing combinations only
4. Allow admin to add/remove valid combinations
5. Set pricing modifiers for premium options
```

### 3. Integration with Existing Systems

- **RFQ System**: Quote items reference specific ProductVariant IDs
- **Account Pricing**: Apply account-specific discounts to variant prices
- **Shopify Sync**: Map ProductVariants to Shopify variant IDs

---

## Data Migration Strategy

### Phase 1: Data Normalization

1. **Extract and normalize** all spec_type values into option groups
2. **Standardize case** and consolidate duplicate spec_values
3. **Validate data integrity** - ensure logical combinations

### Phase 2: Structure Import

1. **Create ProductOptionGroups** for each normalized spec_type
2. **Create ProductOptions** for each normalized spec_value
3. **Generate ProductVariants** for each existing specification combination
4. **Set base pricing** from Revival product prices

### Phase 3: Business Logic Implementation

1. **Build product configurator** UI components
2. **Implement variant selection** logic with validation
3. **Integrate pricing** calculations with account-specific discounts
4. **Connect to RFQ/cart** systems

---

## Immediate Questions for Decision

### 1. Option Group Priorities

Which option categories should be:

- **Required** (customer must select)
- **Optional** (customer can skip)
- **Display order** for user experience

### 2. Pricing Strategy

- Should different options have price modifiers?
- How do material upgrades (Brass vs Steel) affect pricing?
- Should dimension/size changes affect base price?

### 3. Inventory Management

- Do we track inventory at variant level or base product level?
- How do we handle out-of-stock option combinations?

### 4. Data Quality

- Proceed with automated case normalization?
- Manual review of consolidated options?
- How to handle electrical specifications (current/voltage)?

---

## Recommendation

**Do not proceed with simple specification import.** The data represents a
complex product configuration system that requires:

1. **Structured option/variant modeling** instead of flat specifications
2. **Data normalization** to resolve case/format inconsistencies
3. **Business logic implementation** for product configuration
4. **UI/UX design** for customer option selection

**Estimated complexity increase**: From 3-4 hours to 8-12 hours for proper
implementation.

**Suggested approach**: Start with a subset of products and option types to
validate the model before full migration.
