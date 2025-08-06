"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductPDFSchema = exports.ImageGallerySchema = exports.MediaAssetSchema = void 0;
const zod_1 = require("zod");
exports.MediaAssetSchema = zod_1.z.object({
    id: zod_1.z.number(),
    shopify_product_id: zod_1.z.string().optional(),
    local_product_id: zod_1.z.number(),
    asset_type: zod_1.z.enum(['primary', 'gallery', 'pdf']),
    storage_tier: zod_1.z.enum(['shopify', 'external_cdn', 'secure_docs']),
    file_url: zod_1.z.string().url(),
    cdn_url: zod_1.z.string().url().optional(),
    file_path: zod_1.z.string().optional(),
    file_size: zod_1.z.number().positive().optional(),
    mime_type: zod_1.z.string(),
    image_order: zod_1.z.number().optional(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
exports.ImageGallerySchema = zod_1.z.object({
    product_id: zod_1.z.number(),
    primary_image: exports.MediaAssetSchema.optional(),
    gallery_images: zod_1.z.array(exports.MediaAssetSchema),
    total_images: zod_1.z.number().min(0),
});
exports.ProductPDFSchema = zod_1.z.object({
    id: zod_1.z.number(),
    product_id: zod_1.z.number(),
    title: zod_1.z.string(),
    file_url: zod_1.z.string().url(),
    signed_url: zod_1.z.string().url().optional(),
    file_size: zod_1.z.number().positive(),
    download_count: zod_1.z.number().min(0),
    access_level: zod_1.z.enum(['public', 'customer', 'premium']),
    created_at: zod_1.z.date(),
});
