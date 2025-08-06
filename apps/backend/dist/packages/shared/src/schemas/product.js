"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalSpecificationSchema = exports.ProductVariantSchema = exports.ProductSchema = void 0;
const zod_1 = require("zod");
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.number(),
    shopify_product_id: zod_1.z.string().optional(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    category_name: zod_1.z.string(),
    manufacturer: zod_1.z.string().optional(),
    sku: zod_1.z.string(),
    status: zod_1.z.enum(['active', 'draft', 'archived']),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
exports.ProductVariantSchema = zod_1.z.object({
    id: zod_1.z.number(),
    product_id: zod_1.z.number(),
    shopify_variant_id: zod_1.z.string().optional(),
    title: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    sku: zod_1.z.string(),
    inventory_quantity: zod_1.z.number().min(0),
    variant_options: zod_1.z.record(zod_1.z.string()),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
exports.TechnicalSpecificationSchema = zod_1.z.object({
    id: zod_1.z.number(),
    product_id: zod_1.z.number(),
    specification: zod_1.z.string(),
    value: zod_1.z.string(),
    unit: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    created_at: zod_1.z.date(),
});
