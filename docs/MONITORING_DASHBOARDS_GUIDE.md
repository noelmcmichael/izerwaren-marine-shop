# Monitoring Dashboards Guide

## Overview

This guide covers the comprehensive monitoring dashboard system implemented for the Izerwaren Revamp 2.0 project. The monitoring system provides real-time visibility into application performance, system health, business metrics, and operational status.

## Dashboard Architecture

### Components
- **Dashboard API** (`/api/monitoring/dashboard`) - Aggregates data for dashboard widgets
- **Metrics API** (`/api/monitoring/metrics`) - Provides detailed metrics with time-series data
- **Health API** (`/api/health`) - Comprehensive health status for all services
- **Dashboard UI** (`/monitoring`) - React-based monitoring dashboard interface

### Key Features
- **Real-time Updates** - Configurable auto-refresh with manual refresh capability
- **Multi-layered Monitoring** - System, application, and business metrics
- **Alert Integration** - Visual alerts with severity levels
- **Responsive Design** - Mobile-friendly dashboard interface
- **Error Tracking** - Integration with existing error monitoring system

## Dashboard Access

### URL
- **Production**: `https://yourdomain.com/monitoring`
- **Local Development**: `http://localhost:3000/monitoring`

### Authentication
The monitoring dashboard currently allows open access. For production deployment, consider:
- IP whitelisting for internal network access only
- Basic authentication for team members
- Integration with existing authentication system
- VPN-only access requirements

## Widget Types and Metrics

### 1. System Health Status Widget
**Purpose**: Overall system health overview
- **Status Indicators**: Healthy, Degraded, Unhealthy
- **Uptime Display**: System uptime in hours/minutes
- **Version Information**: Current application version
- **Visual Indicators**: Color-coded status with icons

### 2. Performance Metrics Widgets
**Response Time**
- Average response time across all endpoints
- Threshold monitoring (500ms warning, 1000ms critical)
- Trend indicators (up/down arrows)

**Error Rate**
- Percentage of failed requests
- Threshold alerts (1% warning, 5% critical)
- Real-time error tracking

**Request Volume**
- Total request count over time period
- Trend analysis with historical comparison

### 3. External Services Status
**Monitored Services**:
- **Shopify API**: GraphQL endpoint connectivity and response times
- **Firebase**: Configuration validation and service availability
- **Sentry**: Error monitoring service status

**Display Information**:
- Service name with color-coded status dots
- Response time in milliseconds
- Last check timestamp

### 4. Business Metrics Grid
**Key Business Indicators**:
- **Page Views**: Total application page views
- **Product Views**: Individual product detail page visits
- **RFQ Submissions**: Request for Quote form submissions
- **Search Queries**: Product search activity

**Features**:
- Trend indicators (increase/decrease from previous period)
- Clickable metrics for detailed drill-down

### 5. Performance Charts
**Time-series Visualizations**:
- Response time trends over 24 hours
- Request volume patterns
- Error rate fluctuations

**Chart Types**:
- Line charts for time-series data
- Pie charts for error breakdown
- Bar charts for comparative metrics

### 6. Alerts Widget
**Alert Types**:
- **Critical**: System failures, high error rates
- **Warning**: Performance degradation, threshold breaches
- **Info**: Deployment notifications, system updates

**Alert Features**:
- Timestamp and correlation ID tracking
- Resolution status tracking
- Severity-based color coding

## API Endpoints

### Dashboard Data API
```
GET /api/monitoring/dashboard
```

**Response Structure**:
```json
{
  "title": "Izerwaren Production Monitoring Dashboard",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "widgets": [
    {
      "id": "system-health",
      "title": "System Health",
      "type": "status",
      "data": {
        "status": "healthy",
        "uptime": "72h 15m",
        "version": "1.0.0"
      },
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 }
    }
  ],
  "config": {
    "refreshInterval": 30000,
    "timezone": "UTC",
    "theme": "dark"
  }
}
```

### Metrics API
```
GET /api/monitoring/metrics?timeRange=1h&granularity=5m
```

**Query Parameters**:
- `timeRange`: 1h, 6h, 24h, 7d, 30d
- `granularity`: 1m, 5m, 15m, 1h, 6h, 24h

**Response Structure**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "correlationId": "monitoring-12345",
  "timeRange": { "start": "...", "end": "..." },
  "metrics": {
    "system": {
      "memory": { "usage": 245.6, "unit": "MB" },
      "uptime": { "value": 259200, "unit": "seconds" },
      "cpu": { "usage": 23.4, "unit": "percentage" }
    },
    "performance": {
      "requests": {
        "total": 15420,
        "successful": 15380,
        "failed": 40,
        "errorRate": 0.26
      },
      "responseTime": {
        "average": 347,
        "unit": "ms"
      }
    }
  }
}
```

### Health Check API
```
GET /api/health
```

**Response Structure**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlationId": "health-12345",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "shopify": {
      "status": "healthy",
      "responseTime": 245,
      "lastCheck": "2024-01-15T10:30:00Z"
    },
    "firebase": {
      "status": "healthy",
      "responseTime": 89,
      "lastCheck": "2024-01-15T10:30:00Z"
    },
    "sentry": {
      "status": "healthy",
      "responseTime": 156,
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  },
  "system": {
    "status": "healthy",
    "checks": {
      "memory": {
        "status": "healthy",
        "message": "245.6MB used"
      },
      "cpu": {
        "status": "healthy",
        "message": "23.4% usage"
      }
    }
  },
  "metrics": {
    "responseTime": 89,
    "uptime": 259200,
    "memoryUsage": 245.6,
    "cpuUsage": 23.4
  }
}
```

## Monitoring Configuration

### Refresh Settings
- **Default Interval**: 30 seconds
- **Auto-refresh**: Enabled by default
- **Manual Refresh**: Available via UI button
- **Error Handling**: Automatic retry with exponential backoff

### Thresholds and Alerts
```javascript
const thresholds = {
  responseTime: {
    warning: 500,   // milliseconds
    critical: 1000
  },
  errorRate: {
    warning: 1,     // percentage
    critical: 5
  },
  memoryUsage: {
    warning: 500,   // MB
    critical: 800
  },
  cpuUsage: {
    warning: 70,    // percentage
    critical: 85
  }
};
```

### Color Coding
- **Green (#22c55e)**: Healthy status, good performance
- **Yellow (#eab308)**: Warning status, degraded performance
- **Red (#ef4444)**: Critical status, unhealthy system
- **Gray (#6b7280)**: Unknown status, no data

## Integration with Error Monitoring

### Correlation ID Tracking
Every dashboard request includes a correlation ID for:
- Error tracking and debugging
- Performance monitoring
- Request tracing across services
- Alert correlation with system events

### Sentry Integration
Dashboard errors are automatically reported to Sentry with:
- User context and browser information
- Dashboard state and configuration
- Error metadata and stack traces
- Performance timing information

## Production Deployment

### Environment Variables
```bash
# Required for dashboard functionality
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production

# Service monitoring
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
SENTRY_DSN=your-sentry-dsn

# Optional Firebase
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey": "..."}
```

### Performance Considerations
- **Caching**: API responses cached for 30 seconds
- **Rate Limiting**: Dashboard API limited to 60 requests/minute
- **Memory Management**: Metrics automatically pruned after 24 hours
- **Load Balancing**: Dashboard supports multiple instances

### Security Considerations
- **CORS**: Restricted to application domain
- **Headers**: Security headers enforced
- **Data Sanitization**: All user inputs sanitized
- **Access Logs**: All dashboard access logged for audit

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
1. Check network connectivity to `/api/monitoring/dashboard`
2. Verify environment variables are set correctly
3. Check browser console for JavaScript errors
4. Verify server logs for API errors

#### Metrics Not Updating
1. Confirm auto-refresh is enabled
2. Check `/api/monitoring/metrics` endpoint directly
3. Verify system clock synchronization
4. Check for rate limiting errors

#### Service Status Shows Unhealthy
1. Test individual service endpoints manually
2. Check service-specific configuration
3. Verify network connectivity to external services
4. Review service authentication credentials

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=monitoring:*
LOG_LEVEL=debug
```

### Health Check Validation
Test individual components:
```bash
# Basic connectivity
curl https://yourdomain.com/api/health

# Detailed metrics
curl https://yourdomain.com/api/monitoring/metrics

# Dashboard data
curl https://yourdomain.com/api/monitoring/dashboard
```

## Future Enhancements

### Planned Features
1. **Custom Dashboards**: User-configurable widget layouts
2. **Historical Data**: Long-term metrics storage and analysis
3. **Advanced Alerting**: Email and Slack notifications
4. **SLA Tracking**: Service level agreement monitoring
5. **Capacity Planning**: Resource usage forecasting

### Integration Opportunities
1. **Grafana**: Export metrics to Grafana for advanced visualization
2. **Prometheus**: Metrics collection in Prometheus format
3. **DataDog**: Professional monitoring service integration
4. **PagerDuty**: Incident management integration

---

## Implementation Status: ✅ COMPLETE

The monitoring dashboard system is fully implemented and production-ready:

- **Dashboard UI**: Responsive React dashboard with real-time updates
- **API Endpoints**: Complete metrics, dashboard, and health APIs
- **Health Monitoring**: Comprehensive system and service health checks
- **Error Integration**: Full correlation ID tracking and Sentry integration
- **Performance Tracking**: Response time, error rate, and throughput monitoring
- **Business Metrics**: Page views, conversions, and user activity tracking

### Next Steps
1. Deploy dashboard to production environment
2. Configure alerting thresholds for your specific requirements
3. Set up access controls and authentication
4. Create monitoring runbooks for incident response
5. Train team members on dashboard usage and interpretation