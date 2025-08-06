import { upsertProduct, upsertProductVariant, logSyncOperation } from '@/lib/db';
import {
  getAdminApiClient,
  adminRateLimiter,
  PRODUCT_CREATE_MUTATION,
  PRODUCT_BULK_QUERY,
} from '@/lib/shopify';
import type { ShopifyProduct, ShopifyProductVariant } from '@/lib/shopify';

// JSON feed data structure (based on existing 1050 SKU feed)
export interface JsonFeedProduct {
  sku: string;
  title: string;
  description?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  price: number;
  compare_at_price?: number;
  inventory_quantity?: number;
  weight?: number;
  weight_unit?: string;
  image_url?: string;
  variant_title?: string;
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  operations: SyncOperation[];
}

export interface SyncOperation {
  type: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  sku: string;
  productTitle: string;
  message: string;
  shopifyProductId?: string;
}

export class ProductSyncService {
  private batchId: string;

  constructor() {
    this.batchId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main sync function: JSON feed → Shopify → Local shadow tables
   */
  async syncProducts(jsonFeedData: JsonFeedProduct[]): Promise<SyncResult> {
    console.log(`Starting product sync batch: ${this.batchId}`);
    console.log(`Processing ${jsonFeedData.length} products from JSON feed`);

    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      errors: 0,
      operations: [],
    };

    try {
      // Get existing Shopify products for comparison
      const existingProducts = await this.fetchShopifyProducts();
      const existingBySku = new Map<string, ShopifyProduct>();

      existingProducts.forEach(product => {
        product.variants.forEach(variant => {
          if (variant.sku) {
            existingBySku.set(variant.sku, product);
          }
        });
      });

      // Process JSON feed in batches
      const batchSize = 50; // Conservative batch size to avoid rate limits
      const batches = this.chunkArray(jsonFeedData, batchSize);

      for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        const batchResult = await this.processBatch(batches[i], existingBySku);

        result.created += batchResult.created;
        result.updated += batchResult.updated;
        result.errors += batchResult.errors;
        result.operations.push(...batchResult.operations);

        // Rate limiting between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Sync batch ${this.batchId} completed:`, {
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      });
    } catch (error) {
      console.error('Sync batch failed:', error);
      result.success = false;

      await logSyncOperation({
        operation: 'CREATE',
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Process a batch of products
   */
  private async processBatch(
    products: JsonFeedProduct[],
    existingBySku: Map<string, ShopifyProduct>
  ): Promise<Omit<SyncResult, 'success'>> {
    const result = {
      created: 0,
      updated: 0,
      errors: 0,
      operations: [] as SyncOperation[],
    };

    for (const product of products) {
      try {
        await adminRateLimiter.consume(1);

        const existing = existingBySku.get(product.sku);

        if (existing) {
          // Update existing product
          const updateResult = await this.updateProduct(existing, product);
          if (updateResult.success) {
            result.updated++;
            result.operations.push({
              type: 'UPDATE',
              sku: product.sku,
              productTitle: product.title,
              message: 'Product updated successfully',
              shopifyProductId: existing.id,
            });
          } else {
            result.errors++;
            result.operations.push({
              type: 'ERROR',
              sku: product.sku,
              productTitle: product.title,
              message: updateResult.error || 'Update failed',
            });
          }
        } else {
          // Create new product
          const createResult = await this.createProduct(product);
          if (createResult.success) {
            result.created++;
            result.operations.push({
              type: 'CREATE',
              sku: product.sku,
              productTitle: product.title,
              message: 'Product created successfully',
              shopifyProductId: createResult.productId,
            });
          } else {
            result.errors++;
            result.operations.push({
              type: 'ERROR',
              sku: product.sku,
              productTitle: product.title,
              message: createResult.error || 'Creation failed',
            });
          }
        }
      } catch (error) {
        result.errors++;
        result.operations.push({
          type: 'ERROR',
          sku: product.sku,
          productTitle: product.title,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Create new product in Shopify and update local shadow table
   */
  private async createProduct(product: JsonFeedProduct): Promise<{
    success: boolean;
    productId?: string;
    error?: string;
  }> {
    try {
      const handle = this.generateHandle(product.title);

      const productInput = {
        title: product.title,
        handle: handle,
        descriptionHtml: product.description || '',
        vendor: product.vendor || '',
        productType: product.product_type || '',
        tags: product.tags || [],
        variants: [
          {
            sku: product.sku,
            title: product.variant_title || 'Default Title',
            price: product.price.toString(),
            compareAtPrice: product.compare_at_price?.toString(),
            inventoryQuantity: product.inventory_quantity || 0,
            weight: product.weight,
            weightUnit: product.weight_unit || 'lb',
            requiresShipping: true,
            trackQuantity: true,
          },
        ],
      };

      const adminApiClient = getAdminApiClient();
      const response = await adminApiClient.query({
        data: {
          query: PRODUCT_CREATE_MUTATION,
          variables: { input: productInput },
        },
      });

      const responseBody = response.body as { data: { productCreate: any } };
      const { productCreate } = responseBody.data;

      if (productCreate.userErrors && productCreate.userErrors.length > 0) {
        const errorMessage = productCreate.userErrors[0].message;
        await logSyncOperation({
          operation: 'CREATE',
          status: 'FAILED',
          errorMessage,
          sourceData: product,
        });
        return { success: false, error: errorMessage };
      }

      const shopifyProduct = productCreate.product;

      // Update local shadow table
      const localProduct = await upsertProduct({
        shopifyProductId: shopifyProduct.id,
        title: product.title,
        handle: handle,
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags || [],
        description: product.description,
        status: 'active',
      });

      // Log successful operation
      await logSyncOperation({
        productId: localProduct.id,
        shopifyProductId: shopifyProduct.id,
        operation: 'CREATE',
        status: 'SUCCESS',
        sourceData: product,
      });

      return { success: true, productId: shopifyProduct.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logSyncOperation({
        operation: 'CREATE',
        status: 'FAILED',
        errorMessage,
        sourceData: product,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update existing product in Shopify and local shadow table
   */
  private async updateProduct(
    existing: ShopifyProduct,
    update: JsonFeedProduct
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // For now, just update local shadow table
      // Full Shopify updates will be implemented in Phase 3
      await upsertProduct({
        shopifyProductId: existing.id,
        title: update.title,
        handle: existing.handle,
        vendor: update.vendor,
        productType: update.product_type,
        tags: update.tags || [],
        description: update.description,
        status: 'active',
      });

      await logSyncOperation({
        shopifyProductId: existing.id,
        operation: 'UPDATE',
        status: 'SUCCESS',
        sourceData: update,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logSyncOperation({
        shopifyProductId: existing.id,
        operation: 'UPDATE',
        status: 'FAILED',
        errorMessage,
        sourceData: update,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fetch all products from Shopify using bulk operations
   */
  private async fetchShopifyProducts(): Promise<ShopifyProduct[]> {
    try {
      const adminApiClient = getAdminApiClient();
      const response = await adminApiClient.query({
        data: { query: PRODUCT_BULK_QUERY },
      });

      const responseBody = response.body as { data: { products: any } };
      const { products } = responseBody.data;

      return products.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          vendor: node.vendor,
          productType: node.productType,
          tags: node.tags,
          description: node.descriptionHtml,
          status: node.status,
          variants: node.variants.edges.map((variantEdge: any) => ({
            id: variantEdge.node.id,
            title: variantEdge.node.title,
            sku: variantEdge.node.sku,
            price: variantEdge.node.price,
            compareAtPrice: variantEdge.node.compareAtPrice,
            inventoryQuantity: variantEdge.node.inventoryQuantity,
            weight: variantEdge.node.weight,
            weightUnit: variantEdge.node.weightUnit,
          })),
          images: node.images.edges.map((imageEdge: any) => ({
            id: imageEdge.node.id,
            url: imageEdge.node.url,
            altText: imageEdge.node.altText,
          })),
        };
      });
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
      return [];
    }
  }

  /**
   * Generate URL-friendly handle from product title
   */
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
