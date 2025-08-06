# Task 26.4: Blue-Green Deployment Infrastructure - Implementation Roadmap

**Date**: 2025-01-30  
**Task ID**: 26.4  
**Status**: IN PROGRESS  
**Parent Task**: 26 - Deploy Izerwaren Revamp 2.0 to Production

## 🎯 Objective

Implement blue-green deployment infrastructure for zero-downtime deployments
using Cloud Run traffic splitting, automated health checks, monitoring
dashboards, and rollback procedures for the Izerwaren Revamp 2.0 production
environment.

## ✅ Acceptance Criteria

### Blue-Green Infrastructure

- [ ] Create dual Cloud Run service configuration (blue/green environments)
- [ ] Configure Cloud Run traffic splitting (100% blue, 0% green initially)
- [ ] Implement automated health check endpoints (/health, /readiness)
- [ ] Set up Cloud Load Balancer for traffic management

### Monitoring & Health Checks

- [ ] Create Cloud Monitoring dashboard for deployment metrics
- [ ] Configure health check monitoring with alerting
- [ ] Set up real-time traffic distribution monitoring
- [ ] Implement SLI/SLO tracking for deployments

### Automation & Rollback

- [ ] Implement automated rollback on health check failures
- [ ] Create traffic migration scripts (10%, 25%, 50%, 75%, 100%)
- [ ] Set up deployment status notifications
- [ ] Document step-by-step migration procedures

## ⚠️ Risks & Mitigation

| Risk                             | Impact | Probability | Mitigation                                                   |
| -------------------------------- | ------ | ----------- | ------------------------------------------------------------ |
| **Traffic split failure**        | High   | Low         | Test traffic splitting in staging, implement manual override |
| **Health check false positives** | Medium | Medium      | Use multiple health indicators, implement retry logic        |
| **Rollback automation failure**  | High   | Low         | Manual rollback procedures documented, monitoring alerts     |
| **Load balancer configuration**  | Medium | Low         | Validate LB config, test with synthetic traffic              |

## 🧪 Test Hooks

### Health Check Validation

```bash
# Test health endpoints
curl -f https://izerwaren.mcmichaelbuild.com/api/health
curl -f https://izerwaren.mcmichaelbuild.com/api/health/database
curl -f https://izerwaren.mcmichaelbuild.com/api/health/readiness
```

### Traffic Split Testing

```bash
# Monitor traffic distribution
gcloud run services describe izerwaren-revamp-2-0-web --region=us-central1 \
  --format="value(status.traffic[].percent,status.traffic[].revisionName)"
```

### Rollback Testing

```bash
# Test immediate rollback
gcloud run services update-traffic izerwaren-revamp-2-0-web \
  --region=us-central1 \
  --to-latest=0 \
  --to-revisions=PREVIOUS_REVISION=100
```

## 📋 Implementation Steps

### Phase 1: Health Check Endpoints (15 minutes)

1. **Create Health Check API Routes**

   ```bash
   # Create health check endpoints in Next.js app
   # /api/health - Basic service health
   # /api/health/database - Database connectivity
   # /api/health/readiness - Full readiness check
   ```

2. **Test Health Endpoints Locally**
   ```bash
   npm run dev
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/health/database
   curl http://localhost:3000/api/health/readiness
   ```

### Phase 2: Cloud Run Service Configuration (20 minutes)

1. **Update Cloud Run Service for Blue-Green**

   ```bash
   # Configure service with blue-green metadata
   gcloud run services update izerwaren-revamp-2-0-web \
     --region=us-central1 \
     --tag=blue \
     --no-traffic
   ```

2. **Create Traffic Management Scripts**
   - `scripts/deployment/traffic-split.sh` - Gradual traffic migration
   - `scripts/deployment/rollback.sh` - Immediate rollback
   - `scripts/deployment/health-check.sh` - Health validation

### Phase 3: Cloud Load Balancer Setup (25 minutes)

1. **Configure Global Load Balancer**

   ```bash
   # Create load balancer for custom domain
   # Configure backend services for blue-green
   # Set up health checks at load balancer level
   ```

2. **Domain Mapping Configuration**
   ```bash
   gcloud run domain-mappings create \
     --service=izerwaren-revamp-2-0-web \
     --domain=izerwaren.mcmichaelbuild.com \
     --region=us-central1
   ```

### Phase 4: Monitoring Dashboard (20 minutes)

1. **Create Cloud Monitoring Dashboard**
   - Service latency and error rates
   - Traffic distribution percentages
   - Health check status
   - Resource utilization

2. **Set Up Alerting Policies**
   ```bash
   # Configure alerts for:
   # - Health check failures (>2 consecutive)
   # - Error rate >1% for >2 minutes
   # - Latency >500ms p95 for >2 minutes
   ```

### Phase 5: Deployment Automation (30 minutes)

1. **Update GitHub Actions Workflow**
   - Integrate blue-green deployment logic
   - Add health check validation steps
   - Implement automatic rollback triggers

2. **Create Deployment Scripts**
   - `deploy-blue-green.sh` - Main deployment script
   - `validate-deployment.sh` - Post-deployment checks
   - `monitor-migration.sh` - Traffic migration monitoring

## 📊 Success Metrics

- **Zero Downtime**: 100% uptime during deployments
- **Health Check Response**: <100ms for health endpoints
- **Traffic Migration**: Smooth 10% → 25% → 50% → 75% → 100% progression
- **Rollback Speed**: <30 seconds to complete rollback
- **Deployment Success Rate**: >99% successful deployments

## 🔗 Related Resources

- **Deployment Scripts**: `scripts/deployment/`
- **Health Check API**: `apps/web/pages/api/health/`
- **GitHub Workflow**: `.github/workflows/deploy-production-revamp-2-0.yml`
- **Cloud Run Service**: `izerwaren-revamp-2-0-web`
- **Load Balancer**: To be created - `izerwaren-revamp-2-0-lb`

## 📝 Implementation Notes

- **Current Status**: Single Cloud Run service deployed, needs blue-green
  configuration
- **Health Check Strategy**: Multi-tier checks (service → database → external
  APIs)
- **Traffic Split Strategy**: Conservative progression with validation at each
  step
- **Rollback Triggers**: Health check failures, error rate thresholds, manual
  intervention

---

**Next Actions**: Implement health check endpoints, configure Cloud Run for
blue-green, set up load balancer and traffic management.
