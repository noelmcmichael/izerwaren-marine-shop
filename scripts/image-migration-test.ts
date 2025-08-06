#!/usr/bin/env tsx
/* eslint-disable no-console */

import { PrismaClient } from '@izerwaren/database';
import { createShopifyClient, MediaService } from '@izerwaren/shopify-integration';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function testImageUpload() {
  console.log('🧪 Image Upload Test Pipeline\n=============================');
  
  try {
    // Step 1: Load test images from manifest
    console.log('📋 Step 1: Loading test images...');
    const manifest = await loadUploadManifest();
    const testImages = manifest.images.slice(0, 3); // Test with first 3 images
    console.log(`   Selected ${testImages.length} images for testing`);

    // Step 2: Initialize services
    console.log('\n🔧 Step 2: Initializing services...');
    const shopifyClient = createShopifyClient();
    const mediaService = new MediaService(shopifyClient);
    console.log('   ✅ Services ready');

    // Step 3: Test individual components
    console.log('\n🔍 Step 3: Testing components...');
    await testFileAccess(testImages);
    await testImageValidation(mediaService, testImages);
    await testShopifyConnection(shopifyClient, testImages);

    // Step 4: Test actual upload (1 image only)
    console.log('\n🚀 Step 4: Testing actual upload...');
    await testActualUpload(mediaService, testImages[0]);

    console.log('\n✅ All tests passed! Ready for full migration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function loadUploadManifest() {
  const manifestPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/upload-manifest.json';
  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  return JSON.parse(manifestContent);
}

async function testFileAccess(images: any[]) {
  console.log('   Testing file access...');
  
  for (const image of images) {
    try {
      await fs.access(image.localPath);
      const stats = await fs.stat(image.localPath);
      console.log(`   ✅ ${image.filename}: ${(stats.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.log(`   ❌ ${image.filename}: File not accessible`);
      throw error;
    }
  }
}

async function testImageValidation(mediaService: MediaService, images: any[]) {
  console.log('   Testing image validation...');
  
  for (const image of images) {
    try {
      const validation = await mediaService.validateImage(image.localPath);
      
      if (validation.isValid) {
        const meta = validation.metadata;
        console.log(`   ✅ ${image.filename}: ${meta?.width}x${meta?.height} ${meta?.format}`);
      } else {
        console.log(`   ⚠️  ${image.filename}: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ ${image.filename}: Validation failed`);
      throw error;
    }
  }
}

async function testShopifyConnection(client: any, images: any[]) {
  console.log('   Testing Shopify connection...');
  
  // Test getting product info for first image
  const testImage = images[0];
  
  try {
    const product = await prisma.product.findUnique({
      where: { id: testImage.productId },
      select: { 
        shopifyProductId: true,
        sku: true,
        title: true,
      }
    });

    if (!product?.shopifyProductId) {
      throw new Error(`Product ${testImage.productSku} missing Shopify ID`);
    }

    // Test getting product from Shopify
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          images(first: 1) {
            edges {
              node {
                id
                url
              }
            }
          }
        }
      }
    `;

    const response = await client.query(query, { id: product.shopifyProductId });
    
    if (response.product) {
      console.log(`   ✅ Shopify product found: ${response.product.title}`);
      console.log(`   ✅ Current images in Shopify: ${response.product.images.edges.length}`);
    } else {
      throw new Error('Product not found in Shopify');
    }
    
  } catch (error) {
    console.log(`   ❌ Shopify connection test failed: ${error}`);
    throw error;
  }
}

async function testActualUpload(mediaService: MediaService, image: any) {
  console.log(`   Testing actual upload with: ${image.filename}...`);
  
  try {
    // Get product Shopify ID
    const product = await prisma.product.findUnique({
      where: { id: image.productId },
      select: { shopifyProductId: true }
    });

    if (!product?.shopifyProductId) {
      throw new Error(`Product missing Shopify ID`);
    }

    console.log(`   └─ Product Shopify ID: ${product.shopifyProductId}`);
    console.log(`   └─ Local path: ${image.localPath}`);
    console.log(`   └─ Image order: ${image.imageOrder}`);

    // Upload image
    const startTime = Date.now();
    const result = await mediaService.uploadProductImage(
      product.shopifyProductId,
      image.localPath,
      image.imageOrder || 1,
      `${image.productSku} - Test Upload`
    );
    const duration = Date.now() - startTime;

    if (result.success && result.data) {
      console.log(`   ✅ Upload successful! (${duration}ms)`);
      console.log(`   └─ Shopify Image ID: ${result.data.id}`);
      console.log(`   └─ CDN URL: ${result.data.src}`);
      console.log(`   └─ Dimensions: ${result.data.width}x${result.data.height}`);

      // Test database update
      await prisma.productImage.update({
        where: { id: image.dbRecordId },
        data: {
          imageUrl: result.data.src,
          fileExists: true,
        },
      });
      console.log(`   ✅ Database updated successfully`);

      // Verify the update
      const updatedRecord = await prisma.productImage.findUnique({
        where: { id: image.dbRecordId },
        select: { imageUrl: true }
      });
      
      if (updatedRecord?.imageUrl === result.data.src) {
        console.log(`   ✅ Database verification successful`);
      } else {
        throw new Error('Database update verification failed');
      }

    } else {
      throw new Error(result.error || 'Upload failed');
    }
    
  } catch (error) {
    console.log(`   ❌ Upload test failed: ${error}`);
    throw error;
  }
}

// Execute test
testImageUpload();