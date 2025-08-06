# Implementation Roadmap: Admin Portal MVP

**Date**: 2025-01-30  
**Status**: Planning  
**Session**: Phase 2 - Admin Interface Development

## Objective

Build minimal viable admin interface for dealer management, pricing overrides,
and SKU sync monitoring. Focus on essential CRUD operations and operational
dashboards without over-engineering.

## Acceptance Criteria

### Phase A: Authentication & Navigation

- [ ] Firebase Auth integration for admin users only
- [ ] Protected route middleware for `/admin/*` paths
- [ ] Basic navigation: Dealers, Pricing, Sync Status, RFQ Management
- [ ] Role-based access control (admin vs super-admin permissions)
- [ ] Session management with secure logout and token refresh

### Phase B: Dealer Management CRUD

- [ ] Dealer list view with search, filtering by tier/status
- [ ] Create dealer form: company details, contact info, tier assignment
- [ ] Edit dealer profile with Firebase UID association
- [ ] Shopify Customer ID mapping management (add/remove linked accounts)
- [ ] Bulk operations: activate/deactivate dealers, tier changes

### Phase C: Pricing Override System

- [ ] Product search interface with Shopify integration
- [ ] Create pricing rule: dealer + product/variant + markdown/fixed price
- [ ] Effective date range management with auto-expiration
- [ ] Quantity-based pricing tiers (min/max order quantities)
- [ ] Bulk pricing upload via CSV import with validation

### Phase D: SKU Sync Dashboard

- [ ] Sync job status monitoring with real-time updates
- [ ] SKU difference report: Shopify vs JSON feed discrepancies
- [ ] Manual sync trigger with progress tracking
- [ ] Error log viewer with actionable resolution steps
- [ ] Sync history with filtering by date range and operation type

## UI Components & Pages

### Layout & Navigation

```
/admin/
├── dashboard/          # Overview stats and recent activity
├── dealers/            # Dealer management interface
│   ├── list            # Paginated dealer table
│   ├── create          # New dealer form
│   ├── [id]/edit       # Edit dealer profile
│   └── [id]/pricing    # Dealer-specific pricing rules
├── pricing/            # Global pricing management
│   ├── rules           # All pricing overrides
│   ├── products        # Product search and selection
│   └── bulk-import     # CSV upload interface
└── sync/               # Product synchronization monitoring
    ├── status          # Current sync job status
    ├── differences     # SKU reconciliation report
    ├── history         # Past sync operations
    └── logs            # Detailed error and success logs
```

### Key Components

- **DealerTable**: Sortable, filterable table with inline actions
- **PricingRuleForm**: Product selector + pricing input with validation
- **SyncStatusCard**: Real-time job progress with retry/cancel actions
- **ProductSearchCombobox**: Shopify product lookup with autocomplete
- **BulkUploader**: Drag-drop CSV with preview and validation feedback

## Data Requirements

### API Routes (Next.js App Router)

```typescript
// Dealer management
GET    /api/admin/dealers              # Paginated dealer list
POST   /api/admin/dealers              # Create new dealer
GET    /api/admin/dealers/[id]         # Single dealer details
PUT    /api/admin/dealers/[id]         # Update dealer
DELETE /api/admin/dealers/[id]         # Deactivate dealer

// Pricing management
GET    /api/admin/pricing              # Dealer pricing rules
POST   /api/admin/pricing              # Create pricing rule
PUT    /api/admin/pricing/[id]         # Update pricing rule
DELETE /api/admin/pricing/[id]         # Remove pricing rule
POST   /api/admin/pricing/bulk-import  # CSV upload processing

// Product sync monitoring
GET    /api/admin/sync/status          # Current job status
POST   /api/admin/sync/trigger         # Manual sync start
GET    /api/admin/sync/differences     # SKU discrepancy report
GET    /api/admin/sync/logs            # Paginated sync history

// Shopify integration
GET    /api/admin/shopify/products     # Product search endpoint
GET    /api/admin/shopify/customers    # Customer lookup for dealer mapping
```

### Database Queries (Performance Optimized)

```sql
-- Dealer list with pricing rule counts
SELECT d.*, COUNT(dp.id) as pricing_rules_count
FROM dealers d
LEFT JOIN dealer_pricing dp ON d.id = dp.dealer_id
WHERE d.is_active = true
GROUP BY d.id
ORDER BY d.created_at DESC
LIMIT 20 OFFSET ?;

-- SKU differences for sync dashboard
SELECT p.title, p.shopify_product_id, psl.error_message, psl.synced_at
FROM products p
LEFT JOIN product_sync_log psl ON p.id = psl.product_id
WHERE psl.status = 'FAILED' OR psl.synced_at < NOW() - INTERVAL '24 hours'
ORDER BY psl.synced_at DESC;

-- Dealer pricing effective rules
SELECT dp.*, p.title as product_title
FROM dealer_pricing dp
JOIN products p ON dp.shopify_product_id = p.shopify_product_id
WHERE dp.dealer_id = ?
  AND dp.is_active = true
  AND (dp.effective_until IS NULL OR dp.effective_until > NOW())
ORDER BY dp.created_at DESC;
```

## Technical Implementation

### Frontend Stack

- **Framework**: Next.js 14 App Router with React Server Components
- **Styling**: Tailwind CSS with custom admin theme
- **Components**: Headless UI for accessible form controls and modals
- **State**: React Query for server state management and caching
- **Forms**: React Hook Form with Zod validation schemas

### Authentication Flow

1. **Admin Login**: Firebase Auth with admin domain restriction
2. **Route Protection**: Middleware validates Firebase tokens on `/admin/*`
3. **Permission Check**: Database lookup for admin role verification
4. **Session Storage**: Secure cookies with automatic refresh

### Error Handling

- **API Errors**: Consistent error response format with user-friendly messages
- **Validation**: Client-side and server-side validation with clear feedback
- **Network Issues**: Retry logic with loading states and offline indicators
- **Permission Denied**: Graceful redirects with informative error pages

## Risks & Mitigations

### High Risk

- **Firebase Auth complexity**: Token validation and refresh edge cases
  - _Mitigation_: Comprehensive auth middleware testing and fallback mechanisms
- **Shopify API reliability**: External dependency for product searches
  - _Mitigation_: Local caching with fallback to shadow tables for product
    lookups
- **Large dataset performance**: Dealer/pricing tables with thousands of records
  - _Mitigation_: Pagination, indexing, and query optimization from day one

### Medium Risk

- **CSV bulk import validation**: Malformed data causing partial failures
  - _Mitigation_: Multi-stage validation with preview mode and rollback
    capability
- **Real-time sync updates**: WebSocket complexity for live status updates
  - _Mitigation_: Simple polling with efficient endpoint caching and rate
    limiting
- **Mobile responsiveness**: Admin interface usability on tablets/phones
  - _Mitigation_: Mobile-first design with touch-friendly controls and layouts

### Low Risk

- **Theme customization**: Admin interface branding and visual consistency
  - _Mitigation_: Tailwind CSS custom theme with design system documentation
- **Browser compatibility**: Modern JavaScript features in older browsers
  - _Mitigation_: Next.js handles transpilation; focus on evergreen browser
    support

## Test Hooks

### Unit Tests

- API route handlers with mock Firebase auth
- Pricing calculation logic with edge cases
- CSV validation and parsing functions
- React components with React Testing Library

### Integration Tests

- End-to-end dealer creation with Firebase user provisioning
- Pricing rule application across different dealer tiers
- Bulk import workflow with success/failure scenarios
- Sync monitoring with mock job status updates

### E2E Tests

- Complete admin workflow: login → create dealer → set pricing → monitor sync
- Multi-user concurrent editing with conflict resolution
- Mobile interface testing on tablet and phone viewports
- Performance testing with large datasets (1000+ dealers, 10K+ pricing rules)

## Dependencies

- **External**: Firebase Admin SDK for server-side auth verification
- **Internal**: Shopify Admin API for product/customer lookups
- **UI Libraries**: Headless UI, React Query, React Hook Form
- **Development**: Storybook for component documentation (optional)

## Implementation Timeline

### Week 1: Foundation

- Firebase Auth integration and protected routes
- Basic admin layout with navigation
- Dealer CRUD API routes and database operations

### Week 2: Core Features

- Dealer management interface with search/filter
- Pricing rule creation and editing forms
- Product search integration with Shopify API

### Week 3: Monitoring & Bulk Operations

- Sync status dashboard with real-time updates
- SKU difference reporting and manual triggers
- CSV bulk import with validation and preview

### Week 4: Polish & Testing

- Error handling and user experience improvements
- Comprehensive testing suite and performance optimization
- Documentation and admin user training materials

---

**Next Steps**: Create ADR-003 Product Sync Jobs before implementation begins.
