#!/usr/bin/env tsx
/* eslint-disable no-console */

import { PrismaClient } from '@izerwaren/database';
import { createShopifyClient } from '@izerwaren/shopify-integration';
import { StagedMediaService } from '@izerwaren/shopify-integration/src/services/staged-media';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testDatabaseUpdateFix() {
  console.log('🧪 Testing Database Update Fix');
  console.log('================================');
  
  try {
    // Find a test image that hasn't been uploaded yet
    const testImage = await prisma.productImage.findFirst({
      where: {
        fileExists: true,
        imageUrl: { startsWith: 'https://izerwaren.biz' }
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            shopifyProductId: true
          }
        }
      }
    });

    if (!testImage || !testImage.product) {
      throw new Error('No suitable test image found');
    }

    console.log(`📷 Test Image: ${testImage.product.sku}`);
    console.log(`   Database ID: ${testImage.id}`);
    console.log(`   Current URL: ${testImage.imageUrl?.substring(0, 50)}...`);
    console.log(`   Shopify Product ID: ${testImage.product.shopifyProductId}`);

    // Extract filename from current URL
    const filename = testImage.imageUrl?.split('/').pop() || 'unknown.jpg';
    const localPath = `/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products/${filename}`;

    // Check if local file exists
    try {
      await fs.access(localPath);
      console.log(`✅ Local file exists: ${localPath}`);
    } catch {
      throw new Error(`Local file not found: ${localPath}`);
    }

    // Initialize Shopify service
    console.log('\n🔧 Initializing Shopify integration...');
    const shopifyClient = createShopifyClient();
    const mediaService = new StagedMediaService(shopifyClient);

    // Test the upload with fixed logic
    console.log('\n🚀 Testing upload with database update fix...');
    const uploadResult = await mediaService.uploadProductImage(
      testImage.product.shopifyProductId!,
      localPath,
      `${testImage.product.sku} - Test Upload`
    );

    console.log('\n📊 Upload Result:');
    console.log(`   Success: ${uploadResult.success}`);
    console.log(`   Image ID: ${uploadResult.imageId}`);
    console.log(`   Image URL: ${uploadResult.imageUrl || 'UNDEFINED (async processing)'}`);
    console.log(`   Error: ${uploadResult.error || 'None'}`);

    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }

    // Test database update logic
    console.log('\n💾 Testing database update logic...');
    
    if (uploadResult.imageUrl) {
      console.log('✅ Image URL available - updating database');
      await prisma.productImage.update({
        where: { id: testImage.id },
        data: {
          imageUrl: uploadResult.imageUrl,
          fileExists: true,
        },
      });
      console.log(`✅ Database updated with URL: ${uploadResult.imageUrl}`);
    } else {
      console.log('⚠️ Image URL pending - marking as uploaded without URL');
      await prisma.productImage.update({
        where: { id: testImage.id },
        data: {
          fileExists: true,
          // URL will be retrieved later
        },
      });
      console.log('⚠️ Database marked as uploaded but URL pending');
    }

    // Verify database state
    console.log('\n🔍 Verifying database state...');
    const updatedImage = await prisma.productImage.findUnique({
      where: { id: testImage.id },
      select: { imageUrl: true, fileExists: true }
    });

    console.log(`   Updated URL: ${updatedImage?.imageUrl || 'NULL/UNDEFINED'}`);
    console.log(`   File Exists: ${updatedImage?.fileExists}`);

    // Check if we need to implement URL retrieval later
    if (!uploadResult.imageUrl && uploadResult.imageId) {
      console.log('\n🔄 Testing delayed URL retrieval...');
      
      // Wait a moment for Shopify processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to fetch the URL directly
      const query = `
        query getMedia($id: ID!) {
          media: node(id: $id) {
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
          }
        }
      `;
      
      const response = await shopifyClient.query<{
        media: {
          id: string;
          image: { url: string; altText: string } | null;
        };
      }>(query, { id: uploadResult.imageId });
      
      if (response?.media?.image?.url) {
        console.log(`✅ Retrieved URL after delay: ${response.media.image.url}`);
        
        // Update database with retrieved URL
        await prisma.productImage.update({
          where: { id: testImage.id },
          data: { imageUrl: response.media.image.url },
        });
        console.log('✅ Database updated with retrieved URL');
      } else {
        console.log('⚠️ URL still not available after delay');
      }
    }

    console.log('\n🎉 Database update fix test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseUpdateFix();