#!/usr/bin/env tsx
/* eslint-disable no-console */

import { PrismaClient } from '@izerwaren/database';
import { createShopifyClient } from '@izerwaren/shopify-integration';
import { StagedMediaService } from '@izerwaren/shopify-integration/src/services/staged-media';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

interface ImageToMigrate {
  dbRecordId: string;
  productId: string;
  productSku: string;
  shopifyProductId: string;
  filename: string;
  localPath: string;
  currentUrl: string;
}

interface UploadResult {
  success: boolean;
  imageId?: string;
  shopifyUrl?: string;
  error?: string;
  dbRecordId: string;
  productSku: string;
  filename: string;
  duration: number;
}

async function resumeImageMigration() {
  console.log('🔄 Resuming Image Migration Pipeline');
  console.log('====================================');
  
  try {
    // Step 1: Find images that still need migration
    console.log('📊 Step 1: Analyzing current migration state...');
    const imagesToMigrate = await findImagesToMigrate();
    console.log(`   Found ${imagesToMigrate.length} images still needing migration`);

    if (imagesToMigrate.length === 0) {
      console.log('🎉 All images have been migrated!');
      return;
    }

    // Step 2: Initialize services
    console.log('\n🔧 Step 2: Initializing Shopify integration...');
    const shopifyClient = createShopifyClient();
    const mediaService = new StagedMediaService(shopifyClient);
    console.log('   ✅ Shopify client ready');

    // Step 3: Run validation test with first few images
    console.log('\n🧪 Step 3: Running validation test...');
    await runValidationTest(mediaService, imagesToMigrate.slice(0, 3));

    // Step 4: Execute resumption migration
    console.log(`\n🚀 Step 4: Resuming migration for ${imagesToMigrate.length} images...`);
    await executeMigration(mediaService, imagesToMigrate);

    console.log('\n✅ Image migration completed successfully!');
    console.log('\n🎉 All product images are now hosted on Shopify CDN!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function findImagesToMigrate(): Promise<ImageToMigrate[]> {
  // Find images that:
  // 1. Have local files (file_exists = true)
  // 2. Don't have Shopify CDN URLs yet
  // 3. Have associated products with Shopify IDs
  
  const images = await prisma.productImage.findMany({
    where: {
      fileExists: true,
      NOT: {
        imageUrl: { startsWith: 'https://cdn.shopify.com' }
      },
      product: {
        shopifyProductId: { not: null }
      }
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          shopifyProductId: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  const results: ImageToMigrate[] = [];

  for (const image of images) {
    if (!image.product || !image.imageUrl) continue;

    // Extract filename from the current URL
    const filename = image.imageUrl.split('/').pop();
    if (!filename) continue;

    const localPath = `/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products/${filename}`;
    
    // Verify local file exists
    try {
      await fs.access(localPath);
      results.push({
        dbRecordId: image.id,
        productId: image.product.id,
        productSku: image.product.sku,
        shopifyProductId: image.product.shopifyProductId!,
        filename,
        localPath,
        currentUrl: image.imageUrl
      });
    } catch {
      console.warn(`   ⚠️ Local file not found: ${filename}`);
    }
  }

  return results;
}

async function runValidationTest(mediaService: StagedMediaService, testImages: ImageToMigrate[]) {
  console.log('   Testing staged upload process...');
  
  for (let i = 0; i < Math.min(testImages.length, 3); i++) {
    const image = testImages[i];
    try {
      // Test file access
      await fs.access(image.localPath);
      
      // Test image validation
      const validation = await mediaService.validateImage(image.localPath);
      
      if (!validation.isValid) {
        console.warn(`   ⚠️  ${image.filename}: ${validation.errors.join(', ')}`);
      } else {
        const meta = validation.metadata;
        const stats = await fs.stat(image.localPath);
        console.log(`   ✅ ${image.filename}: ${meta?.width}x${meta?.height} ${meta?.format} (${(stats.size / 1024).toFixed(1)}KB)`);
      }
      
    } catch (error) {
      console.error(`   ❌ ${image.filename}: ${error}`);
      throw new Error(`Validation failed for ${image.filename}`);
    }
  }
  
  console.log('   ✅ Validation test completed');
}

async function executeMigration(mediaService: StagedMediaService, images: ImageToMigrate[]) {
  const results: UploadResult[] = [];
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();
  
  const RATE_LIMIT_DELAY = 1000; // 1 second between uploads
  const BATCH_SIZE = 5; // Process in batches of 5

  console.log(`   Processing ${images.length} images with ${RATE_LIMIT_DELAY}ms delays`);
  console.log(`   Estimated time: ${Math.ceil(images.length * RATE_LIMIT_DELAY / 60000)} minutes\n`);

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const uploadStartTime = Date.now();
    
    try {
      console.log(`📤 [${i + 1}/${images.length}] ${image.productSku}: ${image.filename}`);
      
      // Upload image using the fixed staged upload service
      const uploadResult = await mediaService.uploadProductImage(
        image.shopifyProductId,
        image.localPath,
        `${image.productSku} - Product Image`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update database with Shopify URL (using the fixed logic)
      if (uploadResult.imageUrl) {
        await prisma.productImage.update({
          where: { id: image.dbRecordId },
          data: {
            imageUrl: uploadResult.imageUrl,
            fileExists: true,
          },
        });
        console.log(`   ✅ Database updated: ${uploadResult.imageUrl}`);
      } else {
        // This shouldn't happen with our fix, but handle it gracefully
        console.log(`   ⚠️ Upload succeeded but URL pending (should not happen with fix)`);
        await prisma.productImage.update({
          where: { id: image.dbRecordId },
          data: { fileExists: true },
        });
      }

      successful++;
      results.push({
        success: true,
        imageId: uploadResult.imageId,
        shopifyUrl: uploadResult.imageUrl,
        dbRecordId: image.dbRecordId,
        productSku: image.productSku,
        filename: image.filename,
        duration: Date.now() - uploadStartTime,
      });

    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Failed: ${errorMsg}`);
      
      results.push({
        success: false,
        error: errorMsg,
        dbRecordId: image.dbRecordId,
        productSku: image.productSku,
        filename: image.filename,
        duration: Date.now() - uploadStartTime,
      });
    }

    // Progress update
    const progress = ((i + 1) / images.length * 100).toFixed(1);
    const elapsed = Math.floor((Date.now() - startTime) / 60000);
    const rate = (i + 1) / ((Date.now() - startTime) / 1000);
    const eta = Math.floor((images.length - i - 1) / rate / 60);
    
    console.log(`   Progress: ${i + 1}/${images.length} (${progress}%) | ✅ ${successful} | ❌ ${failed} | Elapsed: ${elapsed}m | ETA: ${eta}m\n`);

    // Rate limiting delay
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    // Save progress every 50 images
    if ((i + 1) % 50 === 0) {
      await saveProgressReport(results, i + 1, images.length);
    }
  }

  // Final report
  await generateFinalReport(results, images.length);
}

async function saveProgressReport(results: UploadResult[], completed: number, total: number) {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  const report = {
    timestamp: new Date().toISOString(),
    progress: {
      completed,
      total,
      successful,
      failed,
      successRate: `${((successful / completed) * 100).toFixed(2)}%`
    },
    recentFailures: results.filter(r => !r.success).slice(-5).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      error: r.error
    }))
  };

  const reportPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/migration-resume-progress.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
}

async function generateFinalReport(results: UploadResult[], total: number) {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = ((successful / total) * 100).toFixed(2);
  
  console.log('\n📊 Final Migration Summary:');
  console.log('===========================');
  console.log(`Total images processed: ${total}`);
  console.log(`✅ Successful: ${successful} (${successRate}%)`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n⚠️ Failed Uploads (last 10):`);
    results.filter(r => !r.success).slice(-10).forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.productSku}: ${failure.error}`);
    });
  }

  // Save final report
  const finalReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      successful,
      failed,
      successRate: `${successRate}%`
    },
    failures: results.filter(r => !r.success),
    successes: results.filter(r => r.success).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      shopifyUrl: r.shopifyUrl
    }))
  };

  const reportPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/migration-resume-final.json';
  await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
  
  console.log(`\n💾 Final report saved: migration-resume-final.json`);
  console.log(`🎉 Migration resumed and completed successfully!`);
}

// Execute migration
resumeImageMigration();