# Local Development Setup Guide

This guide walks through setting up the Izerwaren 2.0 development environment.

## Prerequisites

✅ **Already Configured**:

- PostgreSQL database (`izerwaren_dev`)
- Prisma schema deployed
- Environment file created (`.env`)
- Core application builds successfully

## Required External Services

To enable full functionality, you need to configure these external services:

### 1. Firebase Authentication

**Purpose**: Admin portal authentication and dealer session management

**Setup Steps**:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or use existing one
3. Enable Authentication → Sign-in method → Email/Password
4. Go to Project Settings → Service accounts
5. Generate new private key (download JSON)
6. Extract values for `.env`:

```bash
# From the downloaded JSON file:
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# From Project Settings → General:
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef..."
```

### 2. Shopify Development Store

**Purpose**: Product catalog, pricing, and order management

**Setup Steps**:

1. Create [Shopify Partner Account](https://partners.shopify.com/)
2. Create development store
3. Install "Shopify GraphQL Admin API" app or create private app
4. Generate tokens with these scopes:
   - `read_products, write_products`
   - `read_customers, write_customers`
   - `read_orders, write_orders`
5. Update `.env`:

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-dev-store.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxxxxxxxxxxx"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="xxxxxxxxxxxxx"
```

## Validation & Testing

After configuring services:

```bash
# Validate complete environment
npm run test:env

# Start development server
npm run dev
```

## Quick Test Scenarios

### 1. Database Connection

```bash
npm run test:env
# Should show: Database: ✅ Ready
```

### 2. Firebase Auth (after configuration)

- Visit: `http://localhost:3000/admin/login`
- Should show Firebase login form
- Create test admin account

### 3. Shopify Integration (after configuration)

- Visit: `http://localhost:3000/admin/sync`
- Click "Sync Products" → should connect to Shopify

### 4. Health Check

- Visit: `http://localhost:3000/api/health`
- Should return JSON with service status

## Common Issues

### Database Connection Failed

```bash
# Ensure PostgreSQL is running
brew services start postgresql

# Recreate database if needed
dropdb izerwaren_dev && createdb izerwaren_dev
npm run db:push
```

### Firebase Configuration Errors

- Ensure private key includes `\n` newlines in `.env`
- Check project ID matches exactly
- Verify service account has proper permissions

### Shopify API Rate Limits

- Development stores have lower limits
- Application includes automatic throttling
- Monitor console for rate limit warnings

## Next Steps

Once environment is configured:

1. **Seed Sample Data**: Run `npm run db:seed` for test dealers
2. **Import Products**: Use admin sync to populate from JSON feed
3. **Test Admin Features**: Create dealers, manage pricing
4. **Configure Webhooks**: For automated sync (optional)

## Production Environment

This setup is for development only. Production deployment requires:

- Cloud SQL PostgreSQL instance
- Firebase project with production domain
- Shopify production store
- GCP Secret Manager for credentials

See `docs/adr/ADR-000-baseline-architecture.md` for production architecture
details.
