"use strict";
/**
 * Backend Dependency Test Route for Task 1.7
 * Tests Express, Zod, and basic backend functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Zod validation schemas
const TestRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    email: zod_1.z.string().email().optional(),
    count: zod_1.z.number().int().min(0).optional(),
});
const TestQuerySchema = zod_1.z.object({
    format: zod_1.z.enum(['json', 'text']).default('json'),
    include: zod_1.z.string().optional(),
});
/**
 * GET /test-dependencies
 * Basic endpoint to test Express routing and response
 */
router.get('/', (req, res) => {
    try {
        // Test query parameter validation with Zod
        const query = TestQuerySchema.parse(req.query);
        const testData = {
            status: 'success',
            message: 'Backend dependencies test passed',
            timestamp: new Date().toISOString(),
            dependencies: {
                express: '✅ Express routing working',
                zod: '✅ Zod validation working',
                typescript: '✅ TypeScript compilation working',
            },
            query: query,
            environment: process.env.NODE_ENV || 'development',
        };
        if (query.format === 'text') {
            res.setHeader('Content-Type', 'text/plain');
            res.send(`
Backend Dependencies Test Results:
=================================
Status: ${testData.status}
Message: ${testData.message}
Timestamp: ${testData.timestamp}
Environment: ${testData.environment}

Dependencies:
- ${testData.dependencies.express}
- ${testData.dependencies.zod}
- ${testData.dependencies.typescript}
      `.trim());
        }
        else {
            res.json(testData);
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid query parameters',
                errors: error.errors,
            });
        }
        else {
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
});
/**
 * POST /test-dependencies
 * Test POST endpoint with Zod body validation
 */
router.post('/', (req, res) => {
    try {
        // Test request body validation with Zod
        const validatedData = TestRequestSchema.parse(req.body);
        const response = {
            status: 'success',
            message: 'POST request validation successful',
            timestamp: new Date().toISOString(),
            receivedData: validatedData,
            validationPassed: {
                name: `✅ Name "${validatedData.name}" is valid`,
                email: validatedData.email ? `✅ Email "${validatedData.email}" is valid` : '⚪ Email not provided',
                count: validatedData.count ? `✅ Count ${validatedData.count} is valid` : '⚪ Count not provided',
            },
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                })),
            });
        }
        else {
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
});
/**
 * GET /test-dependencies/info
 * Endpoint to show dependency versions and system info
 */
router.get('/info', (req, res) => {
    try {
        const packageJson = require('../../../package.json');
        res.json({
            status: 'success',
            message: 'Backend dependency information',
            dependencies: {
                express: packageJson.dependencies?.express || 'Not found',
                zod: packageJson.dependencies?.zod || 'Not found',
            },
            devDependencies: {
                typescript: packageJson.devDependencies?.typescript || 'Not found',
                tsx: packageJson.devDependencies?.tsx || 'Not found',
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve dependency information',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
