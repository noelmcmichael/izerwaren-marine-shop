# Environment Management Guide

This guide explains how to manage environment variables and configuration across different environments in the Izerwaren Revamp 2.0 project.

## Table of Contents
- [Environment Strategy](#environment-strategy)
- [Configuration Files](#configuration-files)
- [Environment Variables Reference](#environment-variables-reference)
- [Security Best Practices](#security-best-practices)
- [Deployment Configuration](#deployment-configuration)
- [Troubleshooting](#troubleshooting)

## Environment Strategy

The project uses a tiered environment configuration system:

### Environment Hierarchy
1. **Development** - Local development with debug features
2. **Test** - Testing and CI/CD with mocked services
3. **Staging** - Production-like environment for validation
4. **Production** - Live environment with full security

### Configuration Sources
1. **Environment Files** - `.env.*` files for development
2. **GCP Secret Manager** - Secure storage for production secrets
3. **Cloud Run Environment** - Auto-populated service variables
4. **Runtime Configuration** - Dynamic configuration service

## Configuration Files

### Template Files (Repository)
```
.env.example                    # Complete template with all variables
.env.development.example        # Development-optimized template
.env.production.example         # Production template (placeholder values)
.env.test.example              # Testing template
apps/frontend/.env.example     # Frontend-specific variables
apps/backend/.env.example      # Backend-specific variables
```

### Active Files (Local Development)
```
.env.local                     # Your local development config (gitignored)
.env.test.local               # Local testing config (gitignored)
.env.production.local         # Local production testing (gitignored)
```

### Environment Loading Order
Next.js loads environment variables in this order (later files override earlier):
1. `.env.local` (always loaded except on test)
2. `.env.development`, `.env.production`, or `.env.test` (based on NODE_ENV)
3. `.env`

## Environment Variables Reference

### Core Environment Variables

#### Application Configuration
```bash
NODE_ENV                       # Application environment: development, production, test
NEXT_PUBLIC_ENVIRONMENT        # Client-side environment identifier
NEXT_PUBLIC_VERSION           # Application version
NEXT_PUBLIC_DEBUG             # Enable debug logging (boolean)
DEV_MODE                      # Development mode flag (boolean)
```

#### API Configuration
```bash
NEXT_PUBLIC_API_URL           # API endpoint for client-side requests
NEXT_PUBLIC_BASE_URL          # Application base URL
BASE_URL                      # Server-side base URL
PORT                          # Server port (default: 3000 dev, 8080 prod)
HOST                          # Server host (default: localhost)
```

#### Database Configuration
```bash
DATABASE_URL                  # PostgreSQL connection string
DB_HOST                       # Database host
DB_PORT                       # Database port
DB_NAME                       # Database name
DB_USER                       # Database user
DB_PASSWORD                   # Database password
DB_SSL                        # Enable SSL (boolean)
DB_CONNECTION_TIMEOUT         # Connection timeout (ms)
DB_MAX_CONNECTIONS           # Maximum connections in pool
```

### Authentication & Security

#### JWT Configuration
```bash
JWT_SECRET                    # JWT signing secret (min 32 chars)
JWT_EXPIRES_IN               # Token expiration (e.g., "24h")
```

#### Firebase Authentication
```bash
# Server-side Firebase Admin SDK
FIREBASE_PROJECT_ID          # Firebase project ID
FIREBASE_CLIENT_EMAIL        # Service account email
FIREBASE_PRIVATE_KEY         # Service account private key

# Client-side Firebase SDK (NEXT_PUBLIC_ variables)
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Configuration options
SKIP_FIREBASE_AUTH           # Skip Firebase initialization (development)
```

### E-commerce Integration

#### Shopify Configuration
```bash
# Client-side Storefront API (NEXT_PUBLIC_ variables)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN          # Store domain
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN  # Storefront API token

# Server-side Admin API
SHOPIFY_SHOP_DOMAIN          # Store domain (matches public)
SHOPIFY_ADMIN_ACCESS_TOKEN   # Admin API token
SHOPIFY_WEBHOOK_SECRET       # Webhook signature secret

# API Configuration
SHOPIFY_API_VERSION          # API version (e.g., "2024-01")
SHOPIFY_MAX_RETRIES         # Retry attempts
SHOPIFY_RETRY_DELAY         # Retry delay (ms)
```

### Monitoring & Observability

#### Error Monitoring (Sentry)
```bash
SENTRY_DSN                   # Server-side Sentry DSN
NEXT_PUBLIC_SENTRY_DSN      # Client-side Sentry DSN
SENTRY_ORG                  # Sentry organization
SENTRY_PROJECT              # Sentry project
SENTRY_RELEASE              # Release identifier
```

#### Logging Configuration
```bash
LOG_LEVEL                   # Log level: error, warn, info, debug, trace
LOG_FORMAT                  # Log format: combined, common, dev, short, tiny
ENABLE_REQUEST_LOGGING      # Enable HTTP request logging (boolean)
LOG_REQUEST_BODY           # Log request bodies (boolean, security risk)
ENABLE_ERROR_TRACKING      # Enable error tracking (boolean)
```

### Cloud Services

#### Google Cloud Platform
```bash
GOOGLE_CLOUD_PROJECT        # GCP project ID
USE_SECRET_MANAGER         # Enable Secret Manager (boolean)
```

#### Cloud Run (Auto-populated in production)
```bash
SERVICE_NAME               # Service name
SERVICE_VERSION           # Service version
CLOUD_RUN_SERVICE_ID      # Service ID (auto-generated)
CLOUD_RUN_REGION         # Deployment region
CLOUD_TRACE_CONTEXT      # Trace context (auto-populated)
```

### Security & Performance

#### Rate Limiting
```bash
RATE_LIMIT_MAX_REQUESTS    # Max requests per window
RATE_LIMIT_WINDOW_MS      # Rate limit window (ms)
```

#### CORS Configuration
```bash
CORS_ORIGINS              # Allowed CORS origins (comma-separated)
```

#### File Upload
```bash
MAX_UPLOAD_SIZE           # Maximum file upload size (bytes)
ALLOWED_IMAGE_TYPES       # Supported image formats (comma-separated)
BODY_LIMIT               # Request body size limit
```

## Security Best Practices

### Development Environment
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Never commit real secrets to git
- ✅ Use development databases and test API keys
- ✅ Enable debug logging for troubleshooting

### Production Environment
- ✅ Store all secrets in GCP Secret Manager
- ✅ Use SSL for all database connections
- ✅ Restrict CORS origins to production domains
- ✅ Enable comprehensive logging and monitoring
- ✅ Use strong JWT secrets (32+ characters)
- ❌ Never include sensitive data in environment files

### NEXT_PUBLIC_ Variables Security
Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser:

#### Safe for NEXT_PUBLIC_:
- ✅ Firebase client configuration
- ✅ Shopify Storefront API tokens
- ✅ Public API endpoints
- ✅ Application version and environment
- ✅ Feature flags for UI

#### Never use NEXT_PUBLIC_ for:
- ❌ Database passwords
- ❌ API secrets or private keys
- ❌ Admin access tokens
- ❌ Private Firebase configuration
- ❌ Server-side only secrets

## Deployment Configuration

### Development Setup
```bash
# Copy development template
cp .env.development.example .env.local

# Edit configuration
nano .env.local

# Key settings for development:
NODE_ENV="development"
NEXT_PUBLIC_DEBUG="true"
SKIP_FIREBASE_AUTH="true"  # Skip auth for easier testing
LOG_LEVEL="debug"
```

### Testing Setup
```bash
# Copy test template
cp .env.test.example .env.test.local

# Key settings for testing:
NODE_ENV="test"
USE_MOCK_SHOPIFY="true"
USE_MOCK_FIREBASE="true"
DATABASE_URL="postgresql://test:test@localhost:5432/izerwaren_test"
```

### Production Configuration
Production environment variables are managed through:

1. **GCP Secret Manager** - For sensitive values
2. **Cloud Run Environment Variables** - For non-sensitive configuration
3. **Service Discovery** - For auto-configured URLs

#### Secret Manager Configuration
```bash
# Create secrets in GCP Secret Manager:
gcloud secrets create izerwaren-db-connection --data-file=db-connection.txt
gcloud secrets create izerwaren-jwt-secret --data-file=jwt-secret.txt
gcloud secrets create izerwaren-firebase-private-key --data-file=firebase-key.txt
gcloud secrets create izerwaren-shopify-admin-token --data-file=shopify-token.txt
```

## Environment Validation

### Built-in Validation
The application includes environment validation:

```bash
# Check environment configuration
npm run validate:env

# View environment health
curl http://localhost:3000/api/environment/validate

# View full health status
curl http://localhost:3000/api/health
```

### Manual Validation
```bash
# Check required variables are set
echo $DATABASE_URL
echo $NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN

# Test database connection
npm run db:status

# Test external services
curl -s http://localhost:3000/api/health/deep | jq
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check file exists and is named correctly
ls -la .env*

# Verify NODE_ENV setting
echo $NODE_ENV

# Check Next.js environment loading
npm run dev -- --debug
```

#### 2. Database Connection Issues
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection manually
psql "$DATABASE_URL"

# Check database is running
pg_isready
```

#### 3. NEXT_PUBLIC_ Variables Not Available
```bash
# Verify prefix is correct
grep "NEXT_PUBLIC_" .env.local

# Check browser console for variables
# In browser: console.log(process.env.NEXT_PUBLIC_API_URL)

# Restart development server after changes
npm run dev
```

#### 4. Secret Manager Access Issues (Production)
```bash
# Check GCP authentication
gcloud auth list

# Test secret access
gcloud secrets access latest --secret="izerwaren-db-connection"

# Check IAM permissions
gcloud projects get-iam-policy $GOOGLE_CLOUD_PROJECT
```

### Environment Debugging

#### Development Debugging
```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev

# Check configuration service
curl http://localhost:3000/api/environment/validate

# View startup logs
npm run dev 2>&1 | grep -i config
```

#### Production Debugging
```bash
# Check Cloud Run environment
gcloud run services describe izerwaren-frontend --region=us-central1

# View service logs
gcloud logs read "resource.type=cloud_run_revision" --limit=50

# Check secret access
gcloud secrets access latest --secret="izerwaren-db-connection"
```

## Configuration Service

The project includes a centralized configuration service at `src/lib/config.ts`:

### Features
- Environment-aware configuration
- Validation and fallbacks
- Type-safe configuration access
- Runtime validation
- Development debugging

### Usage
```typescript
import config from '@/lib/config';

// Access configuration
const apiUrl = config.api.baseUrl;
const isProduction = config.isProduction;

// Validate configuration
const validation = config.validation.validateRequired();
if (!validation.valid) {
  console.error('Missing required config:', validation.missing);
}
```

---

*For specific setup instructions, see [SETUP.md](./SETUP.md). For deployment procedures, see [deployment documentation](./CI_CD.md).*