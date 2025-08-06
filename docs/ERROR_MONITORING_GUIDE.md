# Error Monitoring and Alerting Guide

## 🎯 Overview

This guide covers the comprehensive error monitoring and alerting system implemented using Sentry, integrated with our existing structured logging and correlation ID infrastructure.

## 📦 Components

### Core Error Monitoring
- **Sentry Integration**: Client and server-side error tracking
- **Correlation ID Propagation**: Seamless error tracing
- **React Error Boundaries**: Graceful client-side error handling
- **Automatic API Error Reporting**: Server-side error capture
- **Context Enrichment**: Enhanced error reports with request metadata

### Key Files
```
src/
├── lib/
│   └── error-monitoring.ts         # Core error monitoring utilities
├── components/
│   └── error-boundary.tsx          # React error boundary components
├── middleware/
│   └── logging.ts                  # Updated with error monitoring
├── app/
│   ├── api/
│   │   ├── test-error/route.ts     # Error testing endpoint
│   │   └── health/route.ts         # Updated with error monitoring
│   ├── monitoring/
│   │   └── sentry-tunnel/route.ts  # Sentry tunnel endpoint
│   └── test-monitoring/page.tsx    # Error monitoring test suite
├── sentry.client.config.ts         # Client-side Sentry config
├── sentry.server.config.ts         # Server-side Sentry config
└── sentry.edge.config.ts           # Edge runtime Sentry config
```

## 🚀 Quick Start

### 1. Environment Setup

Add these environment variables:

```bash
# Sentry Configuration
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

### 2. Basic Error Reporting

```typescript
import { ErrorMonitoring } from '@/lib/error-monitoring';

// Report an error
const correlationId = ErrorMonitoring.reportError(
  new Error('Something went wrong'),
  {
    component: 'user-profile',
    operation: 'update-profile',
    metadata: { userId: '123' },
    severity: 'high',
  }
);

// Report a warning
ErrorMonitoring.reportWarning('Performance degraded', {
  component: 'api-handler',
  metadata: { responseTime: 5000 },
});

// Report critical error
ErrorMonitoring.reportCritical('Payment processing failed', {
  component: 'payment-gateway',
  metadata: { orderId: 'order-123' },
});
```

### 3. Using Error Boundaries

```tsx
import { ErrorBoundary, ComponentErrorBoundary } from '@/components/error-boundary';

// Wrap entire pages
<PageErrorBoundary>
  <YourPageComponent />
</PageErrorBoundary>

// Wrap specific components
<ComponentErrorBoundary componentName="UserProfile">
  <UserProfileComponent />
</ComponentErrorBoundary>

// Custom error boundary
<ErrorBoundary
  context={{
    component: 'checkout-flow',
    operation: 'payment-processing',
  }}
  onError={(error, errorInfo, correlationId) => {
    // Custom error handling
    console.log('Payment error:', correlationId);
  }}
>
  <PaymentComponent />
</ErrorBoundary>
```

### 4. API Error Monitoring

API routes automatically report errors when using our logging middleware:

```typescript
import { withRequestLogging } from '@/middleware/logging';

async function handler(request: NextRequest) {
  // Any unhandled error here will be automatically reported
  throw new Error('This will be reported to Sentry');
}

export const GET = withRequestLogging(handler);
```

## 🔧 Advanced Usage

### Error Context Enrichment

```typescript
// Set user context
ErrorMonitoring.setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
});

// Add breadcrumbs for debugging context
ErrorMonitoring.addBreadcrumb(
  'User clicked checkout button',
  'user-action',
  'info',
  { cartValue: 299.99, itemCount: 3 }
);

// Set additional context
ErrorMonitoring.setContext('order', {
  orderId: 'order-123',
  total: 299.99,
  paymentMethod: 'credit-card',
});
```

### Monitoring Async Operations

```typescript
// Wrap async operations with error monitoring
const result = await ErrorMonitoring.withErrorMonitoring(
  'process-payment',
  async () => {
    return await processPayment(paymentData);
  },
  {
    component: 'payment-service',
    metadata: { amount: 100, currency: 'USD' },
  }
);
```

### Performance Monitoring

```typescript
// Start performance tracking
const transaction = ErrorMonitoring.startTransaction(
  'api-call',
  'http.request'
);

try {
  const result = await apiCall();
  transaction.setStatus('ok');
  return result;
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

## 📊 Error Severity Levels

| Severity | When to Use | Sentry Level | Alerting |
|----------|-------------|--------------|----------|
| `low` | Info/debug issues | `info` | No alerts |
| `medium` | Warnings, degraded performance | `warning` | Daily summary |
| `high` | Errors affecting user experience | `error` | Immediate notification |
| `critical` | System-wide failures, security issues | `fatal` | Immediate page/SMS |

## 🚨 Alerting Configuration

### 1. Sentry Alert Rules

Configure these alert rules in your Sentry project:

#### Critical Errors
- **Condition**: Error level = `fatal` OR error message contains "critical"
- **Action**: Send to Slack + PagerDuty
- **Frequency**: Immediately

#### High Error Rate
- **Condition**: Error count > 10 errors in 5 minutes
- **Action**: Send to Slack
- **Frequency**: Once per hour max

#### Performance Degradation
- **Condition**: Transaction duration > 5 seconds for > 10% of requests
- **Action**: Send to engineering channel
- **Frequency**: Once per 30 minutes

### 2. Health Check Alerts

The health check endpoints automatically report:

- **System Unhealthy**: All critical services down
- **Service Degraded**: Some services experiencing issues
- **Health Check Failure**: Health check system itself failing

### 3. Custom Business Logic Alerts

```typescript
// Example: Order processing failure
if (orderProcessingFailed) {
  ErrorMonitoring.reportCritical('Order processing pipeline failed', {
    component: 'order-service',
    operation: 'process-order',
    metadata: {
      orderId,
      userId,
      totalAmount,
      failureReason,
    },
    severity: 'critical',
  });
}

// Example: Inventory low
if (inventoryLevel < threshold) {
  ErrorMonitoring.reportWarning('Inventory level low', {
    component: 'inventory-service',
    metadata: {
      productId,
      currentLevel: inventoryLevel,
      threshold,
    },
    severity: 'medium',
  });
}
```

## 🔍 Error Investigation

### 1. Using Correlation IDs

Every error includes a correlation ID that traces through:
- Client-side error reporting
- API request logging
- Backend service calls
- Database queries

### 2. Sentry Search

Search for errors using:
- `correlationId:izerwaren-revamp-2.0-*`
- `component:payment-service`
- `operation:process-order`
- `user.id:123`

### 3. Health Check Integration

Errors reported during health checks include:
- Service connectivity status
- Response times
- Configuration status
- Error context

## 🧪 Testing Error Monitoring

### Test Suite
Visit `/test-monitoring` in development to test:
- API error reporting
- Client-side error monitoring
- Error boundary functionality
- Correlation ID propagation
- Different severity levels

### Manual Testing

```bash
# Test API errors
curl "http://localhost:3000/api/test-error?type=generic"
curl "http://localhost:3000/api/test-error?type=critical"
curl "http://localhost:3000/api/test-error?type=warning"

# Test health check error reporting
curl "http://localhost:3000/api/health"
```

## 🔒 Security and Privacy

### Data Scrubbing

Automatic removal of sensitive data:
- Authorization headers
- Cookies
- API keys
- Password fields
- Credit card numbers
- Personal information

### PII Protection

```typescript
// Sensitive data is automatically redacted
const user = { 
  id: '123', 
  email: 'user@example.com',  // Will be scrubbed in production
  password: 'secret123',      // Automatically removed
};
```

### Environment-Specific Configuration

- **Development**: Full error details, debug logging
- **Staging**: Production-like error filtering, test data
- **Production**: Minimal error exposure, full scrubbing

## 📈 Monitoring Dashboards

### Key Metrics to Track

1. **Error Rate**: Errors per minute/hour
2. **Response Times**: API response time distribution
3. **Error Distribution**: By component and operation
4. **User Impact**: Unique users affected by errors
5. **Recovery Time**: Time to resolve critical errors

### Sentry Dashboards

Create dashboards for:
- Application overview
- Error trends
- Performance metrics
- User impact
- Component health

## 🚀 Production Deployment

### 1. Environment Variables

Set in Cloud Run or your deployment platform:
```bash
SENTRY_DSN="your-production-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_RELEASE="v1.0.0"  # Set during deployment
```

### 2. Source Maps

Source maps are automatically uploaded when:
- `SENTRY_ORG` and `SENTRY_PROJECT` are set
- Build runs in production mode
- Sentry auth token is configured

### 3. Release Tracking

```bash
# Set release version during deployment
export SENTRY_RELEASE="v$(date +%Y%m%d-%H%M%S)"
export NEXT_PUBLIC_SENTRY_RELEASE="$SENTRY_RELEASE"
```

## 🛠️ Troubleshooting

### Common Issues

1. **Sentry Not Receiving Errors**
   - Check DSN configuration
   - Verify network connectivity
   - Test with `/monitoring/sentry-tunnel`

2. **Missing Correlation IDs**
   - Ensure middleware is properly applied
   - Check header propagation
   - Verify logging configuration

3. **Too Many Alerts**
   - Adjust severity levels
   - Implement rate limiting
   - Filter non-actionable errors

### Debug Mode

Enable debug logging:
```typescript
// In development
process.env.NODE_ENV = 'development';
// Sentry debug logging will be enabled
```

### Testing Connectivity

```typescript
// Test Sentry connectivity
import * as Sentry from '@sentry/nextjs';

try {
  Sentry.captureMessage('Test message');
  console.log('Sentry connection working');
} catch (error) {
  console.error('Sentry connection failed:', error);
}
```

## 📚 Best Practices

### 1. Error Handling Strategy
- Use error boundaries for React components
- Implement graceful degradation
- Provide user-friendly error messages
- Log technical details for debugging

### 2. Context Enrichment
- Always include correlation IDs
- Add relevant business context
- Set user information when available
- Include operation details

### 3. Alert Management
- Set appropriate severity levels
- Avoid alert fatigue
- Include actionable information
- Set up escalation procedures

### 4. Performance Considerations
- Use sampling for high-traffic applications
- Implement rate limiting for error reports
- Cache error contexts where appropriate
- Monitor Sentry quota usage

## 🔗 Related Documentation

- [Structured Logging Guide](./LOGGING_GUIDE.md)
- [Health Check Documentation](./api/health/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Sentry Documentation](https://docs.sentry.io/)

---

*Last updated: 2025-08-05*