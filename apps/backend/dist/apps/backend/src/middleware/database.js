"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseConnection = ensureDatabaseConnection;
exports.addDatabaseToContext = addDatabaseToContext;
exports.withTransaction = withTransaction;
const database_1 = require("@izerwaren/database");
/**
 * Middleware to ensure database connection is available
 */
async function ensureDatabaseConnection(req, res, next) {
    try {
        // Test database connection with a simple query
        await database_1.prisma.$queryRaw `SELECT 1`;
        next();
    }
    catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({
            error: 'Database unavailable',
            message: 'Unable to connect to the database. Please try again later.',
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Middleware to add database connection to request context
 */
function addDatabaseToContext(req, res, next) {
    // Add database client to request for convenience
    req.db = database_1.prisma;
    next();
}
/**
 * Middleware to handle database transaction for routes that need it
 */
function withTransaction(handler) {
    return async (req, res, next) => {
        try {
            await database_1.prisma.$transaction(async (tx) => {
                await handler(req, res, tx);
            });
        }
        catch (error) {
            console.error('Transaction failed:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Transaction failed',
                    message: process.env.NODE_ENV === 'development' ? error.message : 'Database transaction failed',
                });
            }
        }
    };
}
