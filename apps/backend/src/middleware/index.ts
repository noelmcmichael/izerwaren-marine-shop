// Re-export all middleware
export * from './validation';
export * from './database';

// Authentication middleware placeholder
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware for API key authentication (placeholder)
 * In production, this would validate API keys or JWT tokens
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

  // For development, allow requests without API key
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key is required. Provide it in X-API-Key header.',
    });
  }

  // Validate API key here
  // For now, accept any non-empty key
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    next();
  } else {
    res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid.',
    });
  }
}

/**
 * Middleware for B2B customer authentication (placeholder)
 */
export function authenticateB2BCustomer(req: Request, res: Response, next: NextFunction) {
  // This would validate B2B customer tokens/sessions
  // For now, just pass through
  next();
}

/**
 * Middleware to log requests for debugging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}
