"use strict";
/**
 * GCP Secret Manager Integration Service
 *
 * Provides secure access to sensitive configuration values stored in Google Cloud Secret Manager.
 * Implements caching, fallback to environment variables, and mock support for development.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.secrets = exports.secretManager = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
/**
 * Secret Manager Service Class
 */
class SecretManagerService {
    constructor() {
        this.client = null;
        this.cache = {};
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        // Define all secrets used by the application
        this.secretsConfig = {
            'db-password': {
                name: 'izerwaren-db-password',
                envFallback: 'DB_PASSWORD',
                required: true,
                description: 'Database connection password'
            },
            'shopify-admin-token': {
                name: 'izerwaren-shopify-admin-token',
                envFallback: 'SHOPIFY_ADMIN_ACCESS_TOKEN',
                required: true,
                description: 'Shopify Admin API access token'
            },
            'shopify-webhook-secret': {
                name: 'izerwaren-shopify-webhook-secret',
                envFallback: 'SHOPIFY_WEBHOOK_SECRET',
                required: true,
                description: 'Shopify webhook signing secret'
            },
            'firebase-private-key': {
                name: 'izerwaren-firebase-private-key',
                envFallback: 'FIREBASE_PRIVATE_KEY',
                required: false, // Optional if using ADC
                description: 'Firebase Admin SDK private key'
            },
            'jwt-secret': {
                name: 'izerwaren-jwt-secret',
                envFallback: 'JWT_SECRET',
                required: true,
                description: 'JWT signing secret'
            }
        };
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || '';
        this.isProduction = process.env.NODE_ENV === 'production';
        this.isDevelopment = process.env.NODE_ENV === 'development';
        // Use Secret Manager in production or when explicitly enabled
        this.useSecretManager = this.isProduction || process.env.USE_SECRET_MANAGER === 'true';
        if (this.useSecretManager && this.projectId) {
            try {
                this.client = new secret_manager_1.SecretManagerServiceClient();
            }
            catch (error) {
                console.warn('⚠️  Failed to initialize Secret Manager client:', error);
                console.warn('   Falling back to environment variables');
            }
        }
        if (this.isDevelopment) {
            console.log('🔐 Secret Manager Service initialized:', {
                projectId: this.projectId,
                useSecretManager: this.useSecretManager,
                clientInitialized: !!this.client
            });
        }
    }
    /**
     * Get a secret value with caching and fallback support
     */
    async getSecret(secretKey) {
        const config = this.secretsConfig[secretKey];
        if (!config) {
            throw new Error(`Unknown secret key: ${secretKey}`);
        }
        // Check cache first
        const cached = this.getCachedSecret(secretKey);
        if (cached) {
            return cached;
        }
        let secretValue = null;
        // Try Secret Manager if available
        if (this.client && this.useSecretManager) {
            try {
                secretValue = await this.fetchFromSecretManager(config.name);
                if (secretValue) {
                    this.cacheSecret(secretKey, secretValue);
                    return secretValue;
                }
            }
            catch (error) {
                console.warn(`⚠️  Failed to fetch secret ${secretKey} from Secret Manager:`, error);
            }
        }
        // Fallback to environment variable
        if (config.envFallback) {
            secretValue = process.env[config.envFallback] || null;
            if (secretValue) {
                // Cache environment variable too (for consistency)
                this.cacheSecret(secretKey, secretValue, 60 * 1000); // 1 minute cache for env vars
                return secretValue;
            }
        }
        // Handle required secrets
        if (config.required && !secretValue) {
            const errorMsg = `Required secret '${secretKey}' not found in Secret Manager or environment variable '${config.envFallback}'`;
            if (this.isProduction) {
                throw new Error(errorMsg);
            }
            else {
                console.warn(`⚠️  ${errorMsg}`);
            }
        }
        return secretValue;
    }
    /**
     * Get multiple secrets at once
     */
    async getSecrets(secretKeys) {
        const promises = secretKeys.map(async (key) => ({
            key,
            value: await this.getSecret(key)
        }));
        const results = await Promise.all(promises);
        return results.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
    }
    /**
     * Validate that all required secrets are available
     */
    async validateSecrets() {
        const missing = [];
        const warnings = [];
        for (const [key, config] of Object.entries(this.secretsConfig)) {
            try {
                const value = await this.getSecret(key);
                if (!value && config.required) {
                    missing.push(`${key} (${config.description})`);
                }
                else if (!value) {
                    warnings.push(`${key} (${config.description}) - optional but recommended`);
                }
            }
            catch (error) {
                missing.push(`${key} (${config.description}) - error: ${error}`);
            }
        }
        return {
            valid: missing.length === 0,
            missing,
            warnings
        };
    }
    /**
     * Clear the secrets cache
     */
    clearCache() {
        this.cache = {};
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let expired = 0;
        let fresh = 0;
        Object.values(this.cache).forEach(entry => {
            if (now - entry.timestamp > entry.ttl) {
                expired++;
            }
            else {
                fresh++;
            }
        });
        return {
            total: Object.keys(this.cache).length,
            expired,
            fresh
        };
    }
    /**
     * Private: Fetch secret from Google Cloud Secret Manager
     */
    async fetchFromSecretManager(secretName) {
        if (!this.client || !this.projectId) {
            return null;
        }
        try {
            const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
            const [version] = await this.client.accessSecretVersion({ name });
            if (version.payload?.data) {
                return version.payload.data.toString();
            }
        }
        catch (error) {
            // Log the error but don't throw - we'll fall back to env vars
            console.warn(`Failed to fetch secret ${secretName}:`, error);
        }
        return null;
    }
    /**
     * Private: Get cached secret if still valid
     */
    getCachedSecret(secretKey) {
        const cached = this.cache[secretKey];
        if (!cached) {
            return null;
        }
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            // Cache expired
            delete this.cache[secretKey];
            return null;
        }
        return cached.value;
    }
    /**
     * Private: Cache a secret value
     */
    cacheSecret(secretKey, value, ttl) {
        this.cache[secretKey] = {
            value,
            timestamp: Date.now(),
            ttl: ttl || this.cacheTTL
        };
    }
    /**
     * Get information about configured secrets (for debugging)
     */
    getSecretsInfo() {
        return Object.fromEntries(Object.entries(this.secretsConfig).map(([key, config]) => [
            key,
            {
                name: config.name,
                required: config.required,
                description: config.description
            }
        ]));
    }
}
// Create singleton instance
exports.secretManager = new SecretManagerService();
/**
 * Convenience functions for common secret access patterns
 */
exports.secrets = {
    /**
     * Get database password
     */
    async getDatabasePassword() {
        return exports.secretManager.getSecret('db-password');
    },
    /**
     * Get Shopify admin access token
     */
    async getShopifyAdminToken() {
        return exports.secretManager.getSecret('shopify-admin-token');
    },
    /**
     * Get Shopify webhook secret
     */
    async getShopifyWebhookSecret() {
        return exports.secretManager.getSecret('shopify-webhook-secret');
    },
    /**
     * Get Firebase private key
     */
    async getFirebasePrivateKey() {
        return exports.secretManager.getSecret('firebase-private-key');
    },
    /**
     * Get JWT signing secret
     */
    async getJwtSecret() {
        return exports.secretManager.getSecret('jwt-secret');
    },
    /**
     * Validate all secrets
     */
    async validate() {
        return exports.secretManager.validateSecrets();
    },
    /**
     * Clear secrets cache
     */
    clearCache() {
        exports.secretManager.clearCache();
    },
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return exports.secretManager.getCacheStats();
    }
};
exports.default = exports.secrets;
