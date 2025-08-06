"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@izerwaren/database");
const config_1 = __importDefault(require("../lib/config"));
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Validation schemas
const mediaParamsSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
const mediaQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['image', 'pdf']).optional(),
    productId: zod_1.z.string().min(1).optional(),
    page: zod_1.z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 20)),
});
/**
 * Get all media files with filtering
 * GET /api/v1/media
 */
router.get('/', (0, validation_1.validateRequest)({ query: mediaQuerySchema }), async (req, res) => {
    try {
        const parsedQuery = mediaQuerySchema.parse(req.query);
        const { type, productId, page, limit } = parsedQuery;
        const skip = (page - 1) * limit;
        if (type === 'image') {
            // Get product images
            const where = {};
            if (productId) {
                where.productId = productId;
            }
            const [images, total] = await Promise.all([
                database_1.prisma.productImage.findMany({
                    where,
                    include: {
                        product: {
                            select: { id: true, title: true, sku: true },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: [{ isPrimary: 'desc' }, { imageOrder: 'asc' }],
                }),
                database_1.prisma.productImage.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.json({
                data: images,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            });
        }
        else if (type === 'pdf') {
            // Get PDF files
            const where = {};
            if (productId) {
                where.productId = productId;
            }
            const [pdfs, total] = await Promise.all([
                database_1.prisma.productCatalog.findMany({
                    where,
                    include: {
                        product: {
                            select: { id: true, title: true, sku: true },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { id: 'desc' },
                }),
                database_1.prisma.productCatalog.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.json({
                data: pdfs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            });
        }
        else {
            // Get all media types summary
            const [imageCount, pdfCount] = await Promise.all([database_1.prisma.productImage.count(), database_1.prisma.productCatalog.count()]);
            res.json({
                data: {
                    summary: {
                        images: imageCount,
                        pdfs: pdfCount,
                        total: imageCount + pdfCount,
                    },
                },
            });
        }
    }
    catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({
            error: 'Failed to fetch media',
            message: config_1.default.isDevelopment ? error.message : undefined,
        });
    }
});
/**
 * Get specific image by ID
 * GET /api/v1/media/images/:id
 */
router.get('/images/:id', (0, validation_1.validateRequest)({ params: mediaParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const image = await database_1.prisma.productImage.findUnique({
            where: { id },
            include: {
                product: {
                    select: { id: true, title: true, sku: true },
                },
            },
        });
        if (!image) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with ID ${id} does not exist`,
            });
        }
        res.json({ data: image });
    }
    catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).json({
            error: 'Failed to fetch image',
            message: config_1.default.isDevelopment ? error.message : undefined,
        });
    }
});
/**
 * Get specific PDF by ID
 * GET /api/v1/media/pdfs/:id
 */
router.get('/pdfs/:id', (0, validation_1.validateRequest)({ params: mediaParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const pdf = await database_1.prisma.productCatalog.findUnique({
            where: { id },
            include: {
                product: {
                    select: { id: true, title: true, sku: true },
                },
            },
        });
        if (!pdf) {
            return res.status(404).json({
                error: 'PDF not found',
                message: `PDF with ID ${id} does not exist`,
            });
        }
        res.json({ data: pdf });
    }
    catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).json({
            error: 'Failed to fetch PDF',
            message: config_1.default.isDevelopment ? error.message : undefined,
        });
    }
});
/**
 * Get media statistics
 * GET /api/v1/media/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalImages, totalPdfs, primaryImages, galleryImages, imagesByProduct, pdfsByProduct] = await Promise.all([
            database_1.prisma.productImage.count(),
            database_1.prisma.productCatalog.count(),
            database_1.prisma.productImage.count({ where: { isPrimary: true } }),
            database_1.prisma.productImage.count({ where: { isPrimary: false } }),
            database_1.prisma.productImage.groupBy({
                by: ['productId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            database_1.prisma.productCatalog.groupBy({
                by: ['productId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);
        const stats = {
            images: {
                total: totalImages,
                primary: primaryImages,
                gallery: galleryImages,
                topProductsByImages: imagesByProduct.map(item => ({
                    productId: item.productId,
                    count: item._count.id,
                })),
            },
            pdfs: {
                total: totalPdfs,
                topProductsByPdfs: pdfsByProduct.map(item => ({
                    productId: item.productId,
                    count: item._count.id,
                })),
            },
            summary: {
                totalMediaFiles: totalImages + totalPdfs,
                averageImagesPerProduct: totalImages > 0 ? Math.round((totalImages / primaryImages) * 100) / 100 : 0,
            },
        };
        res.json({ data: stats });
    }
    catch (error) {
        console.error('Error fetching media stats:', error);
        res.status(500).json({
            error: 'Failed to fetch media statistics',
            message: config_1.default.isDevelopment ? error.message : undefined,
        });
    }
});
/**
 * Get CDN URLs for images (preparation for CDN integration)
 * GET /api/v1/media/cdn/images/:id
 */
router.get('/cdn/images/:id', (0, validation_1.validateRequest)({ params: mediaParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const image = await database_1.prisma.productImage.findUnique({
            where: { id },
            select: {
                id: true,
                imageUrl: true,
                localPath: true,
                productId: true,
                product: {
                    select: { id: true, sku: true },
                },
            },
        });
        if (!image) {
            return res.status(404).json({
                error: 'Image not found',
            });
        }
        // Future: Generate CDN URLs based on storage tier
        const cdnUrls = {
            original: image.imageUrl || '',
            thumbnail: image.imageUrl ? image.imageUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '_thumb.$1') : '',
            medium: image.imageUrl ? image.imageUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '_medium.$1') : '',
            large: image.imageUrl ? image.imageUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '_large.$1') : '',
            shopify: null, // shopifyImageId not in current schema
        };
        res.json({
            data: {
                id: image.id,
                filename: image.localPath,
                urls: cdnUrls,
                product: image.product,
            },
        });
    }
    catch (error) {
        console.error('Error generating CDN URLs:', error);
        res.status(500).json({
            error: 'Failed to generate CDN URLs',
            message: config_1.default.isDevelopment ? error.message : undefined,
        });
    }
});
exports.default = router;
