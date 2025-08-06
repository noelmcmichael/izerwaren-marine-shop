// This file configures the initialization of Sentry on the browser/client side.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out errors that don't provide value
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out common browser errors that we can't control
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Skip browser extension errors
        if (errorMessage.includes('extension') || 
            errorMessage.includes('chrome://') ||
            errorMessage.includes('moz-extension://')) {
          return null;
        }
        
        // Skip network errors that are not actionable
        if (errorMessage.includes('network error') && 
            errorMessage.includes('fetch')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Enrich events with additional context
  beforeSendTransaction(event) {
    return event;
  },
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^/]*\.izerwaren\.com/,
        /^https:\/\/[^/]*\.shopify\.com/,
      ],
    }),
  ],
  
  // Set user context
  initialScope: {
    tags: {
      component: 'frontend',
      environment: process.env.NODE_ENV,
    },
  },
  
  // Data scrubbing for sensitive information
  beforeBreadcrumb(breadcrumb) {
    // Scrub sensitive data from URLs
    if (breadcrumb.data?.url) {
      // Remove query parameters that might contain sensitive data
      const url = new URL(breadcrumb.data.url, window.location.origin);
      url.searchParams.delete('access_token');
      url.searchParams.delete('api_key');
      url.searchParams.delete('password');
      breadcrumb.data.url = url.toString();
    }
    
    return breadcrumb;
  },
  
  // Environment detection
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'unknown',
});