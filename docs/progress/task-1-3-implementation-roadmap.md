# Task 1.3 Implementation Roadmap: Centralize Configuration Logic

## Objective
Implement a comprehensive centralized configuration service that abstracts all environment-specific settings throughout the codebase, following 12-factor app methodology.

## Current State Analysis
- ✅ Frontend config service exists at `apps/frontend/src/lib/config.ts` (well-structured)
- ❌ Backend lacks centralized configuration service
- ❌ 35+ files still use direct `process.env` access
- ❌ Inconsistent configuration patterns across services

## Acceptance Criteria
1. **Backend Configuration Service**: Create `apps/backend/src/lib/config.ts` 
2. **Unified Configuration Interface**: Consistent API across frontend/backend
3. **Migration Complete**: All direct `process.env` usage replaced with config service
4. **Validation Framework**: Startup validation for required configuration
5. **Documentation**: Clear configuration usage patterns documented

## Implementation Strategy

### Phase 1: Backend Configuration Service (30 mins)
- Create `apps/backend/src/lib/config.ts` following frontend pattern
- Include Shopify, database, and server-specific configuration
- Add validation functions and error handling

### Phase 2: Frontend Configuration Enhancement (20 mins)
- Extend existing frontend config with missing patterns
- Add any configuration used directly in frontend files
- Enhance validation and error reporting

### Phase 3: Systematic Migration (45 mins)
**Priority Order:**
1. **Core Services** (high impact): `ShopifyService.ts`, `firebase.ts`, `shopify.ts`
2. **API Routes** (medium impact): All route handlers 
3. **Components** (low impact): UI components with env access
4. **Utilities** (low impact): Helper files and middleware

### Phase 4: Configuration Validation (15 mins)
- Add startup validation to both frontend and backend
- Create configuration health checks
- Add development-time configuration debugging

## Risk Assessment
- **Low Risk**: Frontend already has solid foundation
- **Medium Risk**: Backend service creation and integration
- **Low Risk**: File-by-file migration (systematic approach)

## Test Hooks
1. **Unit Tests**: Configuration service methods return expected values
2. **Integration Tests**: Services load configuration correctly
3. **Validation Tests**: Missing required configuration triggers appropriate errors
4. **Development Tests**: Configuration debugging works in dev mode

## Success Metrics
- [ ] Zero direct `process.env` access in source files (excluding config services)
- [ ] Both frontend and backend boot with configuration validation
- [ ] All services use centralized configuration
- [ ] Development experience improved with better error messages
- [ ] Configuration documentation complete

## Timeline
**Total Estimated Time**: 2 hours
**Priority**: High (required for GCP Secret Manager integration)
**Dependencies**: Task 1.2 ✅ (completed)