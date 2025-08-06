# Variant Configuration Implementation Roadmap

**Created**: 2025-01-30  
**Status**: Planning → Implementation  
**Scope**: Product variant selection UI for 63 variable products

## Objective

Build comprehensive variant configuration system allowing customers to select product options (handing, door thickness, etc.) before adding items to cart, supporting 317 individual SKU combinations across 63 products.

## Acceptance Criteria

### Backend Requirements
- [ ] Enhanced API endpoint to return variant configuration metadata
- [ ] Dynamic SKU generation based on variant selections  
- [ ] Price calculations for variant-specific pricing
- [ ] Inventory tracking for individual variant combinations

### Frontend Requirements
- [ ] Dynamic variant selection UI components
- [ ] Form validation preventing invalid combinations
- [ ] Real-time price updates based on selections
- [ ] SKU display updates reflecting current configuration
- [ ] "Add to Cart" disabled until all required variants selected

### PDF Preview Requirements  
- [ ] Embedded PDF viewer component
- [ ] Preview mode with download/fullscreen options
- [ ] Responsive design for mobile/desktop viewing
- [ ] Fallback handling for unsupported browsers

## Current Analysis

### Variant Types Distribution
1. **Handing** (38 products): Left Hand / Right Hand
2. **Door Thickness** (14 products): 1½", 1¾", 2", 2¼", 2½"  
3. **Rimlock Handing** (3 products): Complex directional
4. **Tubular Latch** (3 products): Mechanical functions
5. **Key Rose Thickness** (2 products): Rose plate thickness
6. **Magnetic Holder** (2 products): Shape/mount type
7. **Glass Thickness** (1 product): 3/8", 1/2" glass compatibility

### Complexity Levels
- **Simple**: 1 variant type (48 products)
- **Complex**: 2+ variant types (15 products)  
- **Most Complex**: IZW-0027, IZW-0124 (20 combinations each)

## Implementation Plan

### Phase 1: Backend Variant API Enhancement
1. **Create variant metadata endpoint**
   - `/api/v1/products/:sku/variants` - return available options
   - Include pricing deltas, availability per variant
   - Support dynamic SKU generation

2. **Enhanced product details API**
   - Add `hasVariants`, `variantTypes`, `variantOptions` fields
   - Include variant-specific pricing and availability

### Phase 2: Frontend Variant Selection UI
1. **Create VariantSelector component**
   - Dynamic form generation based on variant types
   - Real-time validation and price updates
   - Disabled state management for "Add to Cart"

2. **Integrate with ProductDetailPage**
   - Replace static variant selection with dynamic system
   - Show current configuration and resulting SKU
   - Handle complex multi-variant products

### Phase 3: PDF Preview Integration
1. **Create PDFPreview component**
   - Embedded viewer using react-pdf or PDF.js
   - Modal/inline preview options
   - Download and fullscreen capabilities

2. **Integrate with ProductDetailPage**
   - Replace current PDF buttons with preview
   - Responsive design for mobile viewing

## Risk Mitigation

### Technical Risks
- **Complex variant logic**: Start with simple cases, iterate to complex
- **Performance**: Lazy-load PDFs, optimize variant calculations
- **Browser compatibility**: Provide fallbacks for PDF viewing

### Business Risks  
- **Inventory complexity**: Phase rollout to validate accuracy
- **Customer confusion**: Clear UI patterns, helpful validation messages
- **Cart integration**: Ensure Shopify variant mapping works correctly

## Test Hooks

### Variant System Testing
- **Simple variants**: Test IZW-0079 (handing only)
- **Complex variants**: Test IZW-0027 (door thickness + handing + cylinder)
- **Edge cases**: Invalid combinations, out-of-stock variants

### PDF Preview Testing
- **Document types**: Test with different PDF sizes/formats
- **Devices**: Mobile, tablet, desktop viewing
- **Fallbacks**: Browsers without PDF support

## Success Metrics

- All 63 variant products show configuration UI
- Customer can select options and see price/SKU updates
- "Add to Cart" only enabled with complete configuration
- PDF previews load and display correctly
- No performance degradation on product pages

## Dependencies

- Reference document: `/Users/noelmcmichael/Workspace/izerwaren_revival/docs/VARIABLE_PRODUCTS_LIST.md`
- PDF documents: `/pdfs/{SKU}_catalog.pdf` pattern
- Existing Shopify integration for cart functionality
- Current product detail page structure