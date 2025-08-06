/**
 * Backend Dependency Test Route for Task 1.7
 * Tests Express, Zod, and basic backend functionality
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Zod validation schemas
const TestRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  count: z.number().int().min(0).optional(),
});

const TestQuerySchema = z.object({
  format: z.enum(['json', 'text']).default('json'),
  include: z.string().optional(),
});

type TestRequest = z.infer<typeof TestRequestSchema>;
type TestQuery = z.infer<typeof TestQuerySchema>;

/**
 * GET /test-dependencies
 * Basic endpoint to test Express routing and response
 */
router.get('/', (req: Request, res: Response) => {
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
    } else {
      res.json(testData);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    } else {
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
router.post('/', (req: Request, res: Response) => {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      });
    } else {
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
router.get('/info', (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dependency information',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;