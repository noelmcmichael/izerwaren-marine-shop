/**
 * Backend Configuration Service
 * 
 * Centralized configuration management for backend environment-specific settings.
 * Provides a single source of truth for all environment variables and
 * implements proper fallback patterns with GCP Secret Manager integration.
 */

import { secrets } from './secrets';

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

// Environment type
export const environment = process.env.NODE_ENV || 'development';

/**
 * Server Configuration
 */
export const server = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Service identification
  serviceName: process.env.SERVICE_NAME || 'izerwaren-backend',
  version: process.env.SERVICE_VERSION || '1.0.0',
  
  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Request limits
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  
  // Service URLs
  get baseUrl() {
    if (isProduction) {
      const serviceId = process.env.CLOUD_RUN_SERVICE_ID || 'unknown';
      const region = process.env.CLOUD_RUN_REGION || 'us-central1';
      return `https://${this.serviceName}-${serviceId}.${region}.run.app`;
    }
    return `http://${this.host}:${this.port}`;
  },
  
  get healthCheckUrl() {
    return `${this.baseUrl}/health`;
  },
} as const;

/**
 * Database Configuration
 */
export const database = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: process.env.DB_NAME || 'izerwaren',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '', // Static fallback, use loadSecrets() for secure access
  
  // SSL configuration
  ssl: process.env.DB_SSL === 'true' || isProduction,
  
  // Connection pooling
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
  
  // Secure password access
  async getPassword(): Promise<string> {
    const secretPassword = await secrets.getDatabasePassword();
    return secretPassword || this.password;
  },
  
  // Validation
  get isConfigured() {
    return !!(this.host && this.name && this.user);
  },
  
  async getConnectionString(): Promise<string> {
    const password = await this.getPassword();
    const sslParam = this.ssl ? '?sslmode=require' : '';
    return `postgresql://${this.user}:${password}@${this.host}:${this.port}/${this.name}${sslParam}`;
  },
  
  // Synchronous connection string for backwards compatibility (uses env var only)
  get connectionString() {
    const sslParam = this.ssl ? '?sslmode=require' : '';
    return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}${sslParam}`;
  },
} as const;

/**
 * Shopify Configuration
 */
export const shopify = {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '',
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '', // Static fallback, use getAdminAccessToken() for secure access
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '', // Static fallback, use getWebhookSecret() for secure access
  
  // API configuration
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
  
  // Rate limiting
  maxRetries: parseInt(process.env.SHOPIFY_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.SHOPIFY_RETRY_DELAY || '1000', 10),
  
  // Secure access token retrieval
  async getAdminAccessToken(): Promise<string> {
    const secretToken = await secrets.getShopifyAdminToken();
    return secretToken || this.adminAccessToken;
  },
  
  // Secure webhook secret retrieval
  async getWebhookSecret(): Promise<string> {
    const secretWebhook = await secrets.getShopifyWebhookSecret();
    return secretWebhook || this.webhookSecret;
  },
  
  // Validation (async version for full validation)
  async isFullyConfigured(): Promise<boolean> {
    const token = await this.getAdminAccessToken();
    return !!(this.shopDomain && token);
  },
  
  // Validation (sync version for quick checks using env vars only)
  get isConfigured() {
    return !!(this.shopDomain && this.adminAccessToken);
  },
  
  get normalizedDomain() {
    return this.shopDomain.replace('https://', '').replace('http://', '');
  },
} as const;

/**
 * Firebase Configuration
 */
export const firebase = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '', // Static fallback, use getPrivateKey() for secure access
  
  // Development mode
  skipAuth: process.env.SKIP_FIREBASE_AUTH === 'true' || isDevelopment,
  devMode: process.env.DEV_MODE === 'true' || isDevelopment,
  
  // ADC (Application Default Credentials) mode
  useADC: process.env.FIREBASE_CLIENT_EMAIL === 'ADC' && process.env.FIREBASE_PRIVATE_KEY === 'ADC',
  
  // Secure private key retrieval
  async getPrivateKey(): Promise<string> {
    if (this.useADC) {
      return ''; // ADC doesn't need explicit private key
    }
    const secretKey = await secrets.getFirebasePrivateKey();
    return secretKey?.replace(/\\n/g, '\n') || this.privateKey;
  },
  
  // Async validation for full configuration check
  async isFullyConfigured(): Promise<boolean> {
    if (this.useADC) {
      return !!this.projectId;
    }
    const privateKey = await this.getPrivateKey();
    return !!(this.projectId && this.clientEmail && privateKey);
  },
  
  // Validation (sync version using env vars only)
  get isConfigured() {
    return this.useADC || !!(this.projectId && this.clientEmail && this.privateKey);
  },
} as const;

/**
 * Media and Assets Configuration
 */
export const media = {
  legacyImageDomain: process.env.LEGACY_IMAGE_DOMAIN || 'izerwaren.biz',
  staticAssetsPath: process.env.STATIC_ASSETS_PATH || '/static',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB default
  allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'webp'],
} as const;

/**
 * Logging Configuration
 */
export const logging = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: process.env.LOG_FORMAT || (isProduction ? 'json' : 'combined'),
  
  // Request logging
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  logBody: process.env.LOG_REQUEST_BODY === 'true' && !isProduction,
  
  // Error tracking
  enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
} as const;

/**
 * Security Configuration
 */
export const security = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production', // Static fallback, use getJwtSecret() for secure access
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // CORS
  allowedOrigins: server.corsOrigins,
  
  // Secure JWT secret retrieval
  async getJwtSecret(): Promise<string> {
    const secretJwt = await secrets.getJwtSecret();
    return secretJwt || this.jwtSecret;
  },
} as const;

/**
 * Validation Functions
 */
export const validation = {
  // Check if all required environment variables are present
  validateRequired(): { valid: boolean; missing: string[]; warnings: string[] } {
    const missing = [];
    const warnings = [];
    
    // Server configuration
    if (!server.port || isNaN(server.port)) {
      missing.push('PORT (valid integer)');
    }
    
    // Database configuration for production
    if (isProduction && !database.isConfigured) {
      if (!database.host) missing.push('DB_HOST');
      if (!database.name) missing.push('DB_NAME');
      if (!database.user) missing.push('DB_USER');
      if (!database.password) warnings.push('DB_PASSWORD (recommended for production)');
    }
    
    // Shopify configuration for production
    if (isProduction && !shopify.isConfigured) {
      if (!shopify.shopDomain) missing.push('SHOPIFY_SHOP_DOMAIN');
      if (!shopify.adminAccessToken) missing.push('SHOPIFY_ADMIN_ACCESS_TOKEN');
    }
    
    // Firebase configuration (if not using ADC)
    if (!firebase.skipAuth && !firebase.isConfigured) {
      if (!firebase.projectId) missing.push('FIREBASE_PROJECT_ID');
      if (!firebase.useADC) {
        if (!firebase.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!firebase.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
      }
    }
    
    // Security configuration for production
    if (isProduction) {
      if (security.jwtSecret === 'dev-secret-change-in-production') {
        missing.push('JWT_SECRET (production secret required)');
      }
    }
    
    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  },
  
  // Validate configuration and log results
  logValidation(): void {
    const result = this.validateRequired();
    
    if (!result.valid) {
      console.error('❌ Missing required environment variables:', result.missing);
      if (isProduction) {
        throw new Error(`Missing required environment variables: ${result.missing.join(', ')}`);
      }
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:', result.warnings);
    }
    
    if (isDevelopment) {
      console.log('🔧 Backend configuration loaded:', {
        environment,
        serverPort: server.port,
        baseUrl: server.baseUrl,
        databaseConfigured: database.isConfigured,
        shopifyConfigured: shopify.isConfigured,
        firebaseConfigured: firebase.isConfigured,
        devMode: firebase.devMode,
      });
    }
    
    if (result.valid) {
      console.log('✅ All required configuration validated successfully');
    }
  },

  // Async validation that includes secrets
  async validateWithSecrets(): Promise<{ valid: boolean; missing: string[]; warnings: string[] }> {
    const envValidation = this.validateRequired();
    const secretsValidation = await secrets.validate();
    
    const combined = {
      valid: envValidation.valid && secretsValidation.valid,
      missing: [...envValidation.missing, ...secretsValidation.missing],
      warnings: [...envValidation.warnings, ...secretsValidation.warnings],
    };
    
    if (!combined.valid) {
      console.error('❌ Configuration validation failed:', {
        envMissing: envValidation.missing,
        secretsMissing: secretsValidation.missing,
      });
      if (isProduction) {
        throw new Error(`Configuration validation failed: ${combined.missing.join(', ')}`);
      }
    }
    
    if (combined.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:', combined.warnings);
    }
    
    if (combined.valid) {
      console.log('✅ All configuration and secrets validated successfully');
    }
    
    return combined;
  },

  // Log async validation results
  async logAsyncValidation(): Promise<void> {
    await this.validateWithSecrets();
    
    if (isDevelopment) {
      const cacheStats = secrets.getCacheStats();
      console.log('🔧 Backend configuration loaded with secrets:', {
        environment,
        serverPort: server.port,
        baseUrl: server.baseUrl,
        databaseConfigured: database.isConfigured,
        shopifyConfigured: shopify.isConfigured,
        firebaseConfigured: firebase.isConfigured,
        secretCacheStats: cacheStats,
        devMode: firebase.devMode,
      });
    }
  },
} as const;

/**
 * Async Configuration Loader
 * 
 * Loads sensitive configuration from Secret Manager and validates everything.
 * Call this during application startup.
 */
export async function loadConfiguration(): Promise<{
  database: typeof database & { connectionString: string };
  shopify: typeof shopify & { adminAccessToken: string; webhookSecret: string };
  firebase: typeof firebase & { privateKey: string };
  security: typeof security & { jwtSecret: string };
}> {
  // Validate configuration including secrets
  await validation.validateWithSecrets();
  
  // Load all sensitive values
  const [dbPassword, shopifyToken, shopifyWebhook, firebaseKey, jwtSecret] = await Promise.all([
    database.getPassword(),
    shopify.getAdminAccessToken(),
    shopify.getWebhookSecret(),
    firebase.getPrivateKey(),
    security.getJwtSecret(),
  ]);
  
  // Return fully loaded configuration with secrets
  return {
    database: {
      ...database,
      connectionString: await database.getConnectionString(),
      password: dbPassword,
    },
    shopify: {
      ...shopify,
      adminAccessToken: shopifyToken,
      webhookSecret: shopifyWebhook,
    },
    firebase: {
      ...firebase,
      privateKey: firebaseKey,
    },
    security: {
      ...security,
      jwtSecret,
    },
  };
}

/**
 * Configuration Helpers
 */
export const config = {
  server,
  database,
  shopify,
  firebase,
  media,
  logging,
  security,
  validation,
  
  // Environment flags
  isProduction,
  isDevelopment,
  isTest,
  environment,
  
  // Async configuration loader
  load: loadConfiguration,
} as const;

// Auto-validate configuration on import (non-test environments)
if (!isTest) {
  validation.logValidation();
}

export default config;