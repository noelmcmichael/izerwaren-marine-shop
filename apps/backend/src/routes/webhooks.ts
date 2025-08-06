import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import config from '../lib/config';
import { WebhookService } from '../services/WebhookService';
import { validateWebhookSignature } from '../middleware/webhookValidation';

// Middleware to parse raw body as JSON for webhooks
const parseWebhookBody = (req: Request, res: Response, next: Function) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }
  next();
};

const router = Router();
const webhookService = new WebhookService();

// Webhook payload schemas
const ProductWebhookSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullable(),
  vendor: z.string().nullable(),
  product_type: z.string().nullable(),
  status: z.enum(['active', 'archived', 'draft']),
  tags: z.string().nullable(),
  variants: z.array(z.object({
    id: z.number(),
    title: z.string(),
    sku: z.string().nullable(),
    price: z.string(),
    inventory_quantity: z.number(),
    inventory_policy: z.enum(['deny', 'continue']),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string().nullable(),
    position: z.number(),
  })),
  created_at: z.string(),
  updated_at: z.string(),
});

const InventoryLevelSchema = z.object({
  inventory_item_id: z.number(),
  location_id: z.number(),
  available: z.number(),
  updated_at: z.string(),
});

const OrderWebhookSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  email: z.string().nullable(),
  customer: z.object({
    id: z.number(),
    email: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }).nullable(),
  line_items: z.array(z.object({
    id: z.number(),
    variant_id: z.number(),
    title: z.string(),
    quantity: z.number(),
    price: z.string(),
    sku: z.string().nullable(),
  })),
  total_price: z.string(),
  subtotal_price: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Product Created Webhook
 * POST /webhooks/shopify/products/create
 */
router.post('/shopify/products/create', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('📦 Product Created Webhook received');
    
    const productData = ProductWebhookSchema.parse(req.body);
    
    const result = await webhookService.handleProductCreate(productData);
    
    console.log('✅ Product created successfully:', result.productId);
    res.status(200).json({ success: true, productId: result.productId });
    
  } catch (error) {
    console.error('❌ Product create webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Product create webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Product Updated Webhook  
 * POST /webhooks/shopify/products/update
 */
router.post('/shopify/products/update', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('📝 Product Updated Webhook received');
    
    const productData = ProductWebhookSchema.parse(req.body);
    
    const result = await webhookService.handleProductUpdate(productData);
    
    console.log('✅ Product updated successfully:', result.productId);
    res.status(200).json({ success: true, productId: result.productId });
    
  } catch (error) {
    console.error('❌ Product update webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Product update webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Product Deleted Webhook
 * POST /webhooks/shopify/products/delete
 */
router.post('/shopify/products/delete', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('🗑️ Product Deleted Webhook received');
    
    const deletedProductData = z.object({
      id: z.number(),
    }).parse(req.body);
    
    const result = await webhookService.handleProductDelete(deletedProductData.id);
    
    console.log('✅ Product deleted successfully:', result.productId);
    res.status(200).json({ success: true, productId: result.productId });
    
  } catch (error) {
    console.error('❌ Product delete webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Product delete webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Inventory Level Updated Webhook
 * POST /webhooks/shopify/inventory_levels/update
 */
router.post('/shopify/inventory_levels/update', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('📊 Inventory Level Updated Webhook received');
    
    const inventoryData = InventoryLevelSchema.parse(req.body);
    
    const result = await webhookService.handleInventoryUpdate(inventoryData);
    
    console.log('✅ Inventory updated successfully:', result.variantId);
    res.status(200).json({ success: true, variantId: result.variantId });
    
  } catch (error) {
    console.error('❌ Inventory update webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Inventory update webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Order Created Webhook
 * POST /webhooks/shopify/orders/create
 */
router.post('/shopify/orders/create', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('🛒 Order Created Webhook received');
    
    const orderData = OrderWebhookSchema.parse(req.body);
    
    const result = await webhookService.handleOrderCreate(orderData);
    
    console.log('✅ Order created successfully:', result.orderId);
    res.status(200).json({ success: true, orderId: result.orderId });
    
  } catch (error) {
    console.error('❌ Order create webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Order create webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Order Updated Webhook
 * POST /webhooks/shopify/orders/updated
 */
router.post('/shopify/orders/updated', validateWebhookSignature, parseWebhookBody, async (req: Request, res: Response) => {
  try {
    console.log('📋 Order Updated Webhook received');
    
    const orderData = OrderWebhookSchema.parse(req.body);
    
    const result = await webhookService.handleOrderUpdate(orderData);
    
    console.log('✅ Order updated successfully:', result.orderId);
    res.status(200).json({ success: true, orderId: result.orderId });
    
  } catch (error) {
    console.error('❌ Order update webhook failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid webhook payload', 
        details: error.errors 
      });
    } else {
      res.status(500).json({ 
        error: 'Order update webhook processing failed',
        message: config.isDevelopment ? (error as Error).message : undefined,
      });
    }
  }
});

/**
 * Webhook Health Check
 * GET /webhooks/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookSecret: config.shopify.webhookSecret ? 'configured' : 'missing',
    endpoints: [
      'POST /webhooks/shopify/products/create',
      'POST /webhooks/shopify/products/update', 
      'POST /webhooks/shopify/products/delete',
      'POST /webhooks/shopify/inventory_levels/update',
      'POST /webhooks/shopify/orders/create',
      'POST /webhooks/shopify/orders/updated',
    ],
  });
});

export default router;