import { Router } from 'express';

import healthRouter from './health';
import mediaRouter from './media';
import productsRouter from './products';
// import syncRouter from './sync'; // Temporarily disabled
import cartRouter from './cart';
import webhooksRouter from './webhooks';

const router = Router();

// API routes
router.use('/health', healthRouter);
router.use('/products', productsRouter);
router.use('/media', mediaRouter);
// router.use('/sync', syncRouter); // Temporarily disabled
router.use('/customers/cart', cartRouter);
router.use('/webhooks', webhooksRouter);

export default router;
