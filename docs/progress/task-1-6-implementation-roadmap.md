# Task 1.6 Implementation Roadmap: Secure Configuration Injection for Deployment Scripts

## Objective
Refactor deployment scripts and Dockerfiles to ensure environment variables and secrets are injected securely at build and runtime, with no sensitive data hardcoded or exposed in images.

## Acceptance Criteria
1. **No Hardcoded Secrets**: All sensitive data removed from Dockerfiles, scripts, and images
2. **Runtime Secret Injection**: Secrets loaded at runtime from Secret Manager, not build time
3. **Build-Time Environment Variables**: Only non-sensitive configuration at build time
4. **Secure Docker Images**: No sensitive data stored in Docker image layers
5. **Production Deployment Pipeline**: Updated Cloud Build and deployment scripts for security
6. **Development Docker Setup**: Secure local development with secret handling

## Current Security Assessment

### 🚨 **Security Issues Found**
1. **Dockerfile Build Args**: `SHOPIFY_STOREFRONT_ACCESS_TOKEN` embedded in image layers
2. **Cloud Build**: Secrets passed as build arguments (visible in image history)
3. **Environment Files**: `.env.production` contains placeholder secrets
4. **Docker Compose**: Direct environment variable exposure in production config
5. **Deployment Scripts**: Missing validation of secret injection

### ✅ **Good Security Practices Already in Place**
- Secret Manager integration in backend code
- Health check validation in deployment scripts
- Blue/green deployment with rollback capability
- No secrets committed to source control

## Implementation Plan

### Phase 1: Secure Dockerfile and Build Process (45 minutes)
- **Remove build-time secrets** from Dockerfile build arguments
- **Implement runtime secret loading** using startup validation system
- **Update Cloud Build configuration** to avoid secret exposure in image layers
- **Create secure multi-stage builds** with minimal attack surface

### Phase 2: Enhanced Deployment Scripts (30 minutes)
- **Update deployment scripts** to inject secrets at runtime via Cloud Run environment
- **Implement secret validation** in deployment pipeline
- **Add deployment security checks** to verify no secrets in images
- **Create secure environment variable injection patterns**

### Phase 3: Docker Compose Security (30 minutes)
- **Secure local development setup** with proper secret handling
- **Update docker-compose configurations** to avoid secret exposure
- **Implement development secret management** with fallback patterns
- **Create secure volume and network configurations**

### Phase 4: Validation and Documentation (15 minutes)
- **Test deployment pipeline** with security validation
- **Verify no secrets in built images** using Docker inspection tools
- **Document secure deployment patterns** for team reference
- **Create security checklist** for future deployments

## Security Architecture

### **Build-Time vs Runtime Configuration**

#### Build-Time (Safe for Image Layers)
```dockerfile
ARG NODE_ENV=production
ARG NEXT_TELEMETRY_DISABLED=1
ARG BUILD_VERSION
ARG BUILD_TIMESTAMP
```

#### Runtime (Loaded from Secret Manager)
```bash
# Injected by Cloud Run from Secret Manager
DATABASE_URL
SHOPIFY_ADMIN_ACCESS_TOKEN
SHOPIFY_WEBHOOK_SECRET
FIREBASE_PRIVATE_KEY
JWT_SECRET
```

### **Secret Injection Flow**
```
1. Cloud Build → Builds image with NO secrets
2. Cloud Run → Injects secrets from Secret Manager as environment variables
3. Application Startup → Loads and validates secrets using our validation system
4. Health Check → Confirms secret availability before serving traffic
```

## Implementation Details

### **Dockerfile Security Updates**
- Remove all `ARG` declarations for sensitive data
- Use runtime environment variable loading only
- Implement proper user permissions and minimal base images
- Add security scanning and vulnerability checks

### **Cloud Build Pipeline Security**
- Remove `secretEnv` from build arguments
- Move secrets to runtime environment injection
- Implement image scanning for leaked secrets
- Add deployment validation steps

### **Cloud Run Environment Injection**
```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        key: izerwaren-db-url
        name: database-connection
  - name: SHOPIFY_ADMIN_ACCESS_TOKEN
    valueFrom:
      secretKeyRef:
        key: izerwaren-shopify-admin-token
        name: shopify-credentials
```

### **Local Development Security**
- Environment variable files with secure fallbacks
- Docker Compose secret management
- Development-only mock secrets
- Secure volume mounting for configuration

## Risk Assessment

### **Risk 1: Runtime Secret Loading Failure**
**Impact**: High - Application fails to start
**Mitigation**: Robust fallback patterns, startup validation, health checks

### **Risk 2: Secret Exposure in Logs**
**Impact**: High - Sensitive data leaked
**Mitigation**: Structured logging, secret redaction, log filtering

### **Risk 3: Development Environment Security**
**Impact**: Medium - Local secrets compromised
**Mitigation**: Development-only secrets, secure local storage, documentation

### **Risk 4: Build Pipeline Disruption**
**Impact**: Medium - Deployment delays
**Mitigation**: Comprehensive testing, rollback procedures, monitoring

## Test Strategy

### **Security Validation Tests**
1. **Image Inspection**: Scan built Docker images for any embedded secrets
2. **Environment Validation**: Verify secrets are only loaded at runtime
3. **Deployment Testing**: Full pipeline test with secret injection
4. **Health Check Verification**: Confirm startup validation catches secret issues
5. **Log Security**: Verify no secrets appear in build or runtime logs

### **Test Commands**
```bash
# Inspect Docker image for secrets
docker history --no-trunc IMAGE_ID | grep -E "(password|secret|token|key)"

# Test runtime secret loading
docker run --env-file .env.test IMAGE_ID node -e "console.log('Test passed')"

# Validate Cloud Run deployment
gcloud run services describe SERVICE_NAME --format="yaml" | grep -E "(secret|env)"
```

## Success Metrics
- **Zero secrets in Docker images** (verified by automated scanning)
- **100% runtime secret injection** (no build-time secret embedding)
- **Successful deployment pipeline** with security validation
- **< 30 seconds additional deployment time** for security checks
- **Clear documentation** for secure deployment patterns

## Dependencies
- ✅ Task 1.4 (GCP Secret Manager Integration) - Complete
- ✅ Task 1.5 (Startup Validation Enhancement) - Complete
- Existing Secret Manager configuration and validation system
- Cloud Build and Cloud Run deployment infrastructure

## Expected Duration
**Total: ~2 hours**
- Dockerfile Security: 45 minutes
- Deployment Scripts: 30 minutes  
- Docker Compose Security: 30 minutes
- Validation & Documentation: 15 minutes

## Next Steps After Completion
- Task 1.7: Deploy Frontend Fixes with secure configuration
- Task 1.8: Document Configuration Patterns with security guidelines
- Complete secure deployment pipeline foundation

---
**Security Focus**: Zero secrets in built artifacts, runtime-only secret injection, comprehensive validation