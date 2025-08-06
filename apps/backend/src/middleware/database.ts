import { prisma as db } from '@izerwaren/database';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure database connection is available
 */
export async function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  try {
    // Test database connection with a simple query
    await db.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({
      error: 'Database unavailable',
      message: 'Unable to connect to the database. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware to add database connection to request context
 */
export function addDatabaseToContext(req: Request, res: Response, next: NextFunction) {
  // Add database client to request for convenience
  (req as any).db = db;
  next();
}

/**
 * Middleware to handle database transaction for routes that need it
 */
export function withTransaction(handler: (req: Request, res: Response, db: any) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await db.$transaction(async tx => {
        await handler(req, res, tx);
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Transaction failed',
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Database transaction failed',
        });
      }
    }
  };
}
