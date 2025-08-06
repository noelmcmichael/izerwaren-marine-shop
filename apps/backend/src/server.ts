import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { ensureDatabaseConnection, requestLogger } from './middleware';
import apiRoutes from './routes';
import config from './lib/config';

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: config.security.allowedOrigins,
}));
app.use(morgan(config.logging.format));

// Special handling for webhook routes - preserve raw body for signature validation
app.use('/api/v1/webhooks', express.raw({ type: 'application/json', limit: config.server.bodyLimit }));

// Standard JSON parsing for all other routes
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// Custom middleware
app.use(requestLogger);

// Basic health check (no DB dependency)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: config.server.serviceName,
    version: config.server.version,
  });
});

// API status endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'Izerwaren Backend API v1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: config.environment,
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
app.use('/api/v1', ensureDatabaseConnection, apiRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't send error if response already sent
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
    message: config.isDevelopment ? err.message : 'Something went wrong',
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

app.listen(config.server.port, config.server.host, () => {
  const baseUrl = config.server.baseUrl;
  
  console.log(`🚀 ${config.server.serviceName} running on port ${config.server.port}`);
  console.log(`📡 Health check: ${baseUrl}/health`);
  console.log(`🔗 API status: ${baseUrl}/api/v1/status`);
  console.log(`📊 Detailed health: ${baseUrl}/api/v1/health/detailed`);
  console.log(`📦 Products API: ${baseUrl}/api/v1/products`);
  console.log(`🖼️  Media API: ${baseUrl}/api/v1/media`);
  console.log(`🔄 Sync API: ${baseUrl}/api/v1/sync`);
  console.log(`🔗 Webhooks API: ${baseUrl}/api/v1/webhooks`);
  console.log(`📚 Environment: ${config.environment}`);
  console.log(`🔧 Configuration: Database=${config.database.isConfigured}, Shopify=${config.shopify.isConfigured}, Firebase=${config.firebase.isConfigured}`);
});

export default app;
