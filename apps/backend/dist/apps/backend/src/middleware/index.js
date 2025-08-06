"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = authenticateApiKey;
exports.authenticateB2BCustomer = authenticateB2BCustomer;
exports.requestLogger = requestLogger;
// Re-export all middleware
__exportStar(require("./validation"), exports);
__exportStar(require("./database"), exports);
/**
 * Middleware for API key authentication (placeholder)
 * In production, this would validate API keys or JWT tokens
 */
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    // For development, allow requests without API key
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    if (!apiKey) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'API key is required. Provide it in X-API-Key header.',
        });
    }
    // Validate API key here
    // For now, accept any non-empty key
    if (typeof apiKey === 'string' && apiKey.length > 0) {
        next();
    }
    else {
        res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is invalid.',
        });
    }
}
/**
 * Middleware for B2B customer authentication (placeholder)
 */
function authenticateB2BCustomer(req, res, next) {
    // This would validate B2B customer tokens/sessions
    // For now, just pass through
    next();
}
/**
 * Middleware to log requests for debugging
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
}
