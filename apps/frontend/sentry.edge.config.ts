// This file configures the initialization of Sentry for edge runtime.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering for edge runtime
  beforeSend(event, hint) {
    // Add correlation ID if available
    const correlationId = hint.originalException?.correlationId || 
                         hint.contexts?.correlationId;
    
    if (correlationId) {
      event.tags = {
        ...event.tags,
        correlationId,
      };
    }
    
    return event;
  },
  
  // Set edge runtime context
  initialScope: {
    tags: {
      component: 'frontend-edge',
      environment: process.env.NODE_ENV,
    },
  },
  
  // Environment detection
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Release tracking
  release: process.env.SENTRY_RELEASE || 'unknown',
});