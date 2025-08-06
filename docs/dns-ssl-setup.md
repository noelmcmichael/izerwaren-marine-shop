# DNS and SSL Setup for Izerwaren Revamp 2.0

This document describes the DNS and SSL configuration for the production domain `izerwaren.mcmichaelbuild.com`.

## Current Status

✅ **Service Deployed**: `izerwaren-revamp-2-0-web` is deployed and running  
✅ **Service Accessible**: Service responds to health checks  
✅ **SSL Ready**: Service is configured for HTTPS  
⚠️ **Domain Verification**: Domain verification needed in Google Cloud Console  

## Production Service Details

- **Service Name**: `izerwaren-revamp-2-0-web`
- **Service URL**: https://izerwaren-revamp-2-0-web-591834531941.us-central1.run.app
- **Health Endpoint**: https://izerwaren-revamp-2-0-web-591834531941.us-central1.run.app/api/health
- **Region**: us-central1
- **Project**: noelmc

## Domain Configuration

### Current Domain Mapping
The domain `izerwaren.mcmichaelbuild.com` requires re-verification in Google Cloud Console due to domain verification expiry.

### Steps to Complete Domain Setup

1. **Verify Domain in Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/run/domains?project=noelmc
   - Click "Add Mapping"
   - Enter domain: `izerwaren.mcmichaelbuild.com`
   - Follow domain verification steps
   - Add required DNS records to domain registrar

2. **Map Domain to New Service**
   ```bash
   gcloud beta run domain-mappings create \
     --service=izerwaren-revamp-2-0-web \
     --domain=izerwaren.mcmichaelbuild.com \
     --region=us-central1 \
     --project=noelmc
   ```

3. **Wait for SSL Certificate Provisioning**
   - SSL certificates are automatically provisioned by Google Cloud
   - This process typically takes 5-15 minutes
   - Monitor status in Cloud Console

## DNS Records Required

### Current DNS Configuration
Based on previous setup, the following DNS records should be configured:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | izerwaren | [Google Cloud IP] | 300 |
| CNAME | www.izerwaren | izerwaren.mcmichaelbuild.com | 300 |

### Verification Records
During domain verification, Google Cloud will provide specific DNS records to add:
- TXT record for domain ownership verification
- Specific CNAME or A records for routing

## SSL Certificate Configuration

### Automatic SSL
- **Provider**: Google-managed SSL certificates
- **Type**: Let's Encrypt via Google Cloud
- **Renewal**: Automatic
- **Domains Covered**: 
  - `izerwaren.mcmichaelbuild.com`
  - `www.izerwaren.mcmichaelbuild.com` (if configured)

### SSL Security Features
- **TLS Version**: 1.2+ (Cloud Run enforced)
- **Perfect Forward Secrecy**: Enabled
- **HSTS**: Can be configured in application
- **HTTP to HTTPS Redirect**: Automatic

## Health Check Endpoints

The following endpoints are available for monitoring:

### Primary Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response Format**: JSON
- **Status Codes**: 
  - 200: All services healthy
  - 206: Some services degraded
  - 503: Services unhealthy

### Specialized Health Checks
- **Database Health**: `/api/health/database`
- **Readiness Check**: `/api/health/readiness`

### Example Health Response
```json
{
  "status": "healthy",
  "timestamp": "2025-08-04T01:22:50.779Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2025-08-04T01:22:50.780Z"
    },
    "shopify": {
      "status": "healthy",
      "responseTime": 120,
      "lastCheck": "2025-08-04T01:22:50.781Z"
    },
    "firebase": {
      "status": "healthy",
      "responseTime": 30,
      "lastCheck": "2025-08-04T01:22:50.782Z"
    }
  },
  "metrics": {
    "responseTime": 150,
    "memoryUsage": 25.11,
    "uptime": 3600
  }
}
```

## Monitoring and Alerting

### Uptime Monitoring
- **Cloud Monitoring**: Uptime checks configured
- **Check Interval**: 1 minute
- **Global Locations**: USA, Europe, Asia-Pacific
- **Alert Threshold**: 2 consecutive failures

### Performance Monitoring
- **Response Time**: 95th percentile < 500ms target
- **Error Rate**: < 1% target
- **Availability**: 99.9% target

## Security Configuration

### HTTPS Enforcement
- All HTTP traffic automatically redirected to HTTPS
- HTTP Strict Transport Security (HSTS) recommended
- Secure headers configured in application

### Access Control
- **Public Access**: Enabled for web traffic
- **Service Account**: `izerwaren-revamp-2-0-run@noelmc.iam.gserviceaccount.com`
- **IAM Policies**: Least privilege principles

## Troubleshooting

### Common Issues

#### Domain Not Resolving
```bash
# Check DNS propagation
dig izerwaren.mcmichaelbuild.com
nslookup izerwaren.mcmichaelbuild.com

# Check from multiple locations
dig @8.8.8.8 izerwaren.mcmichaelbuild.com
dig @1.1.1.1 izerwaren.mcmichaelbuild.com
```

#### SSL Certificate Issues
```bash
# Check certificate status
curl -vI https://izerwaren.mcmichaelbuild.com/api/health

# Check certificate details
openssl s_client -connect izerwaren.mcmichaelbuild.com:443 -servername izerwaren.mcmichaelbuild.com
```

#### Service Health Issues
```bash
# Check service logs
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=izerwaren-revamp-2-0-web" \
  --limit=20 --project=noelmc

# Check service status
gcloud run services describe izerwaren-revamp-2-0-web --region=us-central1 --project=noelmc
```

### Recovery Procedures

#### Rollback to Previous Service
If issues arise, rollback to the previous service:

```bash
# Delete current mapping
gcloud beta run domain-mappings delete \
  --domain=izerwaren.mcmichaelbuild.com \
  --region=us-central1 \
  --project=noelmc --quiet

# Create mapping to old service
gcloud beta run domain-mappings create \
  --service=izerwaren-revival \
  --domain=izerwaren.mcmichaelbuild.com \
  --region=us-central1 \
  --project=noelmc
```

#### Emergency Contacts
- **Cloud Console**: https://console.cloud.google.com/run?project=noelmc
- **Domain Registrar**: Check DNS settings at registrar level
- **Support**: Google Cloud Support for critical SSL/DNS issues

## Validation Checklist

### Pre-Deployment Validation
- [ ] Service health check returns 200 OK
- [ ] All environment variables configured
- [ ] Database connectivity verified
- [ ] External API integrations tested

### Post-Deployment Validation
- [ ] Domain resolves to correct IP
- [ ] HTTPS certificate valid and trusted
- [ ] All application features functional
- [ ] Monitoring and alerting active
- [ ] Performance within acceptable ranges

### Performance Testing
```bash
# Basic load test
ab -n 100 -c 10 https://izerwaren.mcmichaelbuild.com/api/health

# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=izerwaren.mcmichaelbuild.com

# DNS propagation test
# Visit: https://www.whatsmydns.net/#A/izerwaren.mcmichaelbuild.com
```

## Manual Steps Required

1. **Complete Domain Verification**
   - Access Google Cloud Console: https://console.cloud.google.com/run/domains?project=noelmc
   - Verify domain ownership
   - Configure DNS records as provided by Google Cloud

2. **Update Domain Mapping**
   - Map verified domain to `izerwaren-revamp-2-0-web` service
   - Verify SSL certificate provisioning

3. **Update Monitoring**
   - Update uptime checks to use custom domain
   - Configure alerts for domain-specific issues

4. **Test All Features**
   - Complete end-to-end testing
   - Verify all business functionality
   - Performance validation

## Future Enhancements

### Performance Optimizations
- CDN configuration for static assets
- Edge caching for improved global performance
- Advanced SSL configurations

### Security Enhancements
- Web Application Firewall (WAF) via Cloud Armor
- DDoS protection and rate limiting
- Security headers optimization

### Monitoring Improvements
- Real User Monitoring (RUM)
- Synthetic transaction monitoring
- Advanced business metrics tracking

---

**Last Updated**: August 3, 2025  
**Version**: 1.0.0  
**Status**: Manual Domain Verification Required  
**Next Steps**: Complete domain verification in Google Cloud Console