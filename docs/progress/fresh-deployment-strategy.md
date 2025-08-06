# Fresh GCP Deployment Strategy - Izerwaren Revamp 2.0

## 🚨 **Critical Decision: New Infrastructure Only**

**IMPORTANT**: We discovered existing `izerwaren-revival` infrastructure in the
GCP project. To avoid any conflicts or confusion, we are creating completely NEW
infrastructure with distinct naming for this `izerwaren_revamp_2_0` project.

## 🏗️ **New Infrastructure Naming Convention**

### **Service Names**

- **Frontend**: `izerwaren-revamp-2-0-web`
- **Backend**: `izerwaren-revamp-2-0-api`
- **Database**: `izerwaren-revamp-2-0-db`

### **Service Accounts**

- **Main Service Account**:
  `izerwaren-revamp-2-0-sa@noelmc.iam.gserviceaccount.com`
- **Cloud Run Service Account**:
  `izerwaren-revamp-2-0-run@noelmc.iam.gserviceaccount.com`

### **Container Images**

- **Frontend**: `gcr.io/noelmc/izerwaren-revamp-2-0-web:latest`
- **Backend**: `gcr.io/noelmc/izerwaren-revamp-2-0-api:latest`

### **Network Resources**

- **VPC Connector**: `izerwaren-revamp-2-0-vpc`
- **Load Balancer**: `izerwaren-revamp-2-0-lb`
- **SSL Certificate**: `izerwaren-revamp-2-0-ssl-cert`

## 📋 **Existing Infrastructure Assessment**

### **What Exists (DO NOT TOUCH)**

```
✅ izerwaren-revival          (old frontend - leave untouched)
✅ izerwaren-api             (old backend - leave untouched)
✅ izerwaren-revival-dev-db  (old database - leave untouched)
```

### **What We Need to Create (NEW)**

```
🆕 izerwaren-revamp-2-0-web     (new frontend)
🆕 izerwaren-revamp-2-0-api     (new backend)
🆕 izerwaren-revamp-2-0-db      (new production database)
```

## 🎯 **Revised Deployment Plan**

### **Phase 1: Clean Infrastructure Setup**

1. Create new service accounts with appropriate permissions
2. Create new Cloud SQL instance with production specs
3. Create new VPC connector for secure networking
4. Set up new container registry namespace

### **Phase 2: Build & Deploy New Services**

1. Build images with new naming convention
2. Deploy to new Cloud Run services
3. Configure environment variables and secrets
4. Set up health checks and monitoring

### **Phase 3: Domain & SSL Configuration**

1. Configure custom domain mapping for `izerwaren.mcmichaelbuild.com`
2. Set up managed SSL certificates
3. Configure DNS records

### **Phase 4: Testing & Go-Live**

1. Run comprehensive testing on new infrastructure
2. Configure monitoring and alerting
3. Update DNS to point to new services
4. Monitor and validate production readiness

## 🔧 **Updated Service Configuration**

### **Cloud Run Services**

```yaml
Frontend Service:
  name: izerwaren-revamp-2-0-web
  image: gcr.io/noelmc/izerwaren-revamp-2-0-web:latest
  memory: 2Gi
  cpu: 2
  port: 3000
  min_instances: 1
  max_instances: 10

Backend Service:
  name: izerwaren-revamp-2-0-api
  image: gcr.io/noelmc/izerwaren-revamp-2-0-api:latest
  memory: 1Gi
  cpu: 1
  port: 8080
  min_instances: 1
  max_instances: 25
```

### **Cloud SQL Database**

```yaml
Instance:
  name: izerwaren-revamp-2-0-db
  version: POSTGRES_15
  tier: db-standard-2
  storage: 100GB SSD
  region: us-central1
  backup: daily at 3:00 AM
  high_availability: true
```

## 🔒 **Security Configuration**

### **Service Accounts**

- Create dedicated service account for Cloud Run services
- Implement least privilege access principles
- Configure workload identity for secure authentication

### **Network Security**

- VPC connector for private database access
- Cloud Armor for WAF protection
- Firewall rules for appropriate traffic filtering

### **Data Security**

- Database encryption at rest and in transit
- Automated backups with point-in-time recovery
- SSL/TLS for all external communications

## 📊 **Monitoring & Observability**

### **Cloud Monitoring**

- Custom dashboards for new services
- Alerting policies for performance and availability
- Error reporting and logging

### **Health Checks**

- Application-level health endpoints
- Database connectivity checks
- External dependency monitoring

## 🌐 **Domain Configuration**

### **DNS Strategy**

```
Current: izerwaren.mcmichaelbuild.com → old POC site
Target:  izerwaren.mcmichaelbuild.com → izerwaren-revamp-2-0-web
```

### **SSL Certificate**

- Managed SSL certificate for custom domain
- Automatic renewal and monitoring
- Security best practices (A+ SSL Labs rating)

## 📝 **Next Session Action Plan**

### **Immediate Tasks**

1. **Create service accounts** with new naming convention
2. **Set up Cloud SQL database** with production configuration
3. **Build container images** with new repository names
4. **Deploy Cloud Run services** with distinct names
5. **Configure domain mapping** for production URL

### **Environment Variables Needed**

- `NEXTAUTH_SECRET` (generate new production secret)
- Database credentials for new instance
- Shopify production API keys
- Firebase production configuration

### **Scripts to Update**

- Update build scripts with new image names
- Update deployment scripts with new service names
- Create new CI/CD pipeline for revamp 2.0

### **Documentation Updates**

- Document new naming conventions
- Update deployment procedures
- Create infrastructure diagram for new setup

## ⚠️ **Risk Mitigation**

### **Isolation Strategy**

- Complete separation from existing infrastructure
- No shared resources or dependencies
- Independent monitoring and alerting

### **Rollback Plan**

- Keep old infrastructure running during transition
- DNS-level rollback capability
- Database backup and recovery procedures

### **Testing Strategy**

- Comprehensive testing on new infrastructure
- Performance validation under load
- Security scanning and penetration testing

---

## 🎯 **Session Summary**

**Status**: Infrastructure assessment complete, new deployment strategy defined
**Next**: Create fresh GCP resources with distinct naming for
izerwaren_revamp_2_0 **Risk**: Successfully avoided conflicts with existing
izerwaren-revival infrastructure **Ready**: Yes, for clean production deployment
in next session

**Key Decision**: All new infrastructure with `izerwaren-revamp-2-0-*` naming
convention to ensure complete separation from existing services.
