"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const middleware_1 = require("./middleware");
const routes_1 = __importDefault(require("./routes"));
const config_1 = __importDefault(require("./lib/config"));
const app = (0, express_1.default)();
// Basic middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.default.security.allowedOrigins,
}));
app.use((0, morgan_1.default)(config_1.default.logging.format));
// Special handling for webhook routes - preserve raw body for signature validation
app.use('/api/v1/webhooks', express_1.default.raw({ type: 'application/json', limit: config_1.default.server.bodyLimit }));
// Standard JSON parsing for all other routes
app.use(express_1.default.json({ limit: config_1.default.server.bodyLimit }));
app.use(express_1.default.urlencoded({ extended: true, limit: config_1.default.server.bodyLimit }));
// Custom middleware
app.use(middleware_1.requestLogger);
// Basic health check (no DB dependency)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: config_1.default.server.serviceName,
        version: config_1.default.server.version,
    });
});
// API status endpoint
app.get('/api/v1/status', (req, res) => {
    res.json({
        message: 'Izerwaren Backend API v1.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: config_1.default.environment,
        endpoints: {
            health: '/health',
            detailedHealth: '/api/v1/health/detailed',
            products: '/api/v1/products',
            media: '/api/v1/media',
            sync: '/api/v1/sync',
            webhooks: '/api/v1/webhooks',
        },
    });
});
// Database-dependent routes
app.use('/api/v1', middleware_1.ensureDatabaseConnection, routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    // Don't send error if response already sent
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({
        error: 'Internal server error',
        message: config_1.default.isDevelopment ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            '/health',
            '/api/v1/status',
            '/api/v1/health',
            '/api/v1/products',
            '/api/v1/media',
            '/api/v1/sync',
            '/api/v1/webhooks',
        ],
    });
});
// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
app.listen(config_1.default.server.port, config_1.default.server.host, () => {
    const baseUrl = config_1.default.server.baseUrl;
    console.log(`🚀 ${config_1.default.server.serviceName} running on port ${config_1.default.server.port}`);
    console.log(`📡 Health check: ${baseUrl}/health`);
    console.log(`🔗 API status: ${baseUrl}/api/v1/status`);
    console.log(`📊 Detailed health: ${baseUrl}/api/v1/health/detailed`);
    console.log(`📦 Products API: ${baseUrl}/api/v1/products`);
    console.log(`🖼️  Media API: ${baseUrl}/api/v1/media`);
    console.log(`🔄 Sync API: ${baseUrl}/api/v1/sync`);
    console.log(`🔗 Webhooks API: ${baseUrl}/api/v1/webhooks`);
    console.log(`📚 Environment: ${config_1.default.environment}`);
    console.log(`🔧 Configuration: Database=${config_1.default.database.isConfigured}, Shopify=${config_1.default.shopify.isConfigured}, Firebase=${config_1.default.firebase.isConfigured}`);
});
exports.default = app;
