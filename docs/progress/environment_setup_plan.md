# Implementation Roadmap: Environment Setup & Configuration

**Status**: ✅ Complete  
**Priority**: Critical  
**Estimated Effort**: 2-4 hours  
**Created**: 2025-01-30  
**Completed**: 2025-01-30

## Objective

Configure development and staging environments with proper Firebase Auth,
database connections, and Shopify integration to enable local development and
testing of the completed application.

## Acceptance Criteria

### Must Have

- [ ] Local development environment with working database connection
- [ ] Firebase Auth configuration (development project)
- [ ] Shopify development store with Admin API access
- [ ] Environment validation script passes all connectivity tests
- [ ] Admin portal accessible with Firebase authentication
- [ ] Product sync functionality operational

### Should Have

- [ ] Database seeded with sample dealer data
- [ ] Shopify store populated with test products
- [ ] Health check endpoint returning all green status
- [ ] Comprehensive environment validation logging

### Could Have

- [ ] Staging environment configuration documented
- [ ] GCP Cloud SQL instance provisioned
- [ ] Production environment preparation checklist

## Implementation Steps

### Phase 1: Local Database Setup (30 min)

1. **PostgreSQL Installation**
   - Install PostgreSQL 15 locally or use Docker
   - Create `izerwaren_dev` database
   - Update `.env` with local DATABASE_URL

2. **Prisma Migration**
   - Run `npm run db:generate` to generate Prisma client
   - Run `npm run db:push` to create tables
   - Verify schema matches current Prisma models

### Phase 2: Firebase Configuration (45 min)

1. **Firebase Project Setup**
   - Create Firebase project for development
   - Enable Authentication with Email/Password provider
   - Create service account with Admin SDK privileges
   - Download service account JSON credentials

2. **Environment Configuration**
   - Extract Firebase config values for client SDK
   - Add Firebase credentials to `.env`
   - Configure CORS and authorized domains

### Phase 3: Shopify Development Store (60 min)

1. **Shopify Partner Account & Store**
   - Create Shopify Partner account if needed
   - Create development store
   - Configure store settings and sample products

2. **API Access Setup**
   - Create private app with Admin API permissions
   - Generate Storefront API access token
   - Configure webhook endpoints for sync

### Phase 4: Integration Testing (45 min)

1. **Connectivity Validation**
   - Test database connection via Prisma
   - Verify Firebase Auth server initialization
   - Validate Shopify API rate limiting compliance
   - Run health check endpoint

2. **Functional Testing**
   - Create test admin user in Firebase
   - Log into admin portal
   - Execute manual product sync
   - Create sample dealer record

## Risk Mitigation

### High Risk

- **Firebase service account security**: Store private key securely, never
  commit to git
- **Shopify API rate limits**: Implement proper throttling from day 1
- **Database connection reliability**: Use connection pooling in production

### Medium Risk

- **CORS configuration**: Ensure proper domain whitelist for Firebase Auth
- **Environment variable validation**: Comprehensive checks at startup
- **Local vs cloud credential conflicts**: Clear separation of environments

### Low Risk

- **Port conflicts**: Default Next.js port 3000 may be in use
- **Node version compatibility**: Ensure Node 18 LTS alignment

## Test Hooks

### Automated Tests

```bash
# Environment validation
npm run test:env

# Database connectivity
npm run test:db

# External service health
npm run test:health
```

### Manual Test Scenarios

1. **Authentication Flow**: Firebase login → admin dashboard access
2. **Product Sync**: Manual trigger → Shopify API → database update
3. **Dealer Management**: CRUD operations through admin interface
4. **Health Monitoring**: `/api/health` returns all services operational

## Dependencies

### External Services Required

- PostgreSQL 15 (local or cloud)
- Firebase project with Auth enabled
- Shopify development store
- Node.js 18 LTS environment

### Internal Dependencies

- Prisma schema up-to-date
- Admin portal UI components
- API route handlers functional
- Docker configuration (for Cloud Run compatibility)

## Success Metrics

- [ ] Application starts without errors on `npm run dev`
- [ ] Health check returns 200 with all services green
- [ ] Admin authentication completes successfully
- [ ] Product sync creates records in local database
- [ ] No console errors in browser dev tools
- [ ] All environment variables properly loaded

## Documentation Updates

- [ ] Update README.md with local setup instructions
- [ ] Document Firebase project configuration steps
- [ ] Add Shopify store setup guide
- [ ] Create troubleshooting section for common issues

## Notes

This environment setup is foundational for all subsequent development work. The
configuration established here will serve as the template for staging and
production environments, so thorough validation is critical.

Priority focus on security: Firebase private keys and Shopify tokens must be
properly secured and never committed to version control.
