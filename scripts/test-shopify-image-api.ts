#!/usr/bin/env tsx
/* eslint-disable no-console */

import { createShopifyClient } from '@izerwaren/shopify-integration';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testShopifyImageAPI() {
  console.log('🧪 Testing Shopify Image API\n============================');
  
  try {
    const client = createShopifyClient();
    
    // Test 1: Basic API connectivity
    console.log('🔍 Test 1: Basic API connectivity...');
    const basicQuery = `
      query {
        shop {
          name
          myshopifyDomain
        }
      }
    `;
    
    const shopInfo = await client.query(basicQuery);
    console.log(`   ✅ Connected to: ${shopInfo.shop.name} (${shopInfo.shop.myshopifyDomain})`);
    
    // Test 2: Get a product for testing
    console.log('\n🔍 Test 2: Getting test product...');
    const productQuery = `
      query {
        products(first: 1) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;
    
    const productsResponse = await client.query(productQuery);
    const testProduct = productsResponse.products.edges[0].node;
    console.log(`   ✅ Test product: ${testProduct.title} (${testProduct.id})`);
    
    // Test 3: Try image upload with a very small test image
    console.log('\n🔍 Test 3: Testing image upload...');
    
    // Create a minimal test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Try the newer productMediaCreate mutation instead
    const imageUploadMutation = `
      mutation productMediaCreate($productId: ID!, $media: [CreateMediaInput!]!) {
        productMediaCreate(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
              image {
                url
                altText
                width
                height
              }
            }
          }
          mediaUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      productId: testProduct.id,
      media: [{
        originalSource: `data:image/png;base64,${testImageBase64}`,
        altText: 'Test image',
        mediaContentType: 'IMAGE'
      }]
    };

    console.log('   📤 Uploading test image...');
    try {
      const uploadResponse = await client.mutation(imageUploadMutation, variables);
      console.log('   📥 Response received:', JSON.stringify(uploadResponse, null, 2));
    } catch (error) {
      console.log('   📥 Upload error caught:');
      if (error.graphQLErrors) {
        console.log('   GraphQL Errors:');
        error.graphQLErrors.forEach((err, index) => {
          console.log(`     ${index + 1}. ${err.message}`);
          if (err.extensions) {
            console.log(`        Code: ${err.extensions.code}`);
            console.log(`        Field: ${err.path?.join('.')}`);
          }
        });
      }
      console.log('   Full error:', JSON.stringify(error, null, 2));
    }
    
    if (uploadResponse && uploadResponse.productImageCreate) {
      if (uploadResponse.productImageCreate.userErrors.length > 0) {
        console.log('   ❌ Upload errors:', uploadResponse.productImageCreate.userErrors);
      } else {
        console.log('   ✅ Upload successful!');
        console.log(`   └─ Image ID: ${uploadResponse.productImageCreate.image.id}`);
        console.log(`   └─ URL: ${uploadResponse.productImageCreate.image.url}`);
      }
    } else {
      console.log('   ❌ Invalid response structure');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShopifyImageAPI();