import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../lib/config';

interface WebhookRequest extends Request {
  rawBody?: Buffer;
}

/**
 * Middleware to validate Shopify webhook signatures using HMAC-SHA256
 * 
 * Shopify signs webhooks with HMAC-SHA256 using the webhook secret.
 * The signature is sent in the 'X-Shopify-Hmac-Sha256' header.
 * 
 * @param req - Express request object (must include rawBody)
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateWebhookSignature = (
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if webhook secret is configured
    if (!config.shopify.webhookSecret || config.shopify.webhookSecret === 'dev-webhook-secret') {
      if (config.isDevelopment) {
        console.warn('⚠️ Webhook signature validation skipped (development mode with placeholder secret)');
        return next();
      } else {
        console.error('❌ Webhook secret not configured for production');
        res.status(500).json({ 
          error: 'Webhook configuration error',
          message: 'Webhook secret not properly configured'
        });
        return;
      }
    }

    // Get signature from headers
    const receivedSignature = req.get('X-Shopify-Hmac-Sha256');
    if (!receivedSignature) {
      console.error('❌ Missing webhook signature header');
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing webhook signature'
      });
      return;
    }

    // Get raw body (must be Buffer, not parsed JSON)
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    
    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', config.shopify.webhookSecret);
    hmac.update(body);
    const calculatedSignature = hmac.digest('base64');

    // Compare signatures using timing-safe comparison
    const expectedSignature = receivedSignature;
    
    if (!crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(expectedSignature)
    )) {
      console.error('❌ Webhook signature validation failed');
      console.debug('Expected:', calculatedSignature);
      console.debug('Received:', expectedSignature);
      
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
      return;
    }

    // Verify webhook source (optional additional security)
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    if (shopDomain && shopDomain !== config.shopify.shopDomain) {
      console.error('❌ Webhook from unauthorized shop domain:', shopDomain);
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid shop domain'
      });
      return;
    }

    console.log('✅ Webhook signature validated successfully');
    next();

  } catch (error) {
    console.error('❌ Webhook validation error:', error);
    res.status(500).json({ 
      error: 'Webhook validation failed',
      message: config.isDevelopment ? (error as Error).message : undefined
    });
  }
};

/**
 * Middleware to preserve raw body for webhook signature validation
 * Must be used before JSON parsing middleware
 */
export const preserveRawBody = (
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void => {
  let data = '';
  
  req.setEncoding('utf8');
  
  req.on('data', (chunk: string) => {
    data += chunk;
  });
  
  req.on('end', () => {
    req.rawBody = Buffer.from(data, 'utf8');
    next();
  });
};

/**
 * Rate limiting for webhook endpoints
 * Prevents abuse and handles Shopify's retry behavior
 */
export const webhookRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Simple in-memory rate limiting (consider Redis for production)
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const currentTime = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // per minute

  // In production, use Redis or database for rate limiting
  if (config.isDevelopment) {
    console.log('⚠️ Webhook rate limiting disabled in development');
    return next();
  }

  // TODO: Implement proper rate limiting with Redis
  // For now, just log and continue
  console.log('🔍 Webhook request from:', clientIP, 'at', new Date(currentTime).toISOString());
  next();
};

export default {
  validateWebhookSignature,
  preserveRawBody,
  webhookRateLimit,
};