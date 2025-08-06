# Implementation Roadmap 001: Headless Shopify Architecture

**Date**: 2025-01-30  
**Status**: Planning  
**Session**: Initial architecture planning

## Objective

Build a headless Shopify B2B e-commerce platform where:

- Next.js frontend renders product/search/cart pages
- Shopify Checkout handles all payment flows
- Local Cloud SQL stores dealer-tier pricing and RFQ data only
- Dual authentication: Shopify Customer sessions (public) + Firebase Auth
  (dealers/admins)

## Acceptance Criteria

### Phase 1: Core Infrastructure

- [ ] Cloud Run service deployed with Next.js TypeScript app
- [ ] Cloud SQL PostgreSQL instance with Prisma schema
- [ ] Firebase Auth integration for dealers/admins
- [ ] Shopify storefront + admin API connections established
- [ ] Blue/green deployment pipeline in Cloud Build

### Phase 2: Data Migration & Sync

- [ ] JSON feed (1050 SKUs) imported to Shopify via Admin GraphQL bulk
      operations
- [ ] Product images uploaded to Shopify CDN
- [ ] Local `products` shadow table for search/price overlays
- [ ] `product_sync_log` table tracking reconciliation operations
- [ ] Automated sync job: JSON feed → Shopify → local shadow

### Phase 3: User Experience

- [ ] Public shoppers: Product browsing via Shopify Storefront API
- [ ] Dealers: Enhanced pricing display with Cloud SQL markdown overlays
- [ ] RFQ workflow: dealers submit → admins respond → convert to Shopify orders
- [ ] Admin portal: dealer management + pricing overrides

### Phase 4: Production Readiness

- [ ] Staging environment with separate Shopify sandbox store
- [ ] > 80% test coverage (unit + integration + e2e)
- [ ] Cloud Monitoring dashboards + uptime checks
- [ ] Error handling + graceful degradation patterns

## Architecture Components

### Frontend (Next.js)

- **Route structure**: `/products`, `/search`, `/cart`, `/dealer/*`, `/admin/*`
- **API routes**: `/api/auth/*`, `/api/rfq/*`, `/api/sync/*`, `/api/health`
- **Authentication**: NextAuth.js with Firebase + Shopify providers

### Backend Services

- **Shopify Integration**: Admin GraphQL (product sync) + Storefront API (public
  browsing)
- **Database**: Prisma models for `dealers`, `dealer_pricing`, `rfq_requests`,
  `product_sync_log`
- **Auth Junction**: `DealerShopifyCustomer` join table (Firebase UID ↔ Shopify
  customerId)

### Data Flow

1. **Public shoppers**: Next.js → Shopify Storefront API → Shopify Checkout
2. **Dealers**: Next.js → Cloud SQL (pricing) + Shopify API → enhanced display
3. **Product sync**: JSON feed → Admin GraphQL → Shopify → local shadow table
4. **RFQ flow**: Dealer form → Cloud SQL → admin review → Shopify order creation

## Risks & Mitigations

### High Risk

- **Shopify API rate limits**: Implement exponential backoff + bulk operations
- **Auth complexity**: Firebase ↔ Shopify customer mapping edge cases
- **Data consistency**: Shopify ↔ Cloud SQL sync failures

### Medium Risk

- **Image migration**: Large file uploads to Shopify CDN timeouts
- **Performance**: Next.js SSR + multiple API calls latency
- **Staging parity**: Sandbox vs production Shopify behavior differences

### Low Risk

- **Container size**: Next.js builds exceeding 300MB limit
- **Cloud Run cold starts**: Impact on user experience

## Test Hooks

### Unit Tests

- Prisma model validation + database operations
- Shopify API client wrapper functions
- Firebase Auth token validation logic
- RFQ business logic + price calculation

### Integration Tests

- End-to-end product sync: JSON → Shopify → Cloud SQL
- Auth flow: Firebase login → Shopify customer association
- RFQ workflow: creation → admin review → order conversion

### E2E Tests

- Public shopper journey: browse → cart → Shopify checkout
- Dealer journey: login → enhanced pricing → RFQ submission
- Admin workflow: dealer management → pricing overrides

### Performance Tests

- Product sync job with 1050 SKUs batch processing
- Concurrent dealer pricing lookups under load
- Next.js page render times with Shopify API calls

## Dependencies

- **External**: Shopify Partner account + sandbox store setup
- **Internal**: Firebase project configuration + service account keys
- **Data**: JSON feed access + product images folder location

---

**Next Steps**: Await confirmation to proceed with Phase 1 infrastructure setup.
