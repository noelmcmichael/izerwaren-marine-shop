import { prisma as db } from '@izerwaren/database';
import { Router } from 'express';
import config from '../lib/config';

const router = Router();

/**
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'izerwaren-backend',
    version: '1.0.0',
  });
});

/**
 * Comprehensive health check including database
 */
router.get('/detailed', async (req, res) => {
  try {
    // Test database connection
    const dbCheck = await db.$queryRaw`SELECT 1 as test`;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'izerwaren-backend',
      version: '1.0.0',
      checks: {
        database: dbCheck ? 'connected' : 'disconnected',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        uptime: Math.round(process.uptime()),
        environment: config.environment,
      },
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'izerwaren-backend',
      error: 'Database connection failed',
    });
  }
});

export default router;
