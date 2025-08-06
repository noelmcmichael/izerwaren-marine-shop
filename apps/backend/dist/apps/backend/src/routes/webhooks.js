"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const config_1 = __importDefault(require("../lib/config"));
const WebhookService_1 = require("../services/WebhookService");
const webhookValidation_1 = require("../middleware/webhookValidation");
// Middleware to parse raw body as JSON for webhooks
const parseWebhookBody = (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
        try {
            req.body = JSON.parse(req.body.toString());
        }
        catch (error) {
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }
    }
    next();
};
const router = (0, express_1.Router)();
const webhookService = new WebhookService_1.WebhookService();
// Webhook payload schemas
const ProductWebhookSchema = zod_1.z.object({
    id: zod_1.z.number(),
    title: zod_1.z.string(),
    handle: zod_1.z.string(),
    body_html: zod_1.z.string().nullable(),
    vendor: zod_1.z.string().nullable(),
    product_type: zod_1.z.string().nullable(),
    status: zod_1.z.enum(['active', 'archived', 'draft']),
    tags: zod_1.z.string().nullable(),
    variants: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.number(),
        title: zod_1.z.string(),
        sku: zod_1.z.string().nullable(),
        price: zod_1.z.string(),
        inventory_quantity: zod_1.z.number(),
        inventory_policy: zod_1.z.enum(['deny', 'continue']),
    })),
    images: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.number(),
        src: zod_1.z.string(),
        alt: zod_1.z.string().nullable(),
        position: zod_1.z.number(),
    })),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
});
const InventoryLevelSchema = zod_1.z.object({
    inventory_item_id: zod_1.z.number(),
    location_id: zod_1.z.number(),
    available: zod_1.z.number(),
    updated_at: zod_1.z.string(),
});
const OrderWebhookSchema = zod_1.z.object({
    id: zod_1.z.number(),
    order_number: zod_1.z.number(),
    email: zod_1.z.string().nullable(),
    customer: zod_1.z.object({
        id: zod_1.z.number(),
        email: zod_1.z.string(),
        first_name: zod_1.z.string().nullable(),
        last_name: zod_1.z.string().nullable(),
    }).nullable(),
    line_items: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.number(),
        variant_id: zod_1.z.number(),
        title: zod_1.z.string(),
        quantity: zod_1.z.number(),
        price: zod_1.z.string(),
        sku: zod_1.z.string().nullable(),
    })),
    total_price: zod_1.z.string(),
    subtotal_price: zod_1.z.string(),
    financial_status: zod_1.z.string(),
    fulfillment_status: zod_1.z.string().nullable(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
});
/**
 * Product Created Webhook
 * POST /webhooks/shopify/products/create
 */
router.post('/shopify/products/create', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('📦 Product Created Webhook received');
        const productData = ProductWebhookSchema.parse(req.body);
        const result = await webhookService.handleProductCreate(productData);
        console.log('✅ Product created successfully:', result.productId);
        res.status(200).json({ success: true, productId: result.productId });
    }
    catch (error) {
        console.error('❌ Product create webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Product create webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Product Updated Webhook
 * POST /webhooks/shopify/products/update
 */
router.post('/shopify/products/update', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('📝 Product Updated Webhook received');
        const productData = ProductWebhookSchema.parse(req.body);
        const result = await webhookService.handleProductUpdate(productData);
        console.log('✅ Product updated successfully:', result.productId);
        res.status(200).json({ success: true, productId: result.productId });
    }
    catch (error) {
        console.error('❌ Product update webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Product update webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Product Deleted Webhook
 * POST /webhooks/shopify/products/delete
 */
router.post('/shopify/products/delete', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('🗑️ Product Deleted Webhook received');
        const deletedProductData = zod_1.z.object({
            id: zod_1.z.number(),
        }).parse(req.body);
        const result = await webhookService.handleProductDelete(deletedProductData.id);
        console.log('✅ Product deleted successfully:', result.productId);
        res.status(200).json({ success: true, productId: result.productId });
    }
    catch (error) {
        console.error('❌ Product delete webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Product delete webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Inventory Level Updated Webhook
 * POST /webhooks/shopify/inventory_levels/update
 */
router.post('/shopify/inventory_levels/update', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('📊 Inventory Level Updated Webhook received');
        const inventoryData = InventoryLevelSchema.parse(req.body);
        const result = await webhookService.handleInventoryUpdate(inventoryData);
        console.log('✅ Inventory updated successfully:', result.variantId);
        res.status(200).json({ success: true, variantId: result.variantId });
    }
    catch (error) {
        console.error('❌ Inventory update webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Inventory update webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Order Created Webhook
 * POST /webhooks/shopify/orders/create
 */
router.post('/shopify/orders/create', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('🛒 Order Created Webhook received');
        const orderData = OrderWebhookSchema.parse(req.body);
        const result = await webhookService.handleOrderCreate(orderData);
        console.log('✅ Order created successfully:', result.orderId);
        res.status(200).json({ success: true, orderId: result.orderId });
    }
    catch (error) {
        console.error('❌ Order create webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Order create webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Order Updated Webhook
 * POST /webhooks/shopify/orders/updated
 */
router.post('/shopify/orders/updated', webhookValidation_1.validateWebhookSignature, parseWebhookBody, async (req, res) => {
    try {
        console.log('📋 Order Updated Webhook received');
        const orderData = OrderWebhookSchema.parse(req.body);
        const result = await webhookService.handleOrderUpdate(orderData);
        console.log('✅ Order updated successfully:', result.orderId);
        res.status(200).json({ success: true, orderId: result.orderId });
    }
    catch (error) {
        console.error('❌ Order update webhook failed:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Invalid webhook payload',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                error: 'Order update webhook processing failed',
                message: config_1.default.isDevelopment ? error.message : undefined,
            });
        }
    }
});
/**
 * Webhook Health Check
 * GET /webhooks/health
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhookSecret: config_1.default.shopify.webhookSecret ? 'configured' : 'missing',
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
exports.default = router;
