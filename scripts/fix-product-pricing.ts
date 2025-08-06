#!/usr/bin/env tsx
/* eslint-disable no-console */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { PrismaClient } from '@izerwaren/database';
import { createShopifyClient } from '@izerwaren/shopify-integration';

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const program = new Command();
const prisma = new PrismaClient();

interface ProductPricingUpdate {
  localId: string;
  shopifyId: string;
  variantId: string;
  title: string;
  currentPrice: string;
  targetPrice: string;
  sku: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

async function fixProductPricing(options: { dryRun?: boolean; batchSize?: number }) {
  console.log('🔧 Starting product pricing fix...');
  
  if (options.dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made');
  }

  const shopifyClient = createShopifyClient();
  const results: ProductPricingUpdate[] = [];
  
  try {
    // Get all products that have been synced to Shopify
    const products = await prisma.product.findMany({
      where: {
        shopifyProductId: {
          not: null,
        },
      },
      include: {
        productVariants: true,
      },
      take: options.batchSize || 50, // Start with a batch to test
    });

    console.log(`📊 Found ${products.length} products to update`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        console.log(`\n[${i + 1}/${products.length}] Processing: ${product.title}`);
        
        // Get the current Shopify product data
        const shopifyQuery = `
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              title
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                  }
                }
              }
            }
          }
        `;

        const shopifyResponse = await shopifyClient.query(shopifyQuery, { id: product.shopifyProductId });
        
        if (!shopifyResponse?.product) {
          console.log(`   ❌ Product not found in Shopify`);
          continue;
        }

        const shopifyProduct = shopifyResponse.product;
        const variants = shopifyProduct.variants.edges;
        
        if (variants.length === 0) {
          console.log(`   ⚠️ No variants found`);
          continue;
        }

        // Update each variant with correct pricing
        for (const variantEdge of variants) {
          const variant = variantEdge.node;
          
          // Determine the correct price
          let targetPrice = product.price.toString();
          let targetSku = product.sku || '';
          
          // If the product has specific variants, use the first one's data
          if (product.productVariants.length > 0) {
            const localVariant = product.productVariants[0];
            targetPrice = localVariant.price.toString();
            targetSku = localVariant.sku || product.sku || '';
          }

          const updateResult: ProductPricingUpdate = {
            localId: product.id,
            shopifyId: shopifyProduct.id,
            variantId: variant.id,
            title: product.title,
            currentPrice: variant.price,
            targetPrice: targetPrice,
            sku: targetSku,
            status: 'failed',
          };

          console.log(`   📝 Variant: ${variant.title}`);
          console.log(`      Current: $${variant.price} → Target: $${targetPrice}`);
          console.log(`      Current SKU: ${variant.sku} → Target: ${targetSku}`);

          if (!options.dryRun) {
            // Use Shopify REST API for variant updates (more reliable)
            const restUpdate = await updateVariantWithRest(variant.id, targetPrice, targetSku);
            
            if (restUpdate.success) {
              updateResult.status = 'success';
              console.log(`      ✅ Updated successfully`);
            } else {
              updateResult.status = 'failed';
              updateResult.error = restUpdate.error;
              console.log(`      ❌ Failed: ${restUpdate.error}`);
            }
          } else {
            updateResult.status = 'skipped';
            console.log(`      🧪 Would update (dry run)`);
          }

          results.push(updateResult);
        }

      } catch (error) {
        console.error(`   💥 Error processing product: ${error}`);
      }
    }

    // Summary
    console.log(`\n📊 Pricing Fix Summary:`);
    console.log(`══════════════════════════════════════`);
    console.log(`📦 Total products processed: ${products.length}`);
    console.log(`✅ Successful updates: ${results.filter(r => r.status === 'success').length}`);
    console.log(`❌ Failed updates: ${results.filter(r => r.status === 'failed').length}`);
    console.log(`🧪 Skipped (dry run): ${results.filter(r => r.status === 'skipped').length}`);

    const failures = results.filter(r => r.status === 'failed');
    if (failures.length > 0) {
      console.log(`\n🚨 Failed Updates:`);
      failures.forEach(f => {
        console.log(`   • ${f.title}: ${f.error}`);
      });
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateVariantWithRest(variantId: string, price: string, sku: string) {
  try {
    // Extract the numeric ID from the GraphQL ID
    const numericId = variantId.split('/').pop();
    
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    
    const url = `https://${shopDomain}/admin/api/2024-01/variants/${numericId}.json`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken!,
      },
      body: JSON.stringify({
        variant: {
          id: numericId,
          price: price,
          sku: sku,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    return { success: true, data: result };
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// CLI setup
program
  .name('fix-product-pricing')
  .description('Fix pricing for migrated products in Shopify')
  .option('--dry-run', 'Preview changes without making them', false)
  .option('--batch-size <number>', 'Number of products to process', '50')
  .action(async (options) => {
    await fixProductPricing({
      dryRun: options.dryRun,
      batchSize: parseInt(options.batchSize),
    });
  });

if (require.main === module) {
  program.parse();
}

export { fixProductPricing };