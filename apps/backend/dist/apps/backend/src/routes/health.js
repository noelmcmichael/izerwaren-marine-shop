"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@izerwaren/database");
const express_1 = require("express");
const config_1 = __importDefault(require("../lib/config"));
const router = (0, express_1.Router)();
/**
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'izerwaren-backend',
        version: '1.0.0',
    });
});
/**
 * Comprehensive health check including database
 */
router.get('/detailed', async (req, res) => {
    try {
        // Test database connection
        const dbCheck = await database_1.prisma.$queryRaw `SELECT 1 as test`;
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'izerwaren-backend',
            version: '1.0.0',
            checks: {
                database: dbCheck ? 'connected' : 'disconnected',
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    unit: 'MB',
                },
                uptime: Math.round(process.uptime()),
                environment: config_1.default.environment,
            },
        };
        res.json(health);
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'izerwaren-backend',
            error: 'Database connection failed',
        });
    }
});
exports.default = router;
