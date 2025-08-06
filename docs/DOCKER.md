# Docker Development Guide

This guide covers running the Izerwaren 2.0 application using Docker for
consistent development environments.

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** v2.0+ (included with Docker Desktop)
- **Git** for cloning the repository

### Start Development Environment

```bash
# Clone and enter project
git clone <repository-url>
cd izerwaren_revamp_2_0

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **PgAdmin** (optional): http://localhost:8080

## 📁 Service Architecture

### Services Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │    PgAdmin      │
                       │   (Optional)    │
                       │   Port: 8080    │
                       └─────────────────┘
```

### Development Features

- **Hot Reload**: Code changes automatically reflected
- **Database Persistence**: Data preserved between container restarts
- **Source Mounting**: Live editing without rebuilds
- **Health Checks**: Automatic service dependency management

## 🛠️ Development Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart frontend

# View service logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend npm run lint
docker-compose exec database psql -U postgres -d izerwaren_dev
```

### Database Operations

```bash
# Run Prisma migrations
docker-compose exec backend npm run db:migrate

# Seed database
docker-compose exec backend npm run db:seed

# Reset database
docker-compose exec backend npm run db:reset

# Database status
docker-compose exec backend npm run db:status
```

### Development Workflow

```bash
# Install new npm package
docker-compose exec frontend npm install <package>
docker-compose exec backend npm install <package>

# Run tests
docker-compose exec backend npm test
docker-compose exec frontend npm test

# Code quality checks
docker-compose exec backend npm run lint
docker-compose exec frontend npm run lint
```

## 🔧 Configuration

### Environment Variables

The application uses environment-specific configurations:

**Development** (automatic):

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@database:5432/izerwaren_dev
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Custom Environment**: Create `.env.local` file in project root:

```bash
# Override any development settings
NEXT_PUBLIC_CUSTOM_SETTING=value
DEBUG=izerwaren:*
```

### Service Customization

**Frontend Port Change**:

```yaml
# docker-compose.override.yml
services:
  frontend:
    ports:
      - '3010:3000' # Use port 3010 instead
```

**Backend Debugging**:

```yaml
services:
  backend:
    ports:
      - '3001:3001'
      - '9229:9229' # Node.js debugger port
    command: ['npm', 'run', 'dev:debug']
```

## 📊 Production Deployment

### Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Configuration

- **Optimized Images**: Multi-stage builds with minimal layers
- **Security**: Non-root users, restricted network access
- **Performance**: Built assets, no source mounting
- **Monitoring**: Health checks and restart policies

## 🔍 Debugging

### Common Issues

**Port Already in Use**:

```bash
# Check which process is using port
lsof -i :3000
lsof -i :3001

# Kill process or change port in docker-compose.yml
```

**Database Connection Failed**:

```bash
# Check database health
docker-compose exec database pg_isready -U postgres

# View database logs
docker-compose logs database

# Reset database container
docker-compose down
docker volume rm izerwaren_postgres_data
docker-compose up -d database
```

**Frontend/Backend Not Updating**:

```bash
# Clear Docker build cache
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Container Inspection

```bash
# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check container resources
docker stats

# Inspect container configuration
docker-compose exec backend env
docker inspect izerwaren-backend
```

## 📈 Performance Tips

### Development Optimization

- **Named Volumes**: Used for node_modules to improve performance
- **Bind Mounts**: Only for source code that needs hot reload
- **Build Context**: Optimized .dockerignore to reduce build time
- **Layer Caching**: Multi-stage builds to maximize layer reuse

### macOS Performance

```yaml
# For better performance on macOS, use cached or delegated mounts
volumes:
  - ./apps/frontend:/app/apps/frontend:cached
  - ./packages:/app/packages:cached
```

### Memory Management

```yaml
# Limit container memory if needed
services:
  frontend:
    mem_limit: 1g
  backend:
    mem_limit: 512m
```

## 🧪 Testing

### Test Database

Tests automatically use the `izerwaren_test` database:

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test

# Run integration tests
docker-compose exec backend npm run test:integration
```

### Test Environment

```bash
# Start test-specific services
docker-compose -f docker-compose.test.yml up -d

# Clean test data
docker-compose exec backend npm run test:clean
```

## 🔐 Security Considerations

### Development Security

- **Default Passwords**: Only for development, never in production
- **Network Isolation**: Services communicate via internal network
- **Volume Permissions**: Proper user mapping for file access

### Production Security

- **Environment Secrets**: Use Docker secrets or external secret management
- **Non-Root Users**: All services run as non-root users
- **Network Security**: Restricted external access
- **Image Scanning**: Regular security scans for base images

## 📚 Additional Resources

- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Next.js Dockerization**: https://nextjs.org/docs/deployment#docker-image
- **Node.js Best Practices**:
  https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- **PostgreSQL Docker**: https://hub.docker.com/_/postgres

## 🤝 Team Workflow

### Onboarding New Developers

1. Install Docker Desktop
2. Clone repository
3. Run `docker-compose up -d`
4. Access http://localhost:3000

### Sharing Configuration

- **docker-compose.override.yml**: Personal development overrides (git-ignored)
- **docker-compose.yml**: Shared team configuration (git-tracked)
- **.env.local**: Personal environment variables (git-ignored)

### CI/CD Integration

```yaml
# .github/workflows/docker.yml
name: Docker Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build services
        run: docker-compose build
      - name: Run tests
        run: docker-compose run --rm backend npm test
```

---

## 🆘 Need Help?

- **Documentation**: Check `/docs` directory for detailed guides
- **Issues**: Create GitHub issue with `docker` label
- **Team Chat**: Reach out in development Slack channel
- **Docker Support**: https://docs.docker.com/get-support/
