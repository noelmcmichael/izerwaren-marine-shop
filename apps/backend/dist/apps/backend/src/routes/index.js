"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const media_1 = __importDefault(require("./media"));
const products_1 = __importDefault(require("./products"));
// import syncRouter from './sync'; // Temporarily disabled
const cart_1 = __importDefault(require("./cart"));
const webhooks_1 = __importDefault(require("./webhooks"));
const router = (0, express_1.Router)();
// API routes
router.use('/health', health_1.default);
router.use('/products', products_1.default);
router.use('/media', media_1.default);
// router.use('/sync', syncRouter); // Temporarily disabled
router.use('/customers/cart', cart_1.default);
router.use('/webhooks', webhooks_1.default);
exports.default = router;
