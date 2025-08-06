# Task 1.4 Implementation Roadmap: GCP Secret Manager Integration

## 🎯 Objective
Integrate GCP Secret Manager to securely store and retrieve sensitive configuration values (API keys, database credentials) at runtime, building on the centralized configuration service established in Task 1.3.

## ✅ Acceptance Criteria
1. **Secret Storage**: All sensitive values moved from environment files to GCP Secret Manager
2. **Runtime Integration**: Applications fetch secrets at startup using GCP client libraries
3. **Fallback Strategy**: Graceful degradation to environment variables for development
4. **Security**: No secrets in source control, logs, or environment files
5. **Performance**: Cached secret retrieval with configurable TTL
6. **Testing**: Mock secret manager for development/testing environments

## 🎯 Scope Definition
**In Scope:**
- Backend API keys (Shopify Admin API, Firebase service account)
- Database connection strings with credentials
- JWT signing keys and encryption secrets
- Webhook signing secrets
- Third-party service credentials

**Out of Scope:**
- Public configuration (frontend environment variables)
- Non-sensitive settings (timeouts, feature flags)
- Secrets rotation automation (future enhancement)

## 🔧 Technical Implementation Plan

### Phase 1: GCP Secret Manager Setup
1. **Enable Secret Manager API** in project
2. **Create secrets** for identified sensitive values
3. **Configure IAM permissions** for service accounts
4. **Test secret access** from Cloud Run environment

### Phase 2: Backend Integration
1. **Install dependencies**: `@google-cloud/secret-manager`
2. **Create secret service**: `apps/backend/src/lib/secrets.ts`
3. **Update config service**: Integrate secret fetching into configuration
4. **Implement caching**: In-memory cache with configurable TTL

### Phase 3: Frontend Integration (if needed)
1. **Identify frontend secrets**: Server-side rendering scenarios
2. **Implement secret injection**: At build time for static values
3. **Create build-time fetching**: Secure secret retrieval during deployment

### Phase 4: Development Experience
1. **Mock secret manager**: For local development
2. **Environment detection**: Automatic fallback to .env files
3. **Development tooling**: Scripts for secret management

## ⚠️ Risk Assessment

### **High Risk:**
- **Cold Start Latency**: Secret fetching during Cloud Run cold starts
  - *Mitigation*: Implement aggressive caching and background refresh

### **Medium Risk:** 
- **Development Complexity**: Additional setup for local development
  - *Mitigation*: Automatic fallback to environment variables

### **Low Risk:**
- **IAM Configuration**: Service account permissions
  - *Mitigation*: Follow least-privilege principles, document setup

## 🧪 Test Hooks

### **Unit Tests:**
- Secret service initialization and caching
- Configuration integration with secrets
- Fallback behavior testing

### **Integration Tests:**
- Mock Secret Manager in test environment
- End-to-end configuration loading
- Error handling for secret retrieval failures

### **Production Validation:**
- Health check includes secret availability
- Startup validation ensures required secrets loaded
- Performance monitoring for secret fetch times

## 📊 Success Metrics
- **Security**: Zero secrets in source control or logs
- **Performance**: Secret fetch time < 100ms (cached)
- **Reliability**: 99.9% secret retrieval success rate
- **Developer Experience**: Local development works without GCP setup

## 🚀 Implementation Timeline
- **Phase 1**: GCP Setup (30 min)
- **Phase 2**: Backend Integration (90 min) 
- **Phase 3**: Frontend Integration (60 min)
- **Phase 4**: Development Experience (60 min)
- **Total Estimated**: 4 hours

## 📝 Definition of Done
- [ ] All sensitive configuration moved to Secret Manager
- [ ] Backend retrieves secrets at startup with caching
- [ ] Local development works with environment variable fallback
- [ ] No secrets in source control or application logs
- [ ] Health checks validate secret availability
- [ ] Performance monitoring in place
- [ ] Documentation updated with secret management guide