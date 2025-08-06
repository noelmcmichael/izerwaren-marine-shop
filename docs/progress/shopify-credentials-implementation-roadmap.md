# Shopify Credentials Implementation Roadmap

## Objective

Implement proper build-time configuration for Shopify credentials to enable
production connection to real store data while maintaining best practices and
deployment sustainability.

## Acceptance Criteria

- [ ] Frontend connects to real Shopify store (izerw-marine.myshopify.com)
- [ ] Credentials properly configured at build time using Docker ARG
- [ ] Environment variables properly passed through Cloud Build
- [ ] Fallback system remains intact
- [ ] Future deployments work without manual intervention
- [ ] Security best practices maintained

## Current State Analysis

### ✅ What's Working

- Shopify store verified: 956 products accessible
- Frontend with mock data fallback system
- Cloud Run deployment infrastructure
- Verified working credentials

### ❌ What's Broken

- Docker image built with placeholder tokens
- `NEXT_PUBLIC_` variables can't be overridden at runtime
- Frontend shows "credentials not configured" despite Cloud Run env vars

### 🔍 Root Cause

- Next.js bakes `NEXT_PUBLIC_` variables into JavaScript bundle at build time
- Cloud Run environment variables cannot override build-time configuration
- Current Docker build uses placeholder values

## Implementation Approaches

### Option A: Docker ARG Build-Time Configuration (RECOMMENDED)

**Modify Dockerfile to accept credentials as build arguments**

**Pros:**

- ✅ Standard Next.js/Docker practice
- ✅ Credentials baked in at build time (secure)
- ✅ No runtime complexity
- ✅ Sustainable for future deployments

**Cons:**

- 🔄 Requires rebuild for credential changes
- 🔄 Need to update Cloud Build configuration

**Technical Changes Required:**

1. Update Dockerfile with ARG statements
2. Modify Cloud Build to pass secrets as build args
3. Update environment variable handling

### Option B: Runtime Configuration API (NOT RECOMMENDED)

**Create server-side API to provide credentials at runtime**

**Pros:**

- ✅ Works with existing Docker image
- ✅ Runtime configurable

**Cons:**

- ❌ Against Next.js best practices
- ❌ Adds unnecessary complexity
- ❌ Potential security implications
- ❌ Non-standard architecture

### Option C: Hybrid Build System (COMPLEX)

**Build different images for different environments**

**Pros:**

- ✅ Maximum flexibility
- ✅ Environment-specific optimization

**Cons:**

- ❌ Complex CI/CD pipeline
- ❌ Multiple image maintenance
- ❌ Overkill for current needs

## Recommended Implementation: Option A

### Phase 1: Dockerfile Modification

```dockerfile
# Add build arguments for Shopify credentials
ARG SHOPIFY_STORE_DOMAIN
ARG SHOPIFY_STOREFRONT_ACCESS_TOKEN

# Set environment variables from build args
ENV NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=$SHOPIFY_STORE_DOMAIN
ENV NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=$SHOPIFY_STOREFRONT_ACCESS_TOKEN
```

### Phase 2: Cloud Build Configuration

```yaml
# Update cloudbuild.yaml to pass secrets as build args
args:
  - 'build'
  - '--build-arg'
  - 'SHOPIFY_STORE_DOMAIN=${_SHOPIFY_STORE_DOMAIN}'
  - '--build-arg'
  - 'SHOPIFY_STOREFRONT_ACCESS_TOKEN=${_SHOPIFY_STOREFRONT_ACCESS_TOKEN}'
```

### Phase 3: Secret Manager Integration

```yaml
# Configure substitutions from Secret Manager
substitutions:
  _SHOPIFY_STORE_DOMAIN: '${_SHOPIFY_STORE_DOMAIN}'
  _SHOPIFY_STOREFRONT_ACCESS_TOKEN: '${_SHOPIFY_STOREFRONT_ACCESS_TOKEN}'
```

## Risk Assessment

### Low Risks ✅

- Build process modifications (reversible)
- Dockerfile updates (standard practice)
- Cloud Build configuration changes

### Medium Risks ⚠️

- Secret Manager configuration
- Build-time credential exposure (mitigated by proper secret handling)
- CI/CD pipeline changes

### High Risks ❌

- None identified with Option A approach

## Test Hooks

### Build Verification

- [ ] Docker build completes with credentials
- [ ] Environment variables properly set in container
- [ ] Frontend can access Shopify API during build

### Deployment Verification

- [ ] Cloud Build passes secrets correctly
- [ ] Container starts successfully
- [ ] Frontend connects to real Shopify store
- [ ] 956 products visible in production
- [ ] Fallback system still functional

### Security Verification

- [ ] Credentials not exposed in logs
- [ ] Build args handled securely
- [ ] Secret Manager access properly configured

## Implementation Timeline

1. **Phase 1** (30 min): Dockerfile modifications
2. **Phase 2** (20 min): Cloud Build configuration
3. **Phase 3** (20 min): Secret Manager setup
4. **Testing** (30 min): End-to-end verification
5. **Deployment** (15 min): Production rollout

**Total Estimated Time: 2 hours**

## Future Deployment Process

### Standard Workflow (Post-Implementation)

1. Code changes pushed to repository
2. Cloud Build automatically triggered
3. Secrets retrieved from Secret Manager
4. Docker image built with real credentials
5. Deployed to Cloud Run
6. **No manual intervention required**

### Credential Updates

1. Update Secret Manager values
2. Trigger new build (rebuild required)
3. Deploy updated image

**This is standard practice and sustainable long-term.**

## Notes

- Shopify Storefront Access Tokens are designed to be public
- Using `NEXT_PUBLIC_` variables is the correct approach
- Build-time configuration is industry standard for this use case
- Current architecture is sound, only build process needs adjustment
