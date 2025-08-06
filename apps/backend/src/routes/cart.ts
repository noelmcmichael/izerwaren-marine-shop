import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '@izerwaren/database';
import type { Request, Response } from 'express';

const router = Router();

// Simple mock authentication for development
const mockCustomerId = 'test-customer-id';

// Helper function to build cart summary
function buildCartSummary(cartItems: any[]) {
  const items = cartItems.map(item => ({
    id: item.id,
    shopify_product_id: item.shopifyProductId,
    shopify_variant_id: item.shopifyVariantId,
    sku: item.product?.sku || `SKU-${item.shopifyVariantId}`,
    title: item.product?.title || 'Product',
    variant_title: 'Default',
    image_url: item.product?.images?.[0]?.imageUrl,
    quantity: item.quantity,
    unit_price: Number(item.unitPrice),
    list_price: Number(item.unitPrice) / 0.9, // Show original price before tier discount
    discount_percent: 10, // PREMIUM tier discount
    total_price: Number(item.totalPrice),
    minimum_quantity: 1,
    quantity_increments: 1,
    in_stock: true,
    stock_quantity: 100
  }));

  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  return {
    items,
    item_count: itemCount,
    total_quantity: totalQuantity,
    subtotal,
    total_discount: 0,
    estimated_tax: subtotal * 0.08,
    estimated_shipping: subtotal > 500 ? 0 : 25,
    total_estimated: subtotal + (subtotal * 0.08) + (subtotal > 500 ? 0 : 25),
    tier_discount_percent: 10, // Mock PREMIUM tier
    volume_discounts_applied: [],
    savings_from_list_price: 0
  };
}

// GET /api/v1/customers/cart - Get current cart
router.get('/', async (req: Request, res: Response) => {
  try {
    // For development, create a test customer if it doesn't exist
    let customer = await prisma.dealer.findUnique({
      where: { id: mockCustomerId }
    });

    if (!customer) {
      customer = await prisma.dealer.create({
        data: {
          id: mockCustomerId,
          firebaseUid: 'test-firebase-uid',
          companyName: 'Test Marine Supply Co.',
          contactEmail: 'test@marinesupply.com',
          tier: 'PREMIUM'
        }
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { customerId: mockCustomerId },
      include: {
        product: {
          include: {
            shopifyVariants: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const cartSummary = buildCartSummary(cartItems);
    res.json(cartSummary);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

// POST /api/v1/customers/cart/items - Add item to cart
router.post('/items',
  [
    body('productId').isString().notEmpty(),
    body('variantId').optional().isString(),
    body('quantity').isInt({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { productId, variantId, quantity } = req.body;
      
      // For testing, use productId as variantId if variantId not provided
      const effectiveVariantId = variantId || `${productId}-default`;

      // Check if item already exists
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          customerId_shopifyVariantId: {
            customerId: mockCustomerId,
            shopifyVariantId: effectiveVariantId
          }
        }
      });

      if (existingItem) {
        // Update existing item
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity,
            totalPrice: (existingItem.quantity + quantity) * Number(existingItem.unitPrice)
          }
        });
      } else {
        // Fetch real product to get price and details
        const product = await prisma.product.findUnique({
          where: { shopifyProductId: productId },
          include: {
            images: { take: 1 }
          }
        });

        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        // Calculate price based on tier (mock tier pricing)
        const basePrice = 99.99; // Mock base price - TODO: Get from Shopify API
        const tierDiscount = 0.10; // 10% for PREMIUM tier
        const unitPrice = basePrice * (1 - tierDiscount);

        await prisma.cartItem.create({
          data: {
            customerId: mockCustomerId,
            shopifyProductId: productId,
            shopifyVariantId: effectiveVariantId,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice
          }
        });
      }

      // Return updated cart
      const cartItems = await prisma.cartItem.findMany({
        where: { customerId: mockCustomerId },
        include: {
          product: {
            include: {
              shopifyVariants: true,
              images: true
            }
          }
        }
      });

      const cartSummary = buildCartSummary(cartItems);
      res.json(cartSummary);
    } catch (error) {
      console.error('Add item error:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  }
);

// PATCH /api/v1/customers/cart/items/:itemId - Update quantity
router.patch('/items/:itemId',
  [
    param('itemId').isString().notEmpty(),
    body('quantity').isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity === 0) {
        await prisma.cartItem.delete({
          where: { id: itemId }
        });
      } else {
        const item = await prisma.cartItem.findUnique({
          where: { id: itemId }
        });

        if (!item) {
          return res.status(404).json({ error: 'Cart item not found' });
        }

        await prisma.cartItem.update({
          where: { id: itemId },
          data: {
            quantity,
            totalPrice: quantity * Number(item.unitPrice)
          }
        });
      }

      // Return updated cart
      const cartItems = await prisma.cartItem.findMany({
        where: { customerId: mockCustomerId },
        include: {
          product: {
            include: {
              shopifyVariants: true,
              images: true
            }
          }
        }
      });

      const cartSummary = buildCartSummary(cartItems);
      res.json(cartSummary);
    } catch (error) {
      console.error('Update quantity error:', error);
      res.status(500).json({ error: 'Failed to update quantity' });
    }
  }
);

// DELETE /api/v1/customers/cart/items/:itemId - Remove item
router.delete('/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    // Return updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { customerId: mockCustomerId },
      include: {
        product: {
          include: {
            shopifyVariants: true,
            images: true
          }
        }
      }
    });

    const cartSummary = buildCartSummary(cartItems);
    res.json(cartSummary);
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/v1/customers/cart - Clear cart
router.delete('/', async (req: Request, res: Response) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { customerId: mockCustomerId }
    });

    const cartSummary = buildCartSummary([]);
    res.json(cartSummary);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// POST /api/v1/customers/cart/bulk/add - Add multiple items
router.post('/bulk/add',
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isString().notEmpty(),
    body('items.*.variantId').isString().notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { items } = req.body;

      for (const item of items) {
        try {
          // Check if item already exists
          const existingItem = await prisma.cartItem.findUnique({
            where: {
              customerId_shopifyVariantId: {
                customerId: mockCustomerId,
                shopifyVariantId: item.variantId
              }
            }
          });

          if (existingItem) {
            // Update existing item
            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: existingItem.quantity + item.quantity,
                totalPrice: (existingItem.quantity + item.quantity) * Number(existingItem.unitPrice)
              }
            });
          } else {
            // Create new item
            const unitPrice = 99.99; // Mock price
            await prisma.cartItem.create({
              data: {
                customerId: mockCustomerId,
                shopifyProductId: item.productId,
                shopifyVariantId: item.variantId,
                quantity: item.quantity,
                unitPrice,
                totalPrice: item.quantity * unitPrice
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to add item ${item.productId}:`, (error as Error).message);
        }
      }

      // Return updated cart
      const cartItems = await prisma.cartItem.findMany({
        where: { customerId: mockCustomerId },
        include: {
          product: {
            include: {
              shopifyVariants: true,
              images: true
            }
          }
        }
      });

      const cartSummary = buildCartSummary(cartItems);
      res.json(cartSummary);
    } catch (error) {
      console.error('Bulk add error:', error);
      res.status(500).json({ error: 'Failed to add multiple items' });
    }
  }
);

// Mock endpoints for other cart functionality
router.post('/save', async (req: Request, res: Response) => {
  res.json({ cartId: 'mock-saved-cart-id' });
});

router.get('/saved', async (req: Request, res: Response) => {
  res.json([]);
});

router.get('/validate', async (req: Request, res: Response) => {
  res.json([]);
});

router.get('/export', async (req: Request, res: Response) => {
  res.json({ message: 'Export functionality not implemented yet' });
});

export default router;