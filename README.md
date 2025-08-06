# Izerwaren Revamp 2.0

Enterprise B2B e-commerce platform built with Next.js 14 and headless Shopify architecture, designed for modern distributors and dealers.

## 🚀 Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript 5.3
- **Styling**: TailwindCSS 3.4 with responsive design system
- **Backend**: Express.js with TypeScript, RESTful API architecture
- **Database**: PostgreSQL 15 with Prisma ORM for type-safe operations
- **E-commerce**: Headless Shopify (Admin API + Storefront API integration)
- **Authentication**: Firebase Auth with role-based access control
- **Infrastructure**: Google Cloud Platform (Cloud Run, Secret Manager)
- **Monitoring**: Comprehensive observability with Sentry and structured logging

### Core Dependencies
- **React 18.3.1** - Modern React with concurrent features
- **Next.js 14.2.31** - Full-stack React framework
- **TailwindCSS 3.4.17** - Utility-first CSS framework
- **SWR 2.3.4** - Data fetching with caching and revalidation
- **Express 4.18.2** - Web application framework
- **Prisma 5.22.0** - Next-generation ORM
- **Zod 3.25.76** - TypeScript-first schema validation

## 🛠️ Quick Start

### Prerequisites

- **Node.js 18+ LTS** - JavaScript runtime
- **npm 9+** - Package manager
- **PostgreSQL 15+** - Database server
- **Docker** (optional) - For containerized development
- **Google Cloud SDK** (optional) - For deployment

### Setup Instructions

#### Method 1: Guided Setup (Recommended for new developers)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd izerwaren-revamp-2.0
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   ```bash
   # Copy the development template
   cp .env.development.example .env.local
   
   # Edit with your actual configuration
   nano .env.local  # or your preferred editor
   ```

4. **Database setup**:
   ```bash
   # Create development database
   createdb izerwaren_dev
   createuser izerwaren_dev --pwprompt
   
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   
   🌐 Application will be available at [http://localhost:3000](http://localhost:3000)

#### Method 2: Docker Development

1. **Start with Docker Compose**:
   ```bash
   # Clone and navigate to project
   git clone <repository-url>
   cd izerwaren-revamp-2.0
   
   # Start all services (database included)
   npm run docker:dev
   ```

2. **Docker management commands**:
   ```bash
   # View service status
   npm run docker:status
   
   # View logs
   npm run docker:logs
   
   # Stop all services
   npm run docker:down
   
   # Reset and clean
   npm run docker:clean
   ```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Monitoring Dashboard**: http://localhost:3000/monitoring

### Environment Configuration

The project uses a tiered environment configuration system:

#### Development (.env.local)
```bash
# Copy development template
cp .env.development.example .env.local
```
- Local database connections
- Debug logging enabled
- Authentication bypass for testing
- Hot reload and development features

#### Production
```bash
# Production uses GCP Secret Manager
# See .env.production.example for reference
```
- Secure secret management via GCP
- SSL database connections
- Comprehensive monitoring and logging
- Rate limiting and security features

#### Testing (.env.test.local)
```bash
# Copy test template for local testing
cp .env.test.example .env.test.local
```
- In-memory or test databases
- Mock external services
- Comprehensive test logging

### Validation & Health Checks

Verify your setup with built-in validation:

```bash
# Check environment configuration
npm run validate:env

# Health check endpoints
curl http://localhost:3000/api/health

# Test core dependencies
npm run test:dependencies
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI-style testing
npm run ci:test
```

### CI/CD Pipeline

The project includes automated testing and deployment via GitHub Actions:

- **Quality Checks**: ESLint, Prettier, TypeScript, and test coverage
- **Security Scanning**: Dependency audits and secret detection
- **Docker Builds**: Automated container builds and registry pushes
- **Performance Testing**: Lighthouse CI for frontend performance
- **Deployment**: Automated staging deployment with manual production approval

```bash
# Run CI checks locally
npm run ci:quality
npm run ci:build
npm run ci:security
```

See [CI/CD Documentation](./docs/CI_CD.md) for detailed pipeline information.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── (auth)/         # Authentication pages
│   ├── dealer/         # Dealer portal
│   ├── admin/          # Admin interface
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── lib/               # Core utilities and clients
├── types/             # TypeScript type definitions
└── utils/             # Helper functions

prisma/
├── schema.prisma      # Database schema
└── migrations/        # Database migrations

docs/
├── adr/              # Architectural Decision Records
├── progress/         # Implementation roadmaps
└── archive/          # Historical documentation
```

## Key Features

### Public Shopping Experience

- Product catalog browsing via Shopify Storefront API
- Search and filtering capabilities
- Shopping cart management
- Checkout redirects to Shopify Checkout

### Dealer Portal

- Enhanced pricing with dealer-specific markdowns
- RFQ (Request for Quote) system
- Bulk order capabilities
- Order history and tracking

### Admin Interface

- Dealer management and tier assignment
- Pricing override configuration
- RFQ review and quote generation
- Product sync monitoring

## Deployment

### Development Environment

```bash
# Build and test locally
npm run build
npm start
```

### Cloud Run Deployment

The project uses blue/green deployment strategy with Cloud Build:

```bash
# Trigger build (requires GCP setup)
gcloud builds submit --config cloudbuild.yaml
```

The deployment pipeline includes:

- Dependency installation and testing
- TypeScript compilation and linting
- > 80% test coverage verification
- Docker image building
- Blue/green Cloud Run deployment
- Health check validation
- Traffic switching

## Configuration

### Environment Variables

| Variable                           | Description                  | Required |
| ---------------------------------- | ---------------------------- | -------- |
| `DATABASE_URL`                     | PostgreSQL connection string | Yes      |
| `NEXTAUTH_SECRET`                  | NextAuth.js secret key       | Yes      |
| `FIREBASE_PROJECT_ID`              | Firebase project identifier  | Yes      |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Shopify store domain         | Yes      |
| `SHOPIFY_ADMIN_ACCESS_TOKEN`       | Shopify Admin API token      | Yes      |

See `.env.example` for complete configuration reference.

### Database Schema

The application maintains a lean local schema focused on dealer-specific data:

- **Dealers**: Company information and tier assignment
- **DealerPricing**: Product-specific pricing overrides
- **RfqRequests**: Quote request management
- **Products**: Shadow table for Shopify product data (search optimization)

## Contributing

### Development Workflow

1. **Plan → Code**: Create Implementation Roadmap in `docs/progress/` before
   editing codebase
2. **Follow Constitution**: Adhere to guidelines in `rules.md`
3. **Atomic Commits**: Use Conventional Commits format
4. **Test Coverage**: Maintain >80% coverage threshold

### Code Quality

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Jest for unit and integration testing
- Prisma for type-safe database operations

## License

UNLICENSED - Proprietary software for Izerwaren business use.

---

**Status**: Phase 1 Complete (Infrastructure) | Next: Phase 2 (Data Migration &
Sync)

🤖 Generated with [Memex](https://memex.tech) Co-Authored-By: Memex
<noreply@memex.tech>
# Deployment trigger - Wed Aug  6 10:21:04 PDT 2025
