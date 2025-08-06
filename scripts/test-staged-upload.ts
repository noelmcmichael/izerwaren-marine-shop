#!/usr/bin/env tsx
/* eslint-disable no-console */

import { createShopifyClient } from '@izerwaren/shopify-integration';
import { StagedMediaService } from '@izerwaren/shopify-integration/src/services/staged-media';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testStagedUpload() {
  console.log('🧪 Testing Shopify Staged Upload Process\n=====================================');
  
  try {
    // Step 1: Initialize services
    console.log('🔧 Step 1: Initializing Shopify integration...');
    const shopifyClient = createShopifyClient();
    const mediaService = new StagedMediaService(shopifyClient);
    console.log('   ✅ Shopify client ready');

    // Step 2: Find a test image
    console.log('\n📷 Step 2: Finding test image...');
    const imagesDir = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products';
    const allFiles = await fs.readdir(imagesDir);
    const imageFiles = allFiles.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png')
    );
    
    if (imageFiles.length === 0) {
      throw new Error('No test images found');
    }
    
    // Use a small test image
    const testImageFile = imageFiles[0];
    const testImagePath = path.join(imagesDir, testImageFile);
    const stats = await fs.stat(testImagePath);
    
    console.log(`   Found test image: ${testImageFile}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)}KB`);
    console.log(`   Path: ${testImagePath}`);

    // Step 3: Validate the image
    console.log('\n🔍 Step 3: Validating image...');
    const validation = await mediaService.validateImage(testImagePath);
    
    if (!validation.isValid) {
      console.error('   ❌ Image validation failed:');
      validation.errors.forEach(error => console.error(`      - ${error}`));
      throw new Error('Image validation failed');
    }
    
    const meta = validation.metadata;
    console.log(`   ✅ Image is valid: ${meta?.width}x${meta?.height} ${meta?.format}`);

    // Step 4: Test with a known product ID
    console.log('\n🛍️ Step 4: Finding test product...');
    // Get a random product with shopifyProductId
    const testProduct = await findTestProduct();
    console.log(`   Using product: ${testProduct.sku} (${testProduct.shopifyProductId})`);

    // Step 5: Test the upload
    console.log('\n🚀 Step 5: Testing staged upload...');
    console.log('   This will test the complete flow:');
    console.log('   1. Create staged upload target');
    console.log('   2. Upload file to Google Cloud Storage');
    console.log('   3. Create product media from staged file');
    
    const result = await mediaService.uploadProductImage(
      testProduct.shopifyProductId,
      testImagePath,
      `Test Upload - ${testImageFile}`
    );

    if (result.success) {
      console.log('\n✅ Upload test SUCCESSFUL!');
      console.log(`   Image ID: ${result.imageId}`);
      console.log(`   Shopify URL: ${result.imageUrl}`);
      console.log('\n🎉 The staged upload authentication issue is FIXED!');
    } else {
      console.log('\n❌ Upload test FAILED!');
      console.log(`   Error: ${result.error}`);
      console.log('\n🔧 Need to debug further...');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

async function findTestProduct(): Promise<{ sku: string; shopifyProductId: string }> {
  const { PrismaClient } = await import('@izerwaren/database');
  const prisma = new PrismaClient();
  
  try {
    const product = await prisma.product.findFirst({
      where: {
        shopifyProductId: { not: null }
      },
      select: {
        sku: true,
        shopifyProductId: true
      }
    });
    
    if (!product?.shopifyProductId) {
      throw new Error('No product with Shopify ID found in database');
    }
    
    return {
      sku: product.sku,
      shopifyProductId: product.shopifyProductId
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Execute test
testStagedUpload();