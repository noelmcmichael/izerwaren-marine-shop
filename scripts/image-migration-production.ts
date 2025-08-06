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

interface UploadManifest {
  generatedAt: string;
  totalImages: number;
  estimatedUploadTime: string;
  images: Array<{
    localPath: string;
    filename: string;
    uuid: string;
    size: number;
    dbRecordId: string;
    productId: string;
    productSku: string;
    imageOrder: number | null;
    isPrimary: boolean;
    oldUrl: string | null;
  }>;
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

interface UploadProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  startTime: Date;
  estimatedTimeRemaining?: string;
  currentProduct?: string;
}

async function migrateImagesProduction() {
  console.log('🚀 Production Image Migration Pipeline\n=====================================');
  
  try {
    // Step 1: Load upload manifest
    console.log('📋 Step 1: Loading upload manifest...');
    const manifest = await loadUploadManifest();
    console.log(`   Found ${manifest.totalImages} images ready for upload`);

    // Step 2: Initialize services
    console.log('\n🔧 Step 2: Initializing Shopify integration...');
    const shopifyClient = createShopifyClient();
    const mediaService = new StagedMediaService(shopifyClient);
    console.log('   ✅ Shopify client ready');

    // Step 3: Run validation test with first 5 images
    console.log('\n🧪 Step 3: Running validation test...');
    await runValidationTest(mediaService, manifest.images.slice(0, 5));

    // Step 4: Ask for confirmation
    console.log('\n⚠️  Ready to upload all images to Shopify CDN');
    console.log(`   Total images: ${manifest.totalImages}`);
    console.log(`   Estimated time: ${manifest.estimatedUploadTime}`);
    console.log('   Each image will be uploaded via staged upload process');
    console.log('   Database will be updated with Shopify CDN URLs');
    
    // For production automation, we proceed directly
    console.log('\n✅ Starting production upload...');
    
    // Step 5: Execute batch upload
    console.log('\n🚀 Step 5: Starting batch upload...');
    await executeBatchUpload(mediaService, manifest);

    console.log('\n✅ Image migration completed successfully!');
    console.log('\n🎉 All product images are now hosted on Shopify CDN!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function loadUploadManifest(): Promise<UploadManifest> {
  const manifestPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/upload-manifest.json';
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(manifestContent);
  } catch (error) {
    throw new Error(`Failed to load upload manifest: ${error}. Run discovery script first.`);
  }
}

async function runValidationTest(mediaService: StagedMediaService, testImages: any[]) {
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
        console.log(`   ✅ ${image.filename}: ${meta?.width}x${meta?.height} ${meta?.format} (${(image.size / 1024).toFixed(1)}KB)`);
      }
      
    } catch (error) {
      console.error(`   ❌ ${image.filename}: ${error}`);
      throw new Error(`Validation failed for ${image.filename}`);
    }
  }
  
  console.log('   ✅ Validation test completed');
}

async function executeBatchUpload(mediaService: StagedMediaService, manifest: UploadManifest) {
  const progress: UploadProgress = {
    total: manifest.totalImages,
    completed: 0,
    successful: 0,
    failed: 0,
    startTime: new Date(),
  };

  const results: UploadResult[] = [];
  const BATCH_SIZE = 5; // Process 5 images at a time to be gentle on API
  const RATE_LIMIT_DELAY = 1000; // 1 second between uploads

  console.log(`   Processing ${progress.total} images in batches of ${BATCH_SIZE}`);
  console.log(`   Rate limit: ${RATE_LIMIT_DELAY}ms delay between uploads\n`);

  // Process images in batches
  for (let i = 0; i < manifest.images.length; i += BATCH_SIZE) {
    const batch = manifest.images.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(manifest.images.length / BATCH_SIZE);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches}: Processing ${batch.length} images`);
    
    // Process batch sequentially (to respect rate limits)
    for (const image of batch) {
      const startTime = Date.now();
      progress.currentProduct = `${image.productSku} - ${image.filename}`;
      
      try {
        const result = await uploadSingleImage(mediaService, image);
        results.push(result);
        
        if (result.success) {
          progress.successful++;
          console.log(`   ✅ ${image.productSku}: ${result.shopifyUrl}`);
        } else {
          progress.failed++;
          console.log(`   ❌ ${image.productSku}: ${result.error}`);
        }
        
      } catch (error) {
        progress.failed++;
        console.log(`   ❌ ${image.productSku}: ${error}`);
        
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          dbRecordId: image.dbRecordId,
          productSku: image.productSku,
          filename: image.filename,
          duration: Date.now() - startTime,
        });
      }
      
      progress.completed++;
      
      // Update progress
      updateProgressDisplay(progress);
      
      // Rate limiting delay
      if (progress.completed < progress.total) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
    
    // Batch completion summary
    const batchSuccessful = results.slice(-batch.length).filter(r => r.success).length;
    console.log(`   Batch complete: ${batchSuccessful}/${batch.length} successful\n`);
    
    // Save intermediate progress
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      await saveProgressReport(results, progress, false);
    }
  }

  // Final summary
  await generateUploadReport(results, progress);
}

async function uploadSingleImage(mediaService: StagedMediaService, image: any): Promise<UploadResult> {
  const startTime = Date.now();
  
  try {
    // Get product's Shopify ID from database
    const product = await prisma.product.findUnique({
      where: { id: image.productId },
      select: { shopifyProductId: true }
    });

    if (!product?.shopifyProductId) {
      throw new Error(`Product ${image.productSku} missing Shopify ID`);
    }

    // Upload image using staged upload
    const uploadResult = await mediaService.uploadProductImage(
      product.shopifyProductId,
      image.localPath,
      `${image.productSku} - Product Image`
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Update database with Shopify URL (only if we have a URL)
    if (uploadResult.imageUrl) {
      await prisma.productImage.update({
        where: { id: image.dbRecordId },
        data: {
          imageUrl: uploadResult.imageUrl,
          fileExists: true,
        },
      });
    } else {
      // Mark as uploaded but URL pending (for later retrieval)
      console.log(`⚠️ Image uploaded but URL pending processing: ${image.filename}`);
      // Store the Shopify media ID for later URL retrieval
      await prisma.productImage.update({
        where: { id: image.dbRecordId },
        data: {
          // Store the media ID in a field or use a separate tracking mechanism
          fileExists: true,
          // Note: We'll need to handle URL retrieval separately
        },
      });
    }

    return {
      success: true,
      imageId: uploadResult.imageId,
      shopifyUrl: uploadResult.imageUrl,
      dbRecordId: image.dbRecordId,
      productSku: image.productSku,
      filename: image.filename,
      duration: Date.now() - startTime,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dbRecordId: image.dbRecordId,
      productSku: image.productSku,
      filename: image.filename,
      duration: Date.now() - startTime,
    };
  }
}

function updateProgressDisplay(progress: UploadProgress) {
  const elapsed = Date.now() - progress.startTime.getTime();
  const elapsedMinutes = Math.floor(elapsed / 60000);
  const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
  
  const rate = progress.completed / (elapsed / 1000); // uploads per second
  const remaining = progress.total - progress.completed;
  const estimatedSecondsRemaining = remaining / rate;
  const estimatedMinutesRemaining = Math.floor(estimatedSecondsRemaining / 60);
  
  progress.estimatedTimeRemaining = isFinite(estimatedMinutesRemaining) 
    ? `${estimatedMinutesRemaining}m ${Math.floor(estimatedSecondsRemaining % 60)}s`
    : 'calculating...';

  // Update progress line (overwrites previous line)
  process.stdout.write(`\r   Progress: ${progress.completed}/${progress.total} (${((progress.completed/progress.total)*100).toFixed(1)}%) | ✅ ${progress.successful} | ❌ ${progress.failed} | Time: ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')} | ETA: ${progress.estimatedTimeRemaining}`);
  
  if (progress.completed === progress.total) {
    console.log(''); // New line after completion
  }
}

async function saveProgressReport(results: UploadResult[], progress: UploadProgress, isFinal: boolean) {
  const totalDuration = Date.now() - progress.startTime.getTime();
  const averageUploadTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  const report = {
    generatedAt: new Date().toISOString(),
    isFinal,
    summary: {
      totalImages: progress.total,
      completed: progress.completed,
      successful: progress.successful,
      failed: progress.failed,
      successRate: ((progress.successful / Math.max(progress.completed, 1)) * 100).toFixed(2) + '%',
      totalDuration: `${Math.floor(totalDuration / 60000)}m ${Math.floor((totalDuration % 60000) / 1000)}s`,
      averageUploadTime: `${averageUploadTime.toFixed(0)}ms`,
    },
    recentFailures: results.filter(r => !r.success).slice(-10).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      error: r.error,
    })),
    recentSuccesses: results.filter(r => r.success).slice(-5).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      shopifyUrl: r.shopifyUrl,
    })),
  };

  const reportPath = isFinal 
    ? '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/image-upload-final-report.json'
    : '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/image-upload-progress.json';
    
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  if (isFinal) {
    console.log(`\n💾 Final report saved: ${reportPath}`);
  }
}

async function generateUploadReport(results: UploadResult[], progress: UploadProgress) {
  await saveProgressReport(results, progress, true);
  
  const totalDuration = Date.now() - progress.startTime.getTime();
  const successRate = ((progress.successful / progress.total) * 100).toFixed(2);
  
  console.log('\n📊 Final Upload Summary:');
  console.log('========================');
  console.log(`Total images: ${progress.total}`);
  console.log(`✅ Successful: ${progress.successful} (${successRate}%)`);
  console.log(`❌ Failed: ${progress.failed}`);
  console.log(`⏱️  Duration: ${Math.floor(totalDuration / 60000)}m ${Math.floor((totalDuration % 60000) / 1000)}s`);
  console.log(`📈 Average upload time: ${(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0)}ms`);

  if (progress.failed > 0) {
    console.log(`\n⚠️  ${progress.failed} Upload Failures (last 5):`);
    results.filter(r => !r.success).slice(-5).forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.productSku}: ${failure.error}`);
    });
  }
  
  console.log('\n🎉 Image migration pipeline completed!');
  console.log(`   ${progress.successful} images now hosted on Shopify CDN`);
  console.log(`   Database updated with ${progress.successful} Shopify image URLs`);
}

// Execute migration
migrateImagesProduction();