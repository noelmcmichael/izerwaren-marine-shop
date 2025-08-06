# Configuration Management Guide

## Overview

The Izerwaren Revamp 2.0 project implements a centralized, secure configuration management system that supports multiple environments, runtime secret injection, and comprehensive validation. This guide covers the complete configuration architecture and usage patterns.

## 🏗️ Architecture

### Configuration Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Code                         │
├─────────────────────────────────────────────────────────────┤
│              Centralized Config Service                     │
│                   (config.ts)                              │
├─────────────────────────────────────────────────────────────┤
│  Environment Variables    │    GCP Secret Manager          │
│  (.env files)            │    (Production Secrets)        │
├─────────────────────────────────────────────────────────────┤
│              Runtime Validation Layer                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend Config Service** (`apps/frontend/src/lib/config.ts`)
   - Centralized configuration management
   - Environment-aware defaults
   - Client/server configuration separation
   - Built-in validation and logging

2. **Backend Secret Manager** (`apps/backend/src/lib/secrets.ts`)
   - GCP Secret Manager integration
   - Secure credential management
   - Caching and fallback mechanisms
   - Production-grade secret handling

3. **Environment Templates** (`.env.example`, `.env.example.complete`)
   - Comprehensive configuration examples
   - Documentation-driven development
   - Environment-specific templates

## 🚀 Quick Start

### Development Setup

1. **Copy Environment Template**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Required Variables**
   ```bash
   # Minimum required for development
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-token"
   FIREBASE_PROJECT_ID="your-project"
   ```

3. **Enable Development Mode**
   ```bash
   NODE_ENV="development"
   NEXT_PUBLIC_DEV_MODE="true"
   SKIP_FIREBASE_AUTH="true"
   ```

4. **Validate Configuration**
   ```bash
   npm run validate:config
   ```

### Production Deployment

1. **Secret Manager Setup**
   ```bash
   # Create required secrets
   echo "your-db-password" | gcloud secrets create izerwaren-db-password --data-file=-
   echo "your-shopify-token" | gcloud secrets create izerwaren-shopify-admin-token --data-file=-
   echo "your-webhook-secret" | gcloud secrets create izerwaren-shopify-webhook-secret --data-file=-
   echo "your-firebase-key" | gcloud secrets create izerwaren-firebase-private-key --data-file=-
   echo "your-jwt-secret" | gcloud secrets create izerwaren-jwt-secret --data-file=-
   ```

2. **Deploy with Secure Configuration**
   ```bash
   scripts/deploy-blue-green-secure.sh
   ```

3. **Validate Deployment Security**
   ```bash
   scripts/validate-deployment-security.sh
   ```

## 📋 Configuration Reference

### Core Environment Variables

#### Application Environment
```bash
NODE_ENV="development|production|test"
NEXT_PUBLIC_ENVIRONMENT="development|staging|production"
NEXT_PUBLIC_VERSION="2.0.0"
```

#### API Configuration
```bash
# Frontend to Backend API
NEXT_PUBLIC_API_URL="/api"                    # Internal API routes
NEXT_PUBLIC_API_TIMEOUT="30000"               # Request timeout (ms)
NEXT_PUBLIC_API_RETRY_ATTEMPTS="3"            # Retry attempts

# Legacy API Integration
REVIVAL_API_BASE="http://localhost:8000"      # Development endpoint
```

#### Database Configuration
```bash
# Development (direct)
DATABASE_URL="postgresql://user:pass@host:port/db"

# Production (via Secret Manager)
# Retrieved as 'izerwaren-db-password' secret
```

#### Authentication
```bash
# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="secret"                      # Secret Manager: 'izerwaren-jwt-secret'

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID="your-project"
FIREBASE_CLIENT_EMAIL="client@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN..."         # Secret Manager: 'izerwaren-firebase-private-key'

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="app-id"
```

#### Shopify Integration
```bash
# Public Storefront API (client-side)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="token"

# Private Admin API (server-side)
SHOPIFY_SHOP_DOMAIN="store.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_token"     # Secret Manager: 'izerwaren-shopify-admin-token'
SHOPIFY_WEBHOOK_SECRET="webhook-secret"      # Secret Manager: 'izerwaren-shopify-webhook-secret'
```

### Feature Flags
```bash
FEATURE_B2B_CART="true"                      # Enable B2B cart functionality
FEATURE_BULK_ORDERING="true"                 # Enable bulk order uploads
FEATURE_ADVANCED_PRICING="true"              # Enable tier-based pricing
FEATURE_ANALYTICS="false"                    # Enable analytics tracking
```

### Development Overrides
```bash
DEV_MODE="true"                              # Global development mode
NEXT_PUBLIC_DEV_MODE="true"                  # Client-side development mode
SKIP_FIREBASE_AUTH="true"                    # Bypass authentication
MOCK_EXTERNAL_APIS="false"                   # Use mock API responses
```

## 🔒 Security Model

### Secret Management Hierarchy

1. **Production**: GCP Secret Manager (highest priority)
2. **Fallback**: Environment variables
3. **Development**: Local `.env.local` files
4. **Never**: Hardcoded values in source code

### Security Validation

The system performs comprehensive security validation:

```typescript
// Automatic validation on config import
config.validation.logValidation();

// Manual validation
const result = await config.validation.validateRequired();
if (!result.valid) {
  console.error('Missing required configuration:', result.missing);
}
```

### Secret Manager Integration

```typescript
import { secrets } from '@/lib/secrets';

// Get individual secrets
const dbPassword = await secrets.getDatabasePassword();
const shopifyToken = await secrets.getShopifyAdminToken();

// Validate all secrets
const validation = await secrets.validate();
if (!validation.valid) {
  throw new Error(`Missing secrets: ${validation.missing.join(', ')}`);
}
```

## 🛠️ Configuration Patterns

### Environment-Aware Configuration

```typescript
import { config } from '@/lib/config';

// Environment detection
if (config.isProduction) {
  // Production-specific logic
}

if (config.isDevelopment) {
  // Development-specific logic
}

// Feature flags
if (config.app.features.debugMode) {
  console.log('Debug mode enabled');
}
```

### API URL Construction

The configuration service handles API URL construction to prevent double-path issues:

```typescript
// ✅ Correct: Use helper methods
const apiUrl = config.api.baseUrl === '/api' 
  ? '/api/v1/products' 
  : `${config.api.baseUrl}/v1/products`;

// ❌ Incorrect: Manual concatenation
const apiUrl = `${config.api.baseUrl}/api/v1/products`; // Creates /api/api/v1/products
```

### Service URL Generation

```typescript
// Dynamic service URLs
const healthCheck = config.services.healthCheck;
const apiBase = config.services.apiBase;

// Production URL construction
if (config.isProduction) {
  const serviceUrl = config.services.baseUrl; // Auto-generated Cloud Run URL
}
```

### Configuration Validation

```typescript
// Startup validation
config.validation.logValidation();

// Custom validation
const isValid = config.shopify.isConfigured && config.firebase.isConfigured;
if (!isValid) {
  throw new Error('Required services not configured');
}
```

## 🧪 Testing Configuration

### Test Environment Setup

```bash
# Test-specific environment
NODE_ENV="test"
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/izerwaren_test"
USE_MOCK_SHOPIFY="true"
USE_MOCK_FIREBASE="true"
```

### Configuration Testing

```typescript
// Test configuration loading
import { config } from '@/lib/config';

describe('Configuration', () => {
  it('should load development config', () => {
    expect(config.environment).toBe('development');
    expect(config.app.features.debugMode).toBe(true);
  });
  
  it('should validate required secrets', async () => {
    const validation = await config.validation.validateRequired();
    expect(validation.valid).toBe(true);
  });
});
```

## 🔄 Deployment Patterns

### Blue-Green Deployment

```bash
# Deploy to blue slot
DEPLOYMENT_SLOT="blue" scripts/deploy-blue-green-secure.sh

# Verify deployment
scripts/validate-deployment-security.sh

# Switch traffic to blue
gcloud run services update-traffic izerwaren-frontend --to-revisions=blue=100
```

### Configuration Migration

```bash
# Update configuration
scripts/migrate-config.sh

# Validate changes
npm run test:config

# Deploy with new config
scripts/deploy-blue-green-secure.sh
```

## 🚨 Troubleshooting

### Common Issues

#### Missing Environment Variables
```bash
# Error: Missing required environment variables
# Solution: Check .env.local and ensure all required variables are set
npm run validate:config
```

#### Secret Manager Access
```bash
# Error: Failed to access Secret Manager
# Solution: Verify GCP authentication and project ID
gcloud auth application-default login
gcloud config set project your-project-id
```

#### Double API Paths
```bash
# Error: /api/api/v1/products endpoint not found
# Solution: Use configuration helpers for URL construction
const apiUrl = config.api.baseUrl === '/api' ? '/api/v1/products' : `${config.api.baseUrl}/v1/products`;
```

#### Authentication Bypass
```bash
# Development: Enable auth bypass
SKIP_FIREBASE_AUTH="true"
NEXT_PUBLIC_DEV_MODE="true"

# Production: Ensure auth is enabled
SKIP_FIREBASE_AUTH="false"
NEXT_PUBLIC_DEV_MODE="false"
```

### Debug Configuration

```typescript
// Enable debug logging
process.env.NEXT_PUBLIC_DEBUG = 'true';

// Check configuration state
console.log('Config state:', {
  environment: config.environment,
  apiBaseUrl: config.api.baseUrl,
  shopifyConfigured: config.shopify.isConfigured,
  firebaseConfigured: config.firebase.isConfigured,
  features: config.app.features
});
```

### Validation Commands

```bash
# Validate environment setup
npm run validate:env

# Validate configuration
npm run validate:config

# Test API connectivity
npm run test:api:health

# Validate deployment security
scripts/validate-deployment-security.sh
```

## 📚 Best Practices

### Configuration Management

1. **Never Hardcode Secrets**: Always use environment variables or Secret Manager
2. **Use Type-Safe Config**: Import from centralized config service
3. **Validate Early**: Check configuration on application startup
4. **Environment Isolation**: Keep development and production configs separate
5. **Documentation**: Document all configuration options

### Development Workflow

1. **Start with Templates**: Copy from `.env.example`
2. **Use Development Mode**: Enable bypass flags for local development
3. **Test Configuration**: Validate before committing changes
4. **Update Documentation**: Keep configuration docs current

### Production Deployment

1. **Use Secret Manager**: Store all sensitive data securely
2. **Validate Security**: Run security validation before deployment
3. **Monitor Configuration**: Set up alerts for configuration issues
4. **Backup Secrets**: Ensure secrets are backed up and recoverable

### Monitoring and Maintenance

1. **Configuration Drift**: Regular audits of environment consistency
2. **Secret Rotation**: Implement regular secret rotation policies
3. **Access Control**: Limit who can modify production configuration
4. **Change Tracking**: Log all configuration changes

## 🔗 Related Documentation

- [Security Guide](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: August 2025 (Task 1.8)  
**Maintainer**: Development Team  
**Review Schedule**: Monthly