"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("@izerwaren/database");
class ProductService {
    /**
     * Get products with advanced filtering and pagination
     */
    static async getProducts(options) {
        const { page = 1, limit = 20, search, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } },
            ];
        }
        if (category) {
            where.categoryName = { contains: category, mode: 'insensitive' };
        }
        if (status) {
            where.status = status.toUpperCase();
        }
        // Build order by clause
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    shopifyVariants: {
                        take: 5,
                        select: {
                            id: true,
                            title: true,
                            sku: true,
                            price: true,
                            inventoryQty: true,
                        },
                    },
                    technicalSpecs: {
                        take: 10,
                        select: {
                            id: true,
                            name: true,
                            value: true,
                            unit: true,
                        },
                    },
                },
                orderBy,
            }),
            database_1.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }
    /**
     * Get single product with full details
     */
    static async getProductById(id) {
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: {
                images: {
                    orderBy: [{ isPrimary: 'desc' }, { imageOrder: 'asc' }],
                },
                shopifyVariants: {
                    include: {},
                },
                technicalSpecs: true,
            },
        });
        if (!product) {
            throw new Error(`Product with ID ${id} not found`);
        }
        return product;
    }
    /**
     * Get product inventory status
     */
    static async getProductInventory(id) {
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                sku: true,
                shopifyVariants: {
                    select: {
                        id: true,
                        title: true,
                        sku: true,
                        inventoryQty: true,
                        price: true,
                    },
                },
            },
        });
        if (!product) {
            throw new Error(`Product with ID ${id} not found`);
        }
        // Calculate total inventory including variants (using placeholder since no inventory on Product)
        const totalInventory = product.shopifyVariants.reduce((sum, variant) => sum + (variant.inventoryQty || 0), 0);
        return {
            ...product,
            totalInventory,
            inStock: totalInventory > 0,
            lowStock: totalInventory > 0 && totalInventory < 10,
        };
    }
    /**
     * Search products with full-text search capabilities
     */
    static async searchProducts(query, options = {}) {
        const { limit = 20, includeSpecs = false } = options;
        const searchTerms = query
            .toLowerCase()
            .split(' ')
            .filter(term => term.length > 2);
        if (searchTerms.length === 0) {
            return { data: [], total: 0 };
        }
        const where = {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
                { categoryName: { contains: query, mode: 'insensitive' } },
                { tags: { has: query } },
            ],
        };
        // If including specs, also search in technical specifications
        if (includeSpecs) {
            where.OR.push({
                technicalSpecs: {
                    some: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { value: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                },
            });
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                take: limit,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    technicalSpecs: includeSpecs
                        ? {
                            where: {
                                OR: [
                                    { name: { contains: query, mode: 'insensitive' } },
                                    { value: { contains: query, mode: 'insensitive' } },
                                ],
                            },
                        }
                        : false,
                },
                orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
            }),
            database_1.prisma.product.count({ where }),
        ]);
        return { data: products, total };
    }
    /**
     * Get products by category with subcategory support
     */
    static async getProductsByCategory(category, options = {}) {
        const { page = 1, limit = 20, includeSubcategories = true } = options;
        const skip = (page - 1) * limit;
        let where;
        if (includeSubcategories) {
            where = {
                OR: [
                    { categoryName: { equals: category, mode: 'insensitive' } },
                    { categoryName: { startsWith: `${category}/`, mode: 'insensitive' } },
                ],
            };
        }
        else {
            where = { categoryName: { equals: category, mode: 'insensitive' } };
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                },
                orderBy: { title: 'asc' },
            }),
            database_1.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.ProductService = ProductService;
exports.default = ProductService;
