# Implementation Roadmap: Shopify Seed & SKU Reconciliation

**Date**: 2025-01-30  
**Status**: Planning  
**Session**: Phase 2 - Data Migration & Sync

## Objective

Build automated product synchronization system that imports JSON feed data to
Shopify, maintains local shadow tables, and runs nightly reconciliation jobs to
detect and resolve SKU differences.

## Acceptance Criteria

### Phase A: Initial Seed Import

- [ ] Parse JSON feed (≈1050 SKUs) and validate required fields
- [ ] Batch upload to Shopify via Admin GraphQL `productCreate` mutations
- [ ] Upload product images to Shopify CDN with proper alt text and metadata
- [ ] Populate local `products` and `product_variants` shadow tables
- [ ] Log all operations to `product_sync_log` with success/failure tracking

### Phase B: Reconciliation Engine

- [ ] Compare Shopify product list vs JSON feed (detect create/update/delete
      operations)
- [ ] Identify SKU mismatches, price changes, and inventory discrepancies
- [ ] Generate reconciliation reports with actionable admin notifications
- [ ] Handle Shopify API rate limits with exponential backoff and bulk
      operations
- [ ] Graceful error handling for partial failures and network timeouts

### Phase C: Automated Sync Jobs

- [ ] Cloud Run job triggered by Cloud Scheduler (nightly 2 AM UTC)
- [ ] Configurable sync policies: auto-apply vs manual review thresholds
- [ ] Dead letter queue for failed sync operations requiring manual intervention
- [ ] Monitoring dashboard showing sync health, SKU drift, and error rates
- [ ] Alerting via Cloud Monitoring for sync failures or significant SKU changes

## Architecture Components

### Data Sources

- **Primary**: JSON feed file (1050 SKUs with product details, pricing, images)
- **Secondary**: Shopify Admin API (source of truth for live commerce data)
- **Tertiary**: Local shadow tables (optimized for search and price overlays)

### Sync Workflow

1. **Fetch**: Download latest JSON feed from configured source location
2. **Parse**: Validate schema, extract product/variant data, resolve image URLs
3. **Compare**: Diff against current Shopify product catalog via Admin GraphQL
4. **Plan**: Generate change operations (create/update/delete) with conflict
   resolution
5. **Execute**: Apply changes to Shopify with rate limiting and error handling
6. **Update**: Refresh local shadow tables and log sync results
7. **Notify**: Send summary report to admin dashboard and configured alerts

### Data Models (Prisma Extensions)

```typescript
// Extend existing Product model with sync metadata
model Product {
  // ... existing fields
  lastSyncedAt     DateTime?   @map("last_synced_at")
  syncStatus       SyncStatus  @default(PENDING)
  sourceHash       String?     @map("source_hash") // JSON feed content hash
  shopifyHandle    String?     @map("shopify_handle")
}

// Enhanced sync logging
model ProductSyncLog {
  // ... existing fields
  batchId          String?     @map("batch_id")      // Group related operations
  changeType       ChangeType  @map("change_type")   // CREATE, UPDATE, DELETE, SKIP
  conflictReason   String?     @map("conflict_reason")
  retryCount       Int         @default(0) @map("retry_count")
}

enum ChangeType {
  CREATE_PRODUCT
  UPDATE_PRODUCT
  DELETE_PRODUCT
  CREATE_VARIANT
  UPDATE_VARIANT
  DELETE_VARIANT
  IMAGE_UPLOAD
  PRICE_CHANGE
}
```

## Risks & Mitigations

### High Risk

- **Shopify API rate limits**: 1000 requests/minute for Admin GraphQL
  - _Mitigation_: Implement token bucket rate limiting, use bulk operations for
    batches >10 items
- **Large image uploads**: Timeout failures for high-resolution product images
  - _Mitigation_: Resize images to optimal web dimensions, parallel upload with
    retry logic
- **Data consistency**: Race conditions between manual admin edits and automated
  sync
  - _Mitigation_: Conflict detection with manual review queue for competing
    changes

### Medium Risk

- **JSON feed schema changes**: Breaking changes to source data structure
  - _Mitigation_: Schema validation with graceful degradation and admin alerts
- **Cloud Run job timeouts**: Sync operations exceeding 60-minute Cloud Run
  limit
  - _Mitigation_: Chunked processing with resume capability and progress
    checkpoints
- **Network failures**: Intermittent connectivity to external services
  - _Mitigation_: Exponential backoff, dead letter queue, and manual retry
    mechanisms

### Low Risk

- **Local storage overflow**: Shadow table growth exceeding Cloud SQL limits
  - _Mitigation_: Automated cleanup of old sync logs and archived product
    versions
- **Timezone handling**: Confusion between UTC sync times and local business
  hours
  - _Mitigation_: All timestamps in UTC with clear documentation and admin
    dashboard

## Test Hooks

### Unit Tests

- JSON feed parser with malformed data edge cases
- Shopify API client wrapper with rate limiting simulation
- Conflict detection algorithm with various data change scenarios
- Image processing and upload retry logic

### Integration Tests

- End-to-end sync: JSON feed → Shopify → local shadow table verification
- Batch operations with mixed success/failure scenarios
- Rate limiting behavior under high-volume operations
- Error recovery and resume from partial sync states

### E2E Tests

- Complete product catalog sync with 1000+ SKUs
- Nightly job execution with Cloud Scheduler trigger
- Admin dashboard displaying sync status and error reports
- Alert delivery for failed syncs and significant SKU changes

### Performance Tests

- Bulk upload performance with 500+ products per batch
- Memory usage during large JSON feed processing
- Database query performance on shadow tables with 10K+ products
- Cloud Run cold start impact on scheduled job execution

## Dependencies

- **External**: JSON feed source location and access credentials
- **Internal**: Shopify Admin API tokens with product management scope
- **Infrastructure**: Cloud Scheduler for job triggers, Cloud SQL for shadow
  tables

## Implementation Phases

### Week 1: Foundation

- Shopify Admin API client setup and authentication
- JSON feed parser with schema validation
- Basic product creation workflow (single SKU)

### Week 2: Batch Operations

- Bulk product creation via GraphQL mutations
- Image upload pipeline with retry logic
- Local shadow table population and indexing

### Week 3: Reconciliation Logic

- Diff engine comparing JSON feed vs Shopify catalog
- Conflict detection and resolution policies
- Comprehensive sync logging and error tracking

### Week 4: Automation & Monitoring

- Cloud Run job with Cloud Scheduler integration
- Admin dashboard for sync monitoring
- Alerting and dead letter queue configuration

---

**Next Steps**: Create ADR-003 Product Sync Jobs and Admin Portal MVP roadmap
before implementation.
