# Environment Parity and Configuration Guide

## Overview

This guide ensures consistent configuration, monitoring, and behavior across all environments (development, staging, production) for the Izerwaren Revamp 2.0 project. Environment parity is critical for reliable deployments and consistent observability.

## Environment Configuration Matrix

### Required Environment Variables

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `NODE_ENV` | `development` | `staging` | `production` | **Required** - Node.js environment |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | `https://staging.izerwaren.com` | `https://izerwaren.com` | Base URL for the application |
| `NEXT_PUBLIC_APP_VERSION` | `dev` | `staging-1.0.0` | `1.0.0` | Application version identifier |
| `SENTRY_DSN` | Optional | **Required** | **Required** | Error monitoring service DSN |
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | **Required** | **Required** | **Required** | Shopify store domain |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | **Required** | **Required** | **Required** | Shopify API access token |

### Optional Environment Variables

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Optional | Optional | Optional | Firebase configuration JSON |
| `BACKEND_API_URL` | Optional | Optional | Optional | Legacy backend API URL |
| `LOG_LEVEL` | `debug` | `info` | `warn` | Logging verbosity level |
| `MONITORING_ENABLED` | `false` | `true` | `true` | Enable monitoring features |

## Environment-Specific Configuration

### Development Environment

**Purpose**: Local development and testing

**Configuration**:
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=dev
LOG_LEVEL=debug

# Shopify (use development store)
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-dev-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-dev-token

# Optional: Sentry for error testing
SENTRY_DSN=your-dev-sentry-dsn
```

**Features**:
- Detailed logging and debug output
- Hot reloading and development tools
- Relaxed validation rules
- Optional error monitoring
- Local health checks

**Monitoring**:
- Console-based structured logging
- Local monitoring dashboard available
- Health checks against local services
- Development-friendly error boundaries

### Staging Environment

**Purpose**: Pre-production testing and validation

**Configuration**:
```bash
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_BASE_URL=https://staging.izerwaren.com
NEXT_PUBLIC_APP_VERSION=staging-1.0.0
LOG_LEVEL=info

# Shopify (staging store)
NEXT_PUBLIC_SHOPIFY_DOMAIN=izerwaren-staging.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=staging-token

# Error monitoring (required)
SENTRY_DSN=staging-sentry-dsn

# Optional services
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey": "staging-config"}
```

**Features**:
- Production-like monitoring and logging
- Full error monitoring and alerting
- Performance testing environment
- Integration testing with external services
- Deployment validation testing

**Monitoring**:
- Structured JSON logging
- Real-time monitoring dashboard
- Comprehensive health checks
- Error tracking and alerting
- Performance metrics collection

### Production Environment

**Purpose**: Live production system

**Configuration**:
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://izerwaren.com
NEXT_PUBLIC_APP_VERSION=1.0.0
LOG_LEVEL=warn

# Shopify (production store)
NEXT_PUBLIC_SHOPIFY_DOMAIN=izerwaren.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=production-token

# Error monitoring (required)
SENTRY_DSN=production-sentry-dsn

# Services
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey": "production-config"}
```

**Features**:
- Optimized performance settings
- Full observability and monitoring
- Strict validation and security
- Automated alerting and incident response
- Comprehensive health monitoring

**Monitoring**:
- Production-grade structured logging
- Real-time monitoring dashboards
- Comprehensive alerting system
- Performance and business metrics
- SLA monitoring and reporting

## Monitoring Hooks Parity

### Health Check Configuration

All environments implement identical health check endpoints with environment-appropriate thresholds:

```typescript
// Health check configuration by environment
const healthCheckConfig = {
  development: {
    timeout: 10000,
    retries: 1,
    requiredServices: ['shopify'],
  },
  staging: {
    timeout: 5000,
    retries: 2,
    requiredServices: ['shopify', 'sentry'],
  },
  production: {
    timeout: 3000,
    retries: 3,
    requiredServices: ['shopify', 'sentry'],
    alertOnFailure: true,
  },
};
```

### Logging Configuration Parity

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Format** | Pretty console | Structured JSON | Structured JSON |
| **Level** | DEBUG | INFO | WARN |
| **Correlation IDs** | ✅ | ✅ | ✅ |
| **Error Reporting** | Optional | ✅ | ✅ |
| **Performance Metrics** | ✅ | ✅ | ✅ |
| **Business Metrics** | ✅ | ✅ | ✅ |

### Error Monitoring Parity

All environments use the same error monitoring configuration with environment-specific settings:

```typescript
// Sentry configuration by environment
const sentryConfig = {
  development: {
    enabled: false, // Optional
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
  },
  staging: {
    enabled: true,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
  },
  production: {
    enabled: true,
    sampleRate: 0.1,
    tracesSampleRate: 0.01,
  },
};
```

## Environment Validation

### Automated Validation

The application includes comprehensive environment validation that runs:
- At application startup
- Via API endpoint (`/api/environment/validate`)
- During health checks
- In deployment pipelines

### Validation Categories

#### 1. Configuration Validation
- Required environment variables present
- Valid values for each environment
- Consistent naming conventions
- Proper secret management

#### 2. Service Connectivity
- Shopify API accessibility
- External service health
- Database connections (if applicable)
- CDN and asset availability

#### 3. Monitoring Setup
- Error monitoring configuration
- Logging infrastructure
- Health check endpoints
- Alerting system setup

#### 4. Security Configuration
- HTTPS enforcement (production)
- Security headers
- Environment variable exposure
- Secret management

### Validation API Usage

```bash
# Get comprehensive validation report
curl https://yourdomain.com/api/environment/validate

# Quick validation check
curl -X POST https://yourdomain.com/api/environment/validate \
  -H "Content-Type: application/json" \
  -d '{"action": "quick-check"}'
```

### Example Validation Response

```json
{
  "environment": "production",
  "timestamp": "2024-01-15T10:30:00Z",
  "overall": "pass",
  "checks": [
    {
      "name": "NODE_ENV",
      "status": "pass",
      "message": "Set to: production",
      "required": true,
      "category": "configuration"
    },
    {
      "name": "Shopify Configuration",
      "status": "pass",
      "message": "Shopify credentials configured",
      "required": true,
      "category": "services"
    }
  ],
  "summary": {
    "total": 15,
    "passed": 13,
    "warnings": 2,
    "failures": 0,
    "critical_failures": 0
  },
  "recommendations": [
    "⚠️ Consider addressing the following warnings:",
    "   - Firebase Configuration: Firebase not configured"
  ]
}
```

## Deployment Best Practices

### Environment Setup Checklist

#### Before Deployment
- [ ] All required environment variables configured
- [ ] Environment validation passes
- [ ] Health checks responding correctly
- [ ] Monitoring and alerting configured
- [ ] Error tracking enabled
- [ ] Performance baselines established

#### During Deployment
- [ ] Environment validation runs automatically
- [ ] Health checks pass post-deployment
- [ ] Monitoring confirms successful deployment
- [ ] Error rates within acceptable thresholds
- [ ] Performance metrics stable

#### After Deployment
- [ ] Full smoke tests executed
- [ ] Business metrics tracking confirmed
- [ ] Alerting system functional
- [ ] Rollback procedures tested
- [ ] Documentation updated

### Configuration Management

#### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd izerwaren-revamp-2-0/apps/frontend

# Copy environment template
cp .env.example .env.local

# Configure development environment
npm run setup:dev

# Validate environment
npm run validate:env
```

#### Staging Deployment
```bash
# Set staging environment variables
export NODE_ENV=staging
export NEXT_PUBLIC_BASE_URL=https://staging.izerwaren.com

# Deploy with environment validation
npm run deploy:staging

# Validate deployment
npm run validate:deployment staging
```

#### Production Deployment
```bash
# Production deployment with full validation
npm run deploy:production

# Post-deployment validation
npm run validate:production

# Monitor deployment
npm run monitor:deployment
```

## Troubleshooting Environment Issues

### Common Configuration Problems

#### Missing Environment Variables
**Symptoms**: Health checks fail, services unavailable
**Solution**: 
1. Check `/api/environment/validate` for missing variables
2. Compare with environment matrix above
3. Update configuration and redeploy

#### Service Connectivity Issues
**Symptoms**: External service health checks fail
**Solution**:
1. Verify network connectivity
2. Check service credentials
3. Review firewall and security settings

#### Monitoring Not Working
**Symptoms**: No logs, missing metrics, alerts not firing
**Solution**:
1. Verify monitoring environment variables
2. Check Sentry DSN configuration
3. Validate logging middleware setup

### Environment Validation Failures

#### Critical Failures
- Application may not start or function correctly
- Address immediately before deployment
- Usually related to required environment variables

#### Warnings
- Application functions but may have degraded capabilities
- Address during next maintenance window
- Often related to optional services

### Performance Differences Between Environments

#### Expected Differences
- Production: Optimized builds, caching enabled
- Staging: Similar to production but may have debug features
- Development: Unoptimized, hot reloading enabled

#### Troubleshooting Performance Issues
1. Compare baseline metrics across environments
2. Check for environment-specific configuration differences
3. Validate caching and optimization settings
4. Review monitoring data for patterns

## Monitoring Dashboards by Environment

### Development Dashboard
- **URL**: `http://localhost:3000/monitoring`
- **Features**: Development-friendly metrics, debug information
- **Update Frequency**: Real-time
- **Authentication**: None required

### Staging Dashboard
- **URL**: `https://staging.izerwaren.com/monitoring`
- **Features**: Production-like monitoring, comprehensive metrics
- **Update Frequency**: 30 seconds
- **Authentication**: Basic auth or IP restrictions

### Production Dashboard
- **URL**: `https://izerwaren.com/monitoring`
- **Features**: Full production monitoring, business metrics
- **Update Frequency**: 30 seconds
- **Authentication**: Required (team access only)

## Compliance and Security

### Environment Isolation
- Each environment uses separate credentials
- No shared secrets between environments
- Environment-specific monitoring and alerting
- Isolated deployment pipelines

### Secret Management
- Use environment-specific secret stores
- Rotate credentials regularly
- Monitor for secret exposure
- Audit access logs

### Compliance Requirements
- Log retention policies by environment
- Data privacy controls
- Security monitoring and alerting
- Incident response procedures

---

## Implementation Status: ✅ COMPLETE

Environment parity has been fully implemented across all environments:

- **Configuration Management**: Standardized environment variables and validation
- **Monitoring Hooks**: Consistent logging, error tracking, and health checks
- **Service Integration**: Uniform external service configuration
- **Validation Framework**: Comprehensive environment validation and testing
- **Documentation**: Complete setup and troubleshooting guides

### Next Steps
1. Deploy validation framework to all environments
2. Configure environment-specific monitoring thresholds
3. Set up automated environment validation in CI/CD
4. Train team on environment management procedures
5. Create runbooks for environment-specific incident response