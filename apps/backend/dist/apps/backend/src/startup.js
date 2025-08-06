"use strict";
/**
 * Enhanced Application Startup with Comprehensive Validation
 *
 * Implements fail-fast startup validation with clear error reporting
 * and environment-aware configuration loading.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = initializeApp;
exports.gracefulShutdown = gracefulShutdown;
exports.healthCheck = healthCheck;
const config_1 = require("./lib/config");
const secrets_1 = require("./lib/secrets");
const validation_1 = require("./lib/validation");
/**
 * Initialize application with comprehensive validation
 */
async function initializeApp() {
    const startTime = Date.now();
    console.log('🚀 Initializing Izerwaren Backend...');
    console.log(`📋 Environment: ${config_1.config.environment}`);
    console.log(`⏰ Startup time: ${new Date().toISOString()}`);
    // Phase 1: Comprehensive Startup Validation
    console.log('\\n🔍 Phase 1: Startup Validation');
    const validation = await validation_1.startupValidator.validate();
    // Check for critical errors that prevent startup
    const criticalErrors = validation.errors.filter(e => e.critical);
    if (criticalErrors.length > 0 && config_1.config.isProduction) {
        console.error('\\n🚨 STARTUP FAILED - Critical validation errors in production:');
        criticalErrors.forEach(error => {
            console.error(`   ❌ ${error.field}: ${error.message}`);
            console.error(`      💡 ${error.resolution}`);
        });
        const error = new Error(`Startup validation failed: ${criticalErrors.length} critical errors found`);
        error.validationErrors = criticalErrors;
        throw error;
    }
    try {
        // Phase 2: Configuration and Secret Loading
        console.log('\\n🔧 Phase 2: Configuration Loading');
        const fullConfig = await (0, config_1.loadConfiguration)();
        // Phase 3: Final Configuration Summary
        console.log('\\n📊 Phase 3: Configuration Summary');
        const configSummary = {
            environment: config_1.config.environment,
            serverUrl: config_1.config.server.baseUrl,
            databaseConfigured: !!fullConfig.database.connectionString,
            shopifyConfigured: !!fullConfig.shopify.adminAccessToken,
            firebaseConfigured: !!fullConfig.firebase.privateKey || config_1.config.firebase.useADC,
            jwtConfigured: !!fullConfig.security.jwtSecret,
        };
        console.log('✅ Configuration loaded successfully:', configSummary);
        // Secret cache performance
        const cacheStats = secrets_1.secrets.getCacheStats();
        console.log('💾 Secret cache performance:', cacheStats);
        // Startup timing
        const startupTime = Date.now() - startTime;
        console.log(`⚡ Startup completed in ${startupTime}ms`);
        return {
            config: fullConfig,
            validation,
            isReady: true,
            mode: 'production'
        };
    }
    catch (error) {
        console.error('\\n❌ Configuration loading failed:', error);
        if (config_1.config.isProduction) {
            // In production, fail fast on configuration errors
            console.error('🚨 Production environment - failing fast on configuration error');
            throw error;
        }
        else {
            // In development, attempt fallback mode
            console.warn('\\n⚠️  Development environment - attempting fallback mode');
            return await initializeFallbackMode(validation);
        }
    }
}
/**
 * Initialize in fallback mode (development only)
 */
async function initializeFallbackMode(validation) {
    console.log('🔄 Initializing fallback mode with environment variables...');
    // Basic configuration validation
    config_1.config.validation.logValidation();
    const fallbackConfig = {
        database: {
            ...config_1.config.database,
            connectionString: config_1.config.database.connectionString,
            password: config_1.config.database.password,
        },
        shopify: {
            ...config_1.config.shopify,
            adminAccessToken: config_1.config.shopify.adminAccessToken,
            webhookSecret: config_1.config.shopify.webhookSecret,
        },
        firebase: {
            ...config_1.config.firebase,
            privateKey: config_1.config.firebase.privateKey,
        },
        security: {
            ...config_1.config.security,
            jwtSecret: config_1.config.security.jwtSecret,
        },
    };
    console.log('⚠️  Fallback mode active - using environment variables only');
    console.log('💡 Consider fixing validation errors for optimal performance');
    return {
        config: fallbackConfig,
        validation,
        isReady: false, // Indicates fallback mode
        mode: 'fallback'
    };
}
/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
    console.log(`\\n🛑 Received ${signal}. Starting graceful shutdown...`);
    try {
        // Clear secret cache
        secrets_1.secrets.clearCache();
        console.log('💾 Secret cache cleared');
        // Add other cleanup tasks here (database connections, etc.)
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}
/**
 * Enhanced health check with validation status
 */
async function healthCheck() {
    const startTime = process.hrtime();
    try {
        // Quick validation check
        const validationStatus = await (0, validation_1.quickValidation)();
        // Check secret validation
        const secretValidation = await secrets_1.secrets.validate();
        const cacheStats = secrets_1.secrets.getCacheStats();
        // Check basic configuration
        const configStatus = {
            environment: config_1.config.environment,
            database: config_1.config.database.isConfigured,
            shopify: config_1.config.shopify.isConfigured,
            firebase: config_1.config.firebase.isConfigured,
        };
        // Determine overall health (combining validation and secrets)
        let status = 'healthy';
        if (validationStatus.status === 'unhealthy' || !secretValidation.valid) {
            status = config_1.config.isProduction ? 'unhealthy' : 'degraded';
        }
        else if (validationStatus.status === 'degraded' || secretValidation.warnings.length > 0) {
            status = 'degraded';
        }
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const uptimeReadable = formatUptime(uptimeSeconds);
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const healthCheckDuration = seconds * 1000 + nanoseconds / 1000000;
        console.log(`🏥 Health check completed in ${healthCheckDuration.toFixed(2)}ms - Status: ${status}`);
        return {
            status,
            validation: {
                overall: validationStatus.status,
                issues: validationStatus.issues,
                lastCheck: new Date().toISOString(),
            },
            secrets: {
                available: secretValidation.valid,
                cached: cacheStats.fresh,
                validation: secretValidation,
            },
            config: configStatus,
            uptime: {
                seconds: Math.floor(uptimeSeconds),
                readable: uptimeReadable,
            },
        };
    }
    catch (error) {
        console.error('❌ Health check failed:', error);
        return {
            status: 'unhealthy',
            validation: {
                overall: 'unhealthy',
                issues: 1,
                lastCheck: new Date().toISOString(),
            },
            secrets: {
                available: false,
                cached: 0,
                validation: {
                    valid: false,
                    missing: ['Health check failed'],
                    warnings: [],
                },
            },
            config: {
                environment: config_1.config.environment,
                database: false,
                shopify: false,
                firebase: false,
            },
            uptime: {
                seconds: Math.floor(process.uptime()),
                readable: formatUptime(process.uptime()),
            },
        };
    }
}
/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0)
        parts.push(`${secs}s`);
    return parts.join(' ');
}
