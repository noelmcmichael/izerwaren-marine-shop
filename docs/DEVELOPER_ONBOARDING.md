# Developer Onboarding Checklist

## 🎯 Getting Started

This checklist will guide you through setting up the Izerwaren Revamp 2.0 development environment. Expected setup time: **20-30 minutes**.

## ✅ Prerequisites

- [ ] **Node.js 18+** installed
- [ ] **Git** configured with your credentials
- [ ] **GCP CLI** installed and authenticated (optional for development)
- [ ] **Docker** installed (optional for containerized development)

## 🚀 Environment Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd izerwaren_revamp_2_0

# Install dependencies
npm install

# Verify installation
npm run build
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration (required changes marked with TODO)
nano .env.local
```

**Required Environment Variables:**
```bash
# TODO: Set your Shopify store details
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-storefront-token"

# TODO: Set your Firebase project
FIREBASE_PROJECT_ID="your-firebase-project"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"

# Development mode (enables bypasses)
NODE_ENV="development"
NEXT_PUBLIC_DEV_MODE="true"
SKIP_FIREBASE_AUTH="true"
```

### Step 3: Validate Configuration

```bash
# Validate environment setup
npm run validate:config

# Test build
npm run build

# Start development server
npm run dev
```

**Expected Output:**
```
🔧 Configuration loaded: {
  environment: 'development',
  apiBaseUrl: '/api',
  shopifyConfigured: true,
  firebaseConfigured: true,
  features: { devMode: true, debugMode: true }
}
```

## 🏗️ Architecture Overview

### Project Structure
```
izerwaren_revamp_2_0/
├── apps/
│   ├── frontend/              # Next.js frontend application
│   └── backend/               # Express.js API server
├── packages/
│   ├── database/              # Database schemas and utilities
│   ├── shared/                # Shared types and utilities
│   └── shopify-integration/   # Shopify API integration
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Documentation
└── .taskmaster/              # Task management
```

### Configuration Architecture
```
Application Code
       ↓
Centralized Config Service (config.ts)
       ↓
Environment Variables ← → GCP Secret Manager
       ↓
Runtime Validation
```

### Key Services
- **Frontend**: Next.js 14 with App Router
- **Backend**: Express.js API with PostgreSQL
- **Shopify**: Headless commerce integration
- **Firebase**: Authentication and real-time features
- **GCP**: Cloud Run deployment with Secret Manager

## 🔧 Development Workflow

### Daily Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Storybook: http://localhost:6006

3. **Run Tests**
   ```bash
   npm run test           # Unit tests
   npm run test:e2e       # End-to-end tests
   npm run lint           # Code linting
   npm run type-check     # TypeScript validation
   ```

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - Use TypeScript for all new code
   - Follow ESLint configuration
   - Write tests for new features
   - Update documentation

3. **Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add new product filtering feature"
   git commit -m "fix: resolve API double path issue"
   git commit -m "docs: update configuration guide"
   ```

### Testing Your Changes

```bash
# Validate configuration changes
npm run validate:config

# Test API connectivity
npm run test:api:health

# Run full test suite
npm run test:all

# Test production build
npm run build
```

## 🔒 Security Guidelines

### Development Security

- [ ] **Never commit secrets**: Use `.env.local` (gitignored) for secrets
- [ ] **Use development mode**: Enable `DEV_MODE="true"` for local development
- [ ] **Mock external services**: Use mock flags when possible
- [ ] **Validate configuration**: Run validation before committing

### Code Security

```typescript
// ✅ DO: Use centralized config
import { config } from '@/lib/config';
const apiUrl = config.api.baseUrl;

// ❌ DON'T: Hardcode values
const apiUrl = 'https://api.example.com';

// ✅ DO: Check environment
if (config.isDevelopment) {
  // Development-only code
}

// ❌ DON'T: Check NODE_ENV directly
if (process.env.NODE_ENV === 'development') {
  // This works but bypasses centralized config
}
```

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** (`*.test.ts`)
   - Component logic
   - Utility functions
   - Configuration validation

2. **Integration Tests** (`*.integration.test.ts`)
   - API endpoints
   - Database operations
   - Service integrations

3. **E2E Tests** (`tests/e2e/`)
   - User workflows
   - Cross-service functionality
   - Production-like scenarios

### Running Tests

```bash
# All tests
npm run test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📚 Learning Resources

### Codebase Familiarization

1. **Start Here** (estimated reading time)
   - [ ] [Configuration Guide](./CONFIGURATION_GUIDE.md) *(15 min)*
   - [ ] [API Documentation](./API.md) *(20 min)*
   - [ ] [Component Library](../apps/frontend/src/components/README.md) *(15 min)*

2. **Core Services** *(30 min)*
   - [ ] Frontend Config: `apps/frontend/src/lib/config.ts`
   - [ ] Backend Secrets: `apps/backend/src/lib/secrets.ts`
   - [ ] Shopify Integration: `packages/shopify-integration/src/`

3. **Key Features** *(45 min)*
   - [ ] Product Catalog: `apps/frontend/src/app/catalog/`
   - [ ] B2B Cart: `apps/frontend/src/components/b2b/cart/`
   - [ ] Admin Portal: `apps/frontend/src/app/admin/`

### External Documentation

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Run](https://cloud.google.com/run/docs)

## 🚨 Common Issues & Solutions

### Environment Issues

**Problem**: Configuration validation fails
```bash
❌ Missing required environment variables: ['NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN']
```
**Solution**: 
```bash
# Check .env.local file exists and has required variables
cp .env.example .env.local
# Edit .env.local with your actual values
```

**Problem**: Build fails with import errors
```bash
Error: Cannot resolve module '@/lib/config'
```
**Solution**:
```bash
# Verify TypeScript path mapping
cat tsconfig.json | grep "paths" -A 5
# Restart TypeScript server in your editor
```

### API Issues

**Problem**: Double API path error (404 on `/api/api/v1/...`)
```bash
GET /api/api/v1/products 404 Not Found
```
**Solution**: Use configuration helpers
```typescript
// ✅ Correct
const apiUrl = config.api.baseUrl === '/api' ? '/api/v1/products' : `${config.api.baseUrl}/v1/products`;

// ❌ Incorrect
const apiUrl = `${config.api.baseUrl}/api/v1/products`;
```

**Problem**: Firebase authentication errors
```bash
Error: Firebase project not configured
```
**Solution**: Enable development mode
```bash
# In .env.local
SKIP_FIREBASE_AUTH="true"
NEXT_PUBLIC_DEV_MODE="true"
```

### Database Issues

**Problem**: Database connection refused
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Start local PostgreSQL or use development bypass
```bash
# Start PostgreSQL with Docker
docker run --name postgres-dev -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres

# Or use mock database mode
echo "USE_MOCK_DATABASE=true" >> .env.local
```

## 🎯 First Tasks for New Developers

### Beginner Tasks (1-2 hours)
- [ ] Set up development environment
- [ ] Run the application locally
- [ ] Make a small UI change (e.g., update homepage text)
- [ ] Run tests and ensure they pass

### Intermediate Tasks (2-4 hours)
- [ ] Add a new environment variable to the config system
- [ ] Create a simple API endpoint
- [ ] Write tests for your changes
- [ ] Create a pull request with your changes

### Advanced Tasks (4-8 hours)
- [ ] Implement a new product feature
- [ ] Add integration with an external service
- [ ] Optimize performance of existing feature
- [ ] Contribute to documentation

## 🔗 Getting Help

### Internal Resources
- **Task Master**: Use `.taskmaster/` for project management
- **Documentation**: Check `docs/` directory
- **Code Examples**: Look for `*.example.ts` files

### Team Communication
- **Questions**: Ask in team chat or create GitHub issues
- **Code Review**: All changes require review before merge
- **Meetings**: Weekly team sync for major decisions

### External Support
- **Shopify Partner Support**: For API issues
- **Firebase Support**: For authentication problems
- **GCP Support**: For deployment issues

---

**Welcome to the Izerwaren Revamp 2.0 team!** 

If you complete this checklist successfully, you should have a fully functional development environment and understand the core architecture. If you encounter any issues, don't hesitate to ask for help.

**Estimated Total Setup Time**: 20-30 minutes  
**Next Steps**: Review the [Configuration Guide](./CONFIGURATION_GUIDE.md) and start with your first task!

---

**Last Updated**: August 2025 (Task 1.8)  
**Maintainer**: Development Team