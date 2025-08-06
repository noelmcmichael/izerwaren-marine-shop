# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment
(CI/CD) pipeline for the Izerwaren 2.0 project.

## 🚀 Overview

The CI/CD pipeline is built using **GitHub Actions** and provides automated
testing, building, security scanning, and deployment capabilities for our
monorepo.

## 📋 Pipeline Structure

### Workflow Triggers

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches
- **Manual dispatch** (workflow_dispatch)

### Pipeline Jobs

```mermaid
graph LR
    A[Code Quality & Testing] --> B[Build & Docker Tests]
    A --> C[Security Scanning]
    A --> D[Performance Testing]
    B --> E[Deploy to Staging]
    C --> E
    E --> F[Deploy to Production]
```

## 🧪 Job Details

### 1. Code Quality & Testing

**Duration**: ~5-8 minutes

- **Environment**: Ubuntu with PostgreSQL 15
- **Node.js**: Version 18 with npm caching
- **Database**: Test database with migrations
- **Checks**:
  - ESLint code linting
  - Prettier formatting verification
  - TypeScript type checking
  - Unit and integration tests
  - Test coverage reporting

```bash
# Local equivalent
npm run ci:quality
npm run test:coverage
```

### 2. Build & Docker Tests

**Duration**: ~8-12 minutes

- **Docker Images**: Frontend and backend production builds
- **Registry**: GitHub Container Registry (ghcr.io)
- **Caching**: GitHub Actions cache for faster builds
- **Testing**: Docker Compose integration tests
- **Artifacts**: Built images pushed on main branch

```bash
# Local equivalent
npm run ci:build
./scripts/test-docker-setup.sh
```

### 3. Security Scanning

**Duration**: ~3-5 minutes

- **npm audit**: Dependency vulnerability scanning
- **TruffleHog**: Secret detection in codebase
- **CodeQL**: Static analysis security testing
- **Threshold**: High-severity vulnerabilities fail the build

```bash
# Local equivalent
npm run ci:security
```

### 4. Performance Testing

**Duration**: ~4-6 minutes **Trigger**: Pull requests only

- **Lighthouse CI**: Performance, accessibility, SEO analysis
- **Pages Tested**: Home, Products, Dealer portal
- **Thresholds**:
  - Performance: 80%
  - Accessibility: 90%
  - Best Practices: 85%
  - SEO: 80%

### 5. Deploy to Staging

**Duration**: ~2-4 minutes **Trigger**: Push to main branch only
**Environment**: Staging

- Automated deployment to staging environment
- Smoke tests against staging
- Slack notification on success/failure

### 6. Deploy to Production

**Duration**: ~3-5 minutes **Trigger**: Manual approval after staging
**Environment**: Production

- Manual approval required
- Health checks after deployment
- Rollback capability on failure
- Slack notification with deployment status

## 🔧 Configuration Files

### Workflow Files

- `.github/workflows/ci.yml`: Main CI/CD pipeline
- `.github/dependabot.yml`: Automated dependency updates
- `.github/codeql/codeql-config.yml`: Security analysis configuration

### Docker Configuration

- `docker-compose.ci.yml`: CI-specific Docker services
- Optimized for testing and validation

### Quality Configuration

- `.lighthouserc.json`: Performance testing thresholds
- ESLint, Prettier configs (inherited from development)

## 🛡️ Security Features

### Dependency Management

- **Dependabot**: Weekly automated dependency updates
- **Grouping**: Production and development dependencies separated
- **Security Updates**: High-priority security patches prioritized

### Secret Management

- **GitHub Secrets**: Sensitive data encrypted
- **Environment Variables**: Properly scoped to environments
- **Secret Scanning**: Automated detection of exposed secrets

### Access Control

- **Environment Protection**: Production requires manual approval
- **Branch Protection**: Main branch protected with required checks
- **Review Requirements**: Code review required for production

## 📊 Performance Metrics

### Build Performance

- **Total Pipeline**: ~15-25 minutes (full pipeline)
- **PR Checks**: ~10-15 minutes (quality + build + security)
- **Caching**: ~60% build time reduction with GitHub Actions cache

### Quality Gates

- **Code Coverage**: Minimum 80% (configurable)
- **Security**: Zero high-severity vulnerabilities
- **Performance**: Lighthouse scores above thresholds
- **Type Safety**: No TypeScript errors

## 🚨 Monitoring & Alerts

### Notifications

- **Slack Integration**: Deployment notifications
- **Email Alerts**: Security vulnerability notifications
- **GitHub Checks**: PR status indicators

### Metrics Tracking

- **Build Success Rate**: Target >95%
- **Deployment Frequency**: Track deployment velocity
- **Mean Time to Recovery**: Monitor incident response

## 🔄 Environments

### Development

- **Trigger**: Feature branch pushes
- **Scope**: Quality checks and testing only
- **Duration**: ~10 minutes

### Staging

- **Trigger**: Main branch pushes
- **Scope**: Full pipeline with deployment
- **URL**: `https://staging.izerwaren.com` (configured)
- **Database**: Staging PostgreSQL instance

### Production

- **Trigger**: Manual approval
- **Scope**: Production deployment with health checks
- **URL**: `https://izerwaren.com`
- **Database**: Production PostgreSQL instance

## 🛠️ Local Testing

### Test CI Pipeline Locally

```bash
# Install act (GitHub Actions local runner)
brew install act

# Run the CI pipeline locally
act -j quality

# Test specific job
act -j build
```

### Validate Docker Configuration

```bash
# Test CI Docker setup
npm run ci:test

# Test production build
npm run docker:prod
```

### Security Testing

```bash
# Run security audit
npm run ci:security

# Test for secrets (requires TruffleHog)
trufflehog git file://. --only-verified
```

## 📚 Troubleshooting

### Common Issues

**Build Failures**

```bash
# Check build logs
docker-compose -f docker-compose.ci.yml logs

# Test local build
npm run ci:build
```

**Test Failures**

```bash
# Run tests locally with same environment
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/izerwaren_test npm test

# Check test coverage
npm run test:coverage
```

**Security Scan Failures**

```bash
# Update dependencies
npm audit fix

# Check for secrets
npm run ci:security
```

### Performance Issues

**Slow Builds**

- Check GitHub Actions cache usage
- Optimize Docker layer caching
- Review dependency installation

**Test Timeouts**

- Increase test timeout values
- Optimize database test setup
- Check for resource constraints

## 🔧 Maintenance

### Weekly Tasks

- Review Dependabot PRs
- Update security configurations
- Monitor build performance metrics

### Monthly Tasks

- Review and update CI/CD configuration
- Optimize build performance
- Update documentation

### Quarterly Tasks

- Security audit of CI/CD pipeline
- Review access permissions
- Update deployment strategies

## 📞 Support

### CI/CD Issues

- **GitHub Actions**: Check workflow logs
- **Docker Issues**: Review container logs
- **Test Failures**: Check test output and coverage

### Deployment Issues

- **Staging Problems**: Check staging environment logs
- **Production Issues**: Immediate rollback if needed
- **Performance Degradation**: Monitor application metrics

### Getting Help

- **Team Lead**: Primary contact for CI/CD issues
- **DevOps Channel**: Slack channel for pipeline support
- **Documentation**: This guide and GitHub Actions docs

---

## 🎯 Future Improvements

### Planned Enhancements

- **Multi-region deployments**: Support for global deployment
- **Advanced monitoring**: APM integration for better observability
- **Progressive deployments**: Blue-green and canary deployments
- **Load testing**: Automated performance testing under load

### Integration Opportunities

- **Shopify webhooks**: CI/CD integration with Shopify updates
- **Database migrations**: Automated schema updates
- **CDN invalidation**: Automatic cache clearing on deployments
