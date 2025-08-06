"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSearchResponseSchema = exports.SearchParamsSchema = exports.PaginationSchema = exports.ApiResponseSchema = void 0;
const zod_1 = require("zod");
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1),
    limit: zod_1.z.number().min(1).max(100),
    total: zod_1.z.number().min(0),
    totalPages: zod_1.z.number().min(0),
});
exports.SearchParamsSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    minPrice: zod_1.z.number().min(0).optional(),
    maxPrice: zod_1.z.number().min(0).optional(),
    manufacturer: zod_1.z.string().optional(),
    inStock: zod_1.z.boolean().optional(),
});
exports.ProductSearchResponseSchema = zod_1.z.object({
    products: zod_1.z.array(zod_1.z.any()), // Will be typed properly with Product schema
    pagination: exports.PaginationSchema,
    filters: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.string()),
        manufacturers: zod_1.z.array(zod_1.z.string()),
        priceRange: zod_1.z.object({
            min: zod_1.z.number(),
            max: zod_1.z.number(),
        }),
    }),
});
