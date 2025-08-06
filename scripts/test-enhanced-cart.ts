#!/usr/bin/env ts-node

/**
 * Test Script for Enhanced Shopify Buy SDK Implementation
 * 
 * This script validates the enhanced cart functionality including:
 * - Inventory validation
 * - Error handling
 * - Cart persistence
 * - Variant handling
 */

import { shopifyService } from '../apps/frontend/src/services/shopify';

async function testEnhancedCartFunctionality() {
  console.log('🧪 Testing Enhanced Shopify Buy SDK Implementation\n');

  try {
    // Test 1: Configuration Check
    console.log('1️⃣ Testing Configuration...');
    const config = shopifyService.getConfiguration();
    console.log('✅ Configuration:', {
      isConfigured: config.isConfigured,
      domain: config.domain,
      hasToken: config.hasToken,
    });

    if (!config.isConfigured) {
      console.log('⚠️  Shopify not configured - tests will be limited');
      return;
    }

    // Test 2: Cart Recovery
    console.log('\n2️⃣ Testing Cart Recovery...');
    const recoveredCart = await shopifyService.recoverCart();
    console.log('✅ Cart recovery result:', recoveredCart ? 'Cart found' : 'No existing cart');

    // Test 3: Inventory Check (if we can find a product)
    console.log('\n3️⃣ Testing Inventory Validation...');
    try {
      const products = await shopifyService.getProducts(5);
      if (products.length > 0) {
        const firstProduct = products[0];
        const firstVariant = firstProduct.variants[0];
        
        console.log(`Testing with product: ${firstProduct.title}`);
        console.log(`Variant ID: ${firstVariant.id}`);
        
        const inventory = await shopifyService.getVariantInventory(firstVariant.id);
        console.log('✅ Inventory info:', inventory);
      } else {
        console.log('⚠️  No products found for inventory testing');
      }
    } catch (error) {
      console.log('❌ Inventory test failed:', error);
    }

    // Test 4: SKU-based product lookup
    console.log('\n4️⃣ Testing SKU-based Product Lookup...');
    try {
      // Try to find a variant by SKU (this will depend on what's in your Shopify store)
      const testSku = 'TEST-SKU'; // Replace with actual SKU from your store
      const variant = await shopifyService.findVariantBySku(testSku);
      console.log('✅ SKU lookup result:', variant ? `Found variant: ${variant.title}` : 'SKU not found');
    } catch (error) {
      console.log('❌ SKU lookup test failed:', error);
    }

    // Test 5: Cart Operations (if we have products)
    console.log('\n5️⃣ Testing Cart Operations...');
    try {
      const products = await shopifyService.getProducts(1);
      if (products.length > 0) {
        const product = products[0];
        const variant = product.variants[0];
        
        console.log(`Testing cart operations with: ${product.title}`);
        
        // Test add to cart with validation
        const cart = await shopifyService.addToCart(variant.id, 1, {
          validateInventory: true,
          maxQuantity: 10,
        });
        
        console.log('✅ Add to cart successful:', {
          cartId: cart.id,
          totalItems: cart.totalQuantity,
          subtotal: cart.subtotal,
        });
        
        // Test cart retrieval
        const retrievedCart = await shopifyService.getCart();
        console.log('✅ Cart retrieval successful:', retrievedCart?.totalQuantity, 'items');
        
      } else {
        console.log('⚠️  No products available for cart testing');
      }
    } catch (error) {
      console.log('❌ Cart operations test failed:', error);
    }

    console.log('\n✅ Enhanced Cart Testing Complete!');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEnhancedCartFunctionality().catch(console.error);
}

export { testEnhancedCartFunctionality };