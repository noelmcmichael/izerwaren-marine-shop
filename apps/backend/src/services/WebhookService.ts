import { prisma as db } from '@izerwaren/database';
import { z } from 'zod';

// Webhook payload types (matching the schemas from routes)
type ProductWebhookData = z.infer<typeof ProductWebhookSchema>;
type InventoryLevelData = z.infer<typeof InventoryLevelSchema>;
type OrderWebhookData = z.infer<typeof OrderWebhookSchema>;

const ProductWebhookSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullable(),
  vendor: z.string().nullable(),
  product_type: z.string().nullable(),
  status: z.enum(['active', 'archived', 'draft']),
  tags: z.string().nullable(),
  variants: z.array(z.object({
    id: z.number(),
    title: z.string(),
    sku: z.string().nullable(),
    price: z.string(),
    inventory_quantity: z.number(),
    inventory_policy: z.enum(['deny', 'continue']),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string().nullable(),
    position: z.number(),
  })),
  created_at: z.string(),
  updated_at: z.string(),
});

const InventoryLevelSchema = z.object({
  inventory_item_id: z.number(),
  location_id: z.number(),
  available: z.number(),
  updated_at: z.string(),
});

const OrderWebhookSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  email: z.string().nullable(),
  customer: z.object({
    id: z.number(),
    email: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }).nullable(),
  line_items: z.array(z.object({
    id: z.number(),
    variant_id: z.number(),
    title: z.string(),
    quantity: z.number(),
    price: z.string(),
    sku: z.string().nullable(),
  })),
  total_price: z.string(),
  subtotal_price: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

interface WebhookResult {
  success: boolean;
  productId?: string;
  variantId?: string;
  orderId?: string;
  error?: string;
}

export class WebhookService {
  /**
   * Handle product creation webhook from Shopify
   */
  async handleProductCreate(productData: ProductWebhookData): Promise<WebhookResult> {
    try {
      console.log('🔄 Processing product creation:', productData.title);

      // Check if product already exists
      const existingProduct = await db.product.findFirst({
        where: { shopifyProductId: productData.id.toString() }
      });

      if (existingProduct) {
        console.log('⚠️ Product already exists, updating instead');
        return this.handleProductUpdate(productData);
      }

      // Create new product
      const product = await db.product.create({
        data: {
          title: productData.title,
          description: productData.body_html || '',
          sku: productData.variants[0]?.sku || `shopify-${productData.id}`,
          price: parseFloat(productData.variants[0]?.price || '0'),
          status: this.mapShopifyStatus(productData.status),
          vendor: productData.vendor || '',
          categoryName: productData.product_type || 'General',
          shopifyProductId: productData.id.toString(),
          handle: productData.handle,
        }
      });

      // Create variants
      for (const variantData of productData.variants) {
        await db.productVariant.create({
          data: {
            productId: product.id,
            title: variantData.title,
            sku: variantData.sku || `${product.sku}-${variantData.id}`,
            price: parseFloat(variantData.price),
            inventoryQty: variantData.inventory_quantity,
            shopifyVariantId: variantData.id.toString(),
          }
        });
      }

      // Create images
      for (const imageData of productData.images) {
        await db.productImage.create({
          data: {
            productId: product.id,
            imageUrl: imageData.src,
            localPath: `/images/${imageData.id}`,
            imageOrder: imageData.position,
            isPrimary: imageData.position === 1,
          }
        });
      }

      // Log the sync
      await this.logWebhookEvent('product_create', 'SUCCESS', product.id, productData.id.toString());

      console.log('✅ Product created successfully:', product.id);
      return { success: true, productId: product.id };

    } catch (error) {
      console.error('❌ Product create error:', error);
      await this.logWebhookEvent('product_create', 'ERROR', null, productData.id.toString(), (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle product update webhook from Shopify
   */
  async handleProductUpdate(productData: ProductWebhookData): Promise<WebhookResult> {
    try {
      console.log('🔄 Processing product update:', productData.title);

      // Find existing product
      const existingProduct = await db.product.findFirst({
        where: { shopifyProductId: productData.id.toString() }
      });

      if (!existingProduct) {
        console.log('⚠️ Product not found, creating instead');
        return this.handleProductCreate(productData);
      }

      // Update product
      const product = await db.product.update({
        where: { id: existingProduct.id },
        data: {
          title: productData.title,
          description: productData.body_html || '',
          price: parseFloat(productData.variants[0]?.price || '0'),
          status: this.mapShopifyStatus(productData.status),
          vendor: productData.vendor || '',
          categoryName: productData.product_type || 'General',
          handle: productData.handle,
        }
      });

      // Update or create variants
      for (const variantData of productData.variants) {
        await db.productVariant.upsert({
          where: { shopifyVariantId: variantData.id.toString() },
          update: {
            title: variantData.title,
            price: parseFloat(variantData.price),
            inventoryQty: variantData.inventory_quantity,
          },
          create: {
            productId: product.id,
            title: variantData.title,
            sku: variantData.sku || `${product.sku}-${variantData.id}`,
            price: parseFloat(variantData.price),
            inventoryQty: variantData.inventory_quantity,
            shopifyVariantId: variantData.id.toString(),
          }
        });
      }

      // Update images (simple approach: delete and recreate)
      await db.productImage.deleteMany({
        where: { productId: product.id }
      });

      for (const imageData of productData.images) {
        await db.productImage.create({
          data: {
            productId: product.id,
            imageUrl: imageData.src,
            localPath: `/images/${imageData.id}`,
            imageOrder: imageData.position,
            isPrimary: imageData.position === 1,
          }
        });
      }

      await this.logWebhookEvent('product_update', 'SUCCESS', product.id, productData.id.toString());

      console.log('✅ Product updated successfully:', product.id);
      return { success: true, productId: product.id };

    } catch (error) {
      console.error('❌ Product update error:', error);
      await this.logWebhookEvent('product_update', 'ERROR', null, productData.id.toString(), (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle product deletion webhook from Shopify
   */
  async handleProductDelete(shopifyProductId: number): Promise<WebhookResult> {
    try {
      console.log('🗑️ Processing product deletion:', shopifyProductId);

      const existingProduct = await db.product.findFirst({
        where: { shopifyProductId: shopifyProductId.toString() }
      });

      if (!existingProduct) {
        console.log('⚠️ Product not found for deletion');
        return { success: true, productId: 'not-found' };
      }

      // Soft delete approach - mark as archived
      const product = await db.product.update({
        where: { id: existingProduct.id },
        data: {
          status: 'archived',
          shopifyProductId: null, // Unlink from Shopify
        }
      });

      await this.logWebhookEvent('product_delete', 'SUCCESS', product.id, shopifyProductId.toString());

      console.log('✅ Product archived successfully:', product.id);
      return { success: true, productId: product.id };

    } catch (error) {
      console.error('❌ Product delete error:', error);
      await this.logWebhookEvent('product_delete', 'ERROR', null, shopifyProductId.toString(), (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle inventory level update webhook from Shopify
   */
  async handleInventoryUpdate(inventoryData: InventoryLevelData): Promise<WebhookResult> {
    try {
      console.log('📊 Processing inventory update:', inventoryData.inventory_item_id);

      // Find variant by inventory item ID (this requires mapping)
      // Note: This would need to be enhanced with proper Shopify inventory item mapping
      const variant = await db.productVariant.findFirst({
        where: { 
          // We need to enhance the schema to store inventory_item_id
          // For now, this is a placeholder
          shopifyVariantId: inventoryData.inventory_item_id.toString()
        }
      });

      if (!variant) {
        console.log('⚠️ Variant not found for inventory update');
        return { success: true, variantId: 'not-found' };
      }

      // Update inventory quantity
      const updatedVariant = await db.productVariant.update({
        where: { id: variant.id },
        data: {
          inventoryQty: inventoryData.available,
        }
      });

      await this.logWebhookEvent('inventory_update', 'SUCCESS', variant.productId, inventoryData.inventory_item_id.toString());

      console.log('✅ Inventory updated successfully:', updatedVariant.id);
      return { success: true, variantId: updatedVariant.id };

    } catch (error) {
      console.error('❌ Inventory update error:', error);
      await this.logWebhookEvent('inventory_update', 'ERROR', null, inventoryData.inventory_item_id.toString(), (error as Error).message);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle order creation webhook from Shopify
   */
  async handleOrderCreate(orderData: OrderWebhookData): Promise<WebhookResult> {
    try {
      console.log('🛒 Processing order creation:', orderData.order_number);
      
      // TODO: Implement order tracking when schema is ready
      console.log('⚠️ Order tracking not implemented yet');
      return { success: true, orderId: 'pending-implementation' };

      /*
      // Check if order already exists
      const existingOrder = await db.shopifyOrder.findFirst({
        where: { shopifyOrderId: orderData.id.toString() }
      });

      if (existingOrder) {
        console.log('⚠️ Order already exists');
        return { success: true, orderId: existingOrder.id };
      }

      // Create order record
      const order = await db.shopifyOrder.create({
        data: {
          shopifyOrderId: orderData.id.toString(),
          orderNumber: orderData.order_number.toString(),
          customerEmail: orderData.email || '',
          totalPrice: parseFloat(orderData.total_price),
          subtotalPrice: parseFloat(orderData.subtotal_price),
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status || 'unfulfilled',
          shopifyCreatedAt: new Date(orderData.created_at),
          shopifyUpdatedAt: new Date(orderData.updated_at),
        }
      });

      await this.logWebhookEvent('order_create', 'SUCCESS', null, orderData.id.toString());

      console.log('✅ Order created successfully:', order.id);
      return { success: true, orderId: order.id };
      */

    } catch (error) {
      console.error('❌ Order create error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle order update webhook from Shopify
   */
  async handleOrderUpdate(orderData: OrderWebhookData): Promise<WebhookResult> {
    try {
      console.log('📋 Processing order update:', orderData.order_number);
      
      // TODO: Implement order tracking when schema is ready
      console.log('⚠️ Order tracking not implemented yet');
      return { success: true, orderId: 'pending-implementation' };

      /*
      const existingOrder = await db.shopifyOrder.findFirst({
        where: { shopifyOrderId: orderData.id.toString() }
      });

      if (!existingOrder) {
        console.log('⚠️ Order not found, creating instead');
        return this.handleOrderCreate(orderData);
      }

      // Update order
      const order = await db.shopifyOrder.update({
        where: { id: existingOrder.id },
        data: {
          totalPrice: parseFloat(orderData.total_price),
          subtotalPrice: parseFloat(orderData.subtotal_price),
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status || 'unfulfilled',
          shopifyUpdatedAt: new Date(orderData.updated_at),
        }
      });

      await this.logWebhookEvent('order_update', 'SUCCESS', null, orderData.id.toString());

      console.log('✅ Order updated successfully:', order.id);
      return { success: true, orderId: order.id };
      */

    } catch (error) {
      console.error('❌ Order update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Map Shopify status to our internal status
   */
  private mapShopifyStatus(shopifyStatus: string): string {
    switch (shopifyStatus) {
      case 'active':
        return 'active';
      case 'archived':
        return 'archived';
      case 'draft':
        return 'draft';
      default:
        return 'draft';
    }
  }

  /**
   * Log webhook events for debugging and monitoring
   */
  private async logWebhookEvent(
    operation: string,
    status: 'SUCCESS' | 'ERROR',
    productId: string | null,
    shopifyId: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Map operation strings to valid enum values
      const validOperation = operation.includes('create') ? 'CREATE' : 
                           operation.includes('update') ? 'UPDATE' : 
                           operation.includes('delete') ? 'DELETE' : 'UPDATE';
      
      // Map status to valid enum values
      const validStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
      
      await db.productSyncLog.create({
        data: {
          operation: validOperation as any,
          status: validStatus as any,
          productId,
          shopifyProductId: shopifyId,
          errorMessage,
        }
      });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }
}

export default WebhookService;