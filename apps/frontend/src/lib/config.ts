/**
 * Environment Configuration Service
 * 
 * Centralized configuration management for environment-specific settings.
 * Provides a single source of truth for all environment variables and
 * implements proper fallback patterns.
 */

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

// Environment type
export const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';

/**
 * API Configuration
 */
export const api = {
  // Primary API endpoint (frontend to backend)
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Legacy Revival API endpoint
  revivalBaseUrl: process.env.REVIVAL_API_BASE || (isProduction ? '' : 'http://localhost:8000'),
  
  // API timeout configuration
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  
  // Retry configuration
  retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
} as const;

/**
 * Shopify Configuration
 */
export const shopify = {
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  
  // Admin API configuration (server-side only)
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  
  // Development mode bypass
  devMode: process.env.DEV_MODE === 'true' || isDevelopment,
  
  // Validation
  get isConfigured() {
    return !!(this.storeDomain && this.storefrontAccessToken);
  },
  
  get adminConfigured() {
    return !!(this.storeDomain && this.adminAccessToken);
  },
  
  get normalizedDomain() {
    return this.storeDomain.replace('https://', '').replace('http://', '');
  },
} as const;

/**
 * Firebase Configuration
 */
export const firebase = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-mode',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-api-key',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'dev-app-id',
  
  // Server-side Firebase Admin configuration
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  
  // Development mode bypass
  devMode: process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.DEV_MODE === 'true' || isDevelopment,
  skipAuth: process.env.SKIP_FIREBASE_AUTH === 'true' || isDevelopment,
  
  // Validation
  get isConfigured() {
    return !!(this.projectId && this.apiKey && this.messagingSenderId && this.appId);
  },
  
  get adminConfigured() {
    return !!(this.projectId && this.clientEmail && this.privateKey);
  },
} as const;

/**
 * Asset and Media Configuration
 */
export const assets = {
  legacyImageDomain: process.env.LEGACY_IMAGE_DOMAIN || 'izerwaren.biz',
  shopifyImageDomain: 'cdn.shopify.com',
} as const;

/**
 * Application Configuration
 */
export const app = {
  name: 'Izerwaren Revamp 2.0',
  version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  environment,
  
  // Feature flags
  features: {
    devMode: firebase.devMode,
    debugMode: process.env.NEXT_PUBLIC_DEBUG === 'true' || isDevelopment,
    analyticsEnabled: isProduction,
  },
} as const;

/**
 * Monitoring and Observability Configuration
 */
export const monitoring = {
  cloudTraceContext: process.env.CLOUD_TRACE_CONTEXT || '',
  enableTracing: isProduction,
  enableMetrics: isProduction,
  
  // Development debugging
  verboseLogging: isDevelopment || process.env.NEXT_PUBLIC_DEBUG === 'true',
} as const;

/**
 * Service URLs
 * Dynamic URL generation based on environment
 */
export const services = {
  // Get the current service base URL
  get baseUrl() {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin;
    }
    
    // Server-side: construct from environment variables
    if (isProduction) {
      const serviceName = process.env.SERVICE_NAME || 'izerwaren-frontend';
      const serviceId = process.env.CLOUD_RUN_SERVICE_ID || 'unknown';
      const region = process.env.CLOUD_RUN_REGION || 'us-central1';
      return `https://${serviceName}-${serviceId}.${region}.run.app`;
    }
    
    return `http://localhost:${process.env.PORT || 3000}`;
  },
  
  // Health check endpoint
  get healthCheck() {
    return `${this.baseUrl}/api/health`;
  },
  
  // API endpoints
  get apiBase() {
    return `${this.baseUrl}${api.baseUrl}`;
  },
} as const;

/**
 * Validation Functions
 */
export const validation = {
  // Check if all required environment variables are present
  validateRequired(): { valid: boolean; missing: string[] } {
    const required = [];
    
    // Check Shopify configuration for production
    if (isProduction && !shopify.isConfigured) {
      if (!shopify.storeDomain) required.push('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
      if (!shopify.storefrontAccessToken) required.push('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    }
    
    return {
      valid: required.length === 0,
      missing: required,
    };
  },
  
  // Validate configuration and log warnings
  logValidation(): void {
    const result = this.validateRequired();
    
    if (!result.valid) {
      console.warn('❌ Missing required environment variables:', result.missing);
    }
    
    if (isDevelopment) {
      console.log('🔧 Configuration loaded:', {
        environment,
        apiBaseUrl: api.baseUrl,
        shopifyConfigured: shopify.isConfigured,
        firebaseConfigured: firebase.isConfigured,
        features: app.features,
      });
    }
  },
} as const;

/**
 * Configuration Helpers
 */
export const config = {
  api,
  shopify,
  firebase,
  assets,
  app,
  monitoring,
  services,
  validation,
  
  // Environment flags
  isProduction,
  isDevelopment,
  isTest,
  environment,
} as const;

// Validate configuration on import (development only)
if (isDevelopment || process.env.NEXT_PUBLIC_DEBUG === 'true') {
  validation.logValidation();
}

export default config;