# Task 2.1: Monorepo Boundary Audit

**Date**: 2025-01-30  
**Status**: Complete ✅  
**Objective**: Document current monorepo structure and identify boundaries for consolidation

## Executive Summary

The current monorepo follows a traditional separation between frontend (`apps/frontend`) and backend (`apps/backend`) with shared packages. Analysis shows this can be consolidated into a single Next.js app with API routes with **low to medium risk**.

## Current Architecture

### Apps Structure
```
apps/
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── routes/       # 6 main API route files
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   ├── lib/         # Backend utilities
│   │   └── server.ts    # Express app entry point
│   └── package.json     # 11 dependencies
└── frontend/             # Next.js application  
    ├── src/
    │   ├── pages/       # Next.js pages
    │   ├── components/  # React components
    │   ├── lib/        # Frontend utilities
    │   └── hooks/      # React hooks
    └── package.json    # 8 dependencies
```

### Packages Structure
```
packages/
├── database/            # Prisma schema & utilities
│   ├── prisma/         # Database schema
│   ├── src/           # Prisma client exports
│   └── package.json   # 2 dependencies
├── shared/             # Common utilities
│   ├── src/           # TypeScript utilities
│   └── package.json   # 1 dependency (zod)
└── shopify-integration/ # Shopify API wrappers
    ├── src/           # Shopify services
    └── package.json   # 8 dependencies
```

## API Endpoint Analysis

### Backend Routes (6 main files)
1. **`/health`** - System health checks (basic + detailed)
2. **`/products`** - Product catalog, variants, search
3. **`/media`** - Asset management and URL generation
4. **`/sync`** - Data synchronization with Shopify
5. **`/cart`** - Customer cart operations
6. **`/customers/cart`** - Extended cart functionality

### API Endpoint Details
| Route | Methods | Complexity | Dependencies |
|-------|---------|-------------|--------------|
| `/health` | GET | Low | Database |
| `/products/*` | GET, POST | Medium | Database, Shopify |
| `/media/*` | GET | Low | File system |
| `/sync/*` | POST | High | Database, Shopify |
| `/cart/*` | GET, POST, PUT, DELETE | Medium | Database |

## Dependency Analysis

### Shared Dependencies
- **`@izerwaren/database`**: Used by backend, shopify-integration
- **`@izerwaren/shared`**: Used by backend, database, shopify-integration  
- **`@izerwaren/shopify-integration`**: Used by backend only

### External Dependencies
- **Common**: `zod`, `@prisma/client`, `@shopify/*` packages
- **Backend Only**: `express`, `cors`, `helmet`, `morgan`
- **Frontend Only**: `react`, `next`, `@tanstack/react-query`

### Dependency Relationships
```
Backend → Database, Shared, Shopify-Integration
Frontend → (no workspace deps - standalone)
Database → Shared
Shopify-Integration → Database, Shared
```

## Build Complexity Assessment

### Current Build Process
1. **Turbo orchestration**: Manages workspace builds
2. **Multi-stage Docker**: Separate build contexts for frontend/backend
3. **Workspace dependencies**: npm workspaces with cross-package imports
4. **Monorepo tooling**: Turbo caching, parallel builds

### Build Time Analysis
- **Full build**: ~10-15 minutes (includes all workspace deps)
- **Frontend only**: ~3-5 minutes
- **Backend only**: ~2-3 minutes
- **Docker build**: ~8-12 minutes (multi-stage complexity)

## Migration Feasibility

### ✅ **Low Risk Areas**
1. **Health endpoints**: Simple logic, easy to migrate
2. **Media endpoints**: Static file serving, Next.js handles natively
3. **Frontend components**: Already Next.js, no changes needed
4. **Database package**: Can remain as-is (Prisma schema)

### ⚠️ **Medium Risk Areas**
1. **Product endpoints**: Complex business logic, database operations
2. **Cart functionality**: Session management, state handling
3. **Configuration service**: Already centralized, needs API route adaptation
4. **Shared utilities**: Import path changes required

### 🚨 **High Risk Areas**
1. **Sync endpoints**: Heavy Shopify integration, background processing
2. **Authentication**: Express middleware → Next.js middleware migration
3. **CORS handling**: Express-specific → Next.js API route configuration
4. **Error handling**: Express error middleware → Next.js error boundaries

## Consolidation Strategy

### Phase 1: Direct Migration (Low Risk)
- Move health, media endpoints to `/pages/api/`
- Integrate shared utilities into frontend `src/lib/`
- Update import paths from workspace packages

### Phase 2: Business Logic Migration (Medium Risk)  
- Migrate products, cart endpoints with existing logic
- Preserve database operations and Shopify integration
- Maintain API contract compatibility

### Phase 3: Complex Integration (High Risk)
- Migrate sync endpoints with background job handling
- Update authentication and middleware logic
- Optimize for serverless (connection pooling, etc.)

## Estimated Migration Effort

| Component | Effort | Complexity | Risk Level |
|-----------|---------|------------|------------|
| Health routes | 1-2 hours | Low | Low |
| Media routes | 1-2 hours | Low | Low |
| Product routes | 3-4 hours | Medium | Medium |
| Cart routes | 2-3 hours | Medium | Medium |
| Sync routes | 4-6 hours | High | High |
| Shared integration | 2-3 hours | Medium | Medium |
| Config updates | 1-2 hours | Low | Low |
| Build/Docker | 3-4 hours | Medium | High |

**Total Estimated Effort**: 17-26 hours

## Dependencies & External Services

### External Service Integration Points
1. **Shopify Admin API**: Used in products, sync routes
2. **Shopify Storefront API**: Used in frontend
3. **PostgreSQL**: Primary database via Prisma
4. **GCP Secret Manager**: Configuration and secrets
5. **Firebase**: Authentication and real-time features

### Integration Compatibility
- All external services compatible with Next.js API routes
- Shopify webhooks can target Next.js endpoints  
- Database connections work in serverless context
- GCP Secret Manager already integrated in configuration service

## Risks & Mitigation

### Technical Risks
1. **Serverless Limitations**: Connection pooling, long-running processes
2. **Authentication State**: Express sessions → Next.js session handling
3. **Background Jobs**: Sync operations may need restructuring
4. **Performance**: API route cold starts vs. persistent Express server

### Mitigation Strategies
1. **Feature Branch Development**: `task-2-consolidation` branch
2. **Incremental Migration**: Phase-by-phase validation
3. **Parallel Deployment**: Keep monorepo running during migration
4. **Comprehensive Testing**: API contracts, integration tests

## Next Steps

1. ✅ **Audit Complete**: Document findings (this document)
2. 🚀 **Begin Migration**: Start with Subtask 2.2 (API Route Migration)
3. 📋 **Create Feature Branch**: `git checkout -b task-2-consolidation`
4. 🧪 **Setup Testing**: Validate each migration phase

## Recommendations

### Proceed with Consolidation
**Rationale**: The benefits outweigh the risks
- **Simplified deployment**: Single container vs. monorepo complexity
- **Reduced build time**: Target 5 minutes vs. current 10-15 minutes
- **Easier maintenance**: Single codebase, unified dependencies
- **Better performance**: Next.js optimizations, serverless benefits

### Key Success Factors
1. **Maintain API compatibility**: Existing frontend should work unchanged
2. **Preserve security model**: GCP Secret Manager integration
3. **Validate incrementally**: Test each endpoint migration
4. **Performance monitoring**: Compare before/after metrics

---
**Audit Complete**: Ready to proceed with Subtask 2.2 (API Route Migration)  
**Confidence Level**: High (75-85% success probability)  
**Recommended Approach**: Incremental migration with thorough testing