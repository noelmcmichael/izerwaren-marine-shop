"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = void 0;
exports.validateRequest = validateRequest;
exports.asyncHandler = asyncHandler;
const zod_1 = require("zod");
/**
 * Middleware to validate request data against Zod schemas
 */
function validateRequest(schemas) {
    return (req, res, next) => {
        try {
            // Validate request body
            if (schemas.body) {
                const result = schemas.body.safeParse(req.body);
                if (!result.success) {
                    return res.status(400).json({
                        error: 'Invalid request body',
                        details: result.error.issues.map(issue => ({
                            field: issue.path.join('.'),
                            message: issue.message,
                            code: issue.code,
                        })),
                    });
                }
                req.body = result.data;
            }
            // Validate query parameters
            if (schemas.query) {
                const result = schemas.query.safeParse(req.query);
                if (!result.success) {
                    return res.status(400).json({
                        error: 'Invalid query parameters',
                        details: result.error.issues.map(issue => ({
                            field: issue.path.join('.'),
                            message: issue.message,
                            code: issue.code,
                        })),
                    });
                }
                req.query = result.data;
            }
            // Validate path parameters
            if (schemas.params) {
                const result = schemas.params.safeParse(req.params);
                if (!result.success) {
                    return res.status(400).json({
                        error: 'Invalid path parameters',
                        details: result.error.issues.map(issue => ({
                            field: issue.path.join('.'),
                            message: issue.message,
                            code: issue.code,
                        })),
                    });
                }
                req.params = result.data;
            }
            next();
        }
        catch (error) {
            console.error('Validation middleware error:', error);
            res.status(500).json({
                error: 'Validation failed',
                message: 'An error occurred during request validation',
            });
        }
    };
}
/**
 * Middleware to handle async route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Common validation schemas
 */
exports.commonSchemas = {
    uuid: zod_1.z.string().uuid('Invalid UUID format'),
    page: zod_1.z
        .string()
        .optional()
        .transform(val => (val ? parseInt(val, 10) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform(val => (val ? Math.min(parseInt(val, 10) || 20, 100) : 20)),
    search: zod_1.z
        .string()
        .optional()
        .transform(val => val?.trim()),
    status: zod_1.z.enum(['active', 'inactive', 'draft', 'archived']).optional(),
};
