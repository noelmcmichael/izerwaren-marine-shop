# ADR-003: Product Sync Jobs Architecture

## Status

Proposed

## Context

Izerwaren Revival 2.0 requires automated synchronization between external JSON
feed data (≈1050 SKUs) and Shopify product catalog. The system must handle
initial bulk import, ongoing reconciliation, and conflict resolution while
maintaining data consistency across multiple data sources.

## Decision

Implement a multi-stage product synchronization architecture using Cloud Run
jobs with the following components:

### Sync Job Architecture

- **Trigger**: Cloud Scheduler (nightly 2 AM UTC) + manual admin triggers
- **Executor**: Dedicated Cloud Run job (separate from web service)
- **Storage**: Local shadow tables for search optimization + audit logging
- **Conflict Resolution**: Manual review queue for competing changes

### Data Flow Pipeline

1. **Fetch**: Download JSON feed from configured source location
2. **Parse**: Validate schema and extract product/variant/image data
3. **Compare**: Diff against Shopify Admin API product catalog
4. **Plan**: Generate change operations with conflict detection
5. **Execute**: Apply changes via Shopify Admin GraphQL mutations
6. **Update**: Refresh local shadow tables and sync logs
7. **Notify**: Generate reports and trigger admin alerts

### Synchronization Strategies

#### Initial Seed (Phase 1)

- Bulk import 1050 SKUs via Shopify Admin GraphQL `productCreate`
- Upload product images to Shopify CDN with proper metadata
- Populate local `products` and `product_variants` shadow tables
- Create comprehensive sync log for audit trail

#### Nightly Reconciliation (Phase 2)

- Compare JSON feed vs Shopify catalog (3-way diff including local shadow)
- Detect create/update/delete operations with confidence scoring
- Auto-apply low-risk changes, queue high-risk changes for manual review
- Rate-limited execution to respect Shopify API constraints (1000 req/min)

#### Conflict Resolution (Phase 3)

- Manual admin changes vs automated sync changes detection
- Timestamp-based conflict resolution with user notification
- Override policies for emergency price updates and product removals
- Rollback capability for bulk operations with partial failures

### Technical Implementation

#### Cloud Run Job Configuration

```yaml
# cloudbuild-sync-job.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      [
        'build',
        '-t',
        'gcr.io/$PROJECT_ID/izerwaren-sync-job:$BUILD_ID',
        '-f',
        'Dockerfile.sync',
        '.',
      ]
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      [
        'run',
        'jobs',
        'replace',
        '--image',
        'gcr.io/$PROJECT_ID/izerwaren-sync-job:$BUILD_ID',
        '--region',
        'us-central1',
        '--memory',
        '2Gi',
        '--cpu',
        '2',
        '--max-retries',
        '3',
        '--parallelism',
        '1',
        '--timeout',
        '3600s',
        'izerwaren-product-sync',
      ]
```

#### Shopify API Integration

```typescript
// Rate-limited GraphQL client
class ShopifyAdminClient {
  private rateLimiter = new TokenBucket(1000, 60000); // 1000/minute

  async bulkCreateProducts(
    products: ProductInput[]
  ): Promise<BulkOperationResult> {
    const chunks = this.chunkArray(products, 250); // Shopify bulk limit
    const results = [];

    for (const chunk of chunks) {
      await this.rateLimiter.consume(chunk.length);
      const result = await this.executeBulkMutation(chunk);
      results.push(result);
    }

    return this.consolidateResults(results);
  }
}
```

#### Conflict Detection Logic

```typescript
interface SyncConflict {
  type: 'COMPETING_EDIT' | 'SCHEMA_CHANGE' | 'DELETION_CONFLICT';
  productId: string;
  localChange: ProductChange;
  remoteChange: ProductChange;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: 'AUTO_RESOLVE' | 'MANUAL_REVIEW' | 'ADMIN_APPROVAL';
}

class ConflictDetector {
  detectConflicts(
    jsonFeedData: ProductData[],
    shopifyData: ShopifyProduct[],
    localShadow: Product[]
  ): SyncConflict[] {
    // Three-way merge conflict detection
    // Auto-resolve: price updates, description changes
    // Manual review: product deletions, major schema changes
    // Admin approval: bulk pricing changes >20%
  }
}
```

### Operational Monitoring

#### Success Metrics

- **Sync Completion Rate**: >99% successful nightly syncs
- **Data Consistency**: <0.1% SKU discrepancies between sources
- **Performance**: Complete sync under 30 minutes for 1000+ SKUs
- **Error Recovery**: <5 minute recovery time for transient failures

#### Alerting Thresholds

- **Critical**: Sync job failure or >10% SKU discrepancies
- **Warning**: Sync duration >45 minutes or >100 manual conflicts
- **Info**: Successful completion with summary statistics

#### Dashboard Metrics

- Sync job execution history and duration trends
- SKU difference tracking with categorized change types
- Shopify API rate limit usage and throttling events
- Manual review queue size and resolution times

## Consequences

### Positive

- **Automated Operations**: Reduces manual product management overhead
- **Data Consistency**: Single source of truth with conflict detection
- **Audit Trail**: Comprehensive logging for compliance and debugging
- **Scalability**: Handles growth from 1K to 10K+ SKUs without architecture
  changes

### Negative

- **Complexity**: Additional moving parts requiring monitoring and maintenance
- **Latency**: Up to 24-hour delay for product updates (nightly sync)
- **Dependencies**: Relies on external JSON feed availability and format
  stability
- **Resource Usage**: Additional Cloud Run job costs and database storage

### Neutral

- **Learning Curve**: Team must understand sync job operations and conflict
  resolution
- **Testing Requirements**: Comprehensive test coverage for edge cases and
  failures
- **Documentation**: Detailed runbooks for operations and troubleshooting

## Compliance

This ADR implements the product synchronization requirements from Implementation
Roadmap #1 (Shopify Seed & SKU Reconciliation) while adhering to the technical
constraints defined in ADR-000.

The implementation maintains the constitution requirement that "all
transactional commerce is delegated to Shopify" by ensuring local data serves
only as search optimization and pricing overlay, never as the authoritative
commerce source.

## Alternatives Considered

### Real-time Synchronization

**Rejected**: Would require webhook infrastructure and complex conflict
resolution. Nightly batch processing provides sufficient freshness for B2B use
case while reducing system complexity.

### Direct Database Integration

**Rejected**: Shopify Plus required for database access. Current Shopify plan
level necessitates API-based integration.

### Manual Upload Process

**Rejected**: Does not scale with business growth and introduces human error
risk. Automated sync provides audit trail and consistency guarantees.

---

_Date: 2025-01-30_ _Status: Proposed_ _Supersedes: N/A_
