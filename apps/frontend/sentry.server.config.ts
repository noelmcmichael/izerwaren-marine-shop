// This file configures the initialization of Sentry on the server side.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering and enrichment
  beforeSend(event, hint) {
    // Add correlation ID if available from our logging system
    const correlationId = hint.originalException?.correlationId || 
                         hint.contexts?.correlationId;
    
    if (correlationId) {
      event.tags = {
        ...event.tags,
        correlationId,
      };
    }
    
    // Filter out errors that don't provide value
    if (event.exception) {
      const error = hint.originalException;
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Skip non-actionable errors
        if (errorMessage.includes('enotfound') || 
            errorMessage.includes('connection refused') ||
            errorMessage.includes('timeout')) {
          // Only skip if not a critical service
          const isCriticalService = errorMessage.includes('shopify') ||
                                   errorMessage.includes('database') ||
                                   errorMessage.includes('payment');
          
          if (!isCriticalService) {
            return null;
          }
        }
      }
    }
    
    return event;
  },
  
  // Performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Set server context
  initialScope: {
    tags: {
      component: 'frontend-server',
      environment: process.env.NODE_ENV,
    },
  },
  
  // Data scrubbing for sensitive information
  beforeBreadcrumb(breadcrumb) {
    // Scrub sensitive data from HTTP requests
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      // Remove sensitive headers
      if (breadcrumb.data.headers) {
        delete breadcrumb.data.headers.authorization;
        delete breadcrumb.data.headers.cookie;
        delete breadcrumb.data.headers['x-api-key'];
      }
      
      // Scrub sensitive data from URLs
      if (breadcrumb.data.url) {
        try {
          const url = new URL(breadcrumb.data.url);
          url.searchParams.delete('access_token');
          url.searchParams.delete('api_key');
          url.searchParams.delete('password');
          breadcrumb.data.url = url.toString();
        } catch {
          // Invalid URL, leave as is
        }
      }
    }
    
    return breadcrumb;
  },
  
  // Environment detection
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Release tracking
  release: process.env.SENTRY_RELEASE || 'unknown',
});