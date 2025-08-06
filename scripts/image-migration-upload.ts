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

async function migrateImages() {
  console.log('🚀 Image Migration Upload Pipeline\n==================================');
  
  try {
    // Step 1: Load upload manifest
    console.log('📋 Step 1: Loading upload manifest...');
    const manifest = await loadUploadManifest();
    console.log(`   Found ${manifest.totalImages} images ready for upload`);

    // Step 2: Initialize Shopify client and media service
    console.log('\n🔧 Step 2: Initializing Shopify integration...');
    const shopifyClient = createShopifyClient();
    const mediaService = new MediaService(shopifyClient);
    console.log('   ✅ Shopify client ready');

    // Step 3: Run validation test
    console.log('\n🧪 Step 3: Running upload validation test...');
    await runValidationTest(mediaService, manifest);

    // Step 4: Ask for confirmation
    console.log('\n⚠️  Ready to upload 2,692 images to Shopify CDN');
    console.log('   This will take approximately 23 minutes');
    console.log('   Each image will be uploaded and database will be updated');
    
    // For script automation, we'll proceed directly
    // In interactive mode, you'd want to add a prompt here
    
    // Step 5: Execute batch upload
    console.log('\n🚀 Step 5: Starting batch upload...');
    await executeBatchUpload(mediaService, manifest);

    console.log('\n✅ Image migration completed successfully!');
    
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

async function runValidationTest(mediaService: MediaService, manifest: UploadManifest) {
  console.log('   Testing Shopify API connectivity...');
  
  // Test with first 3 images
  const testImages = manifest.images.slice(0, 3);
  
  for (const image of testImages) {
    try {
      // Validate image file can be read
      await fs.access(image.localPath);
      
      // Validate image with Sharp (through MediaService)
      const validation = await mediaService.validateImage(image.localPath);
      
      if (!validation.isValid) {
        console.warn(`   ⚠️  ${image.filename}: ${validation.errors.join(', ')}`);
      } else {
        console.log(`   ✅ ${image.filename}: Valid for upload`);
      }
      
    } catch (error) {
      console.error(`   ❌ ${image.filename}: Validation failed - ${error}`);
    }
  }
  
  console.log('   ✅ Validation test completed');
}

async function executeBatchUpload(mediaService: MediaService, manifest: UploadManifest) {
  const progress: UploadProgress = {
    total: manifest.totalImages,
    completed: 0,
    successful: 0,
    failed: 0,
    startTime: new Date(),
  };

  const results: UploadResult[] = [];
  const BATCH_SIZE = 10; // Process 10 images at a time
  const RATE_LIMIT_DELAY = 500; // 500ms between uploads

  console.log(`   Processing ${progress.total} images in batches of ${BATCH_SIZE}`);
  console.log(`   Rate limit: ${RATE_LIMIT_DELAY}ms delay between uploads\n`);

  // Process images in batches
  for (let i = 0; i < manifest.images.length; i += BATCH_SIZE) {
    const batch = manifest.images.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(manifest.images.length / BATCH_SIZE)}: Processing ${batch.length} images`);
    
    // Process batch sequentially (to respect rate limits)
    for (const image of batch) {
      const startTime = Date.now();
      progress.currentProduct = `${image.productSku} - ${image.filename}`;
      
      try {
        const result = await uploadSingleImage(mediaService, image);
        results.push(result);
        
        if (result.success) {
          progress.successful++;
          console.log(`   ✅ ${image.productSku}: ${image.filename} → ${result.shopifyUrl}`);
        } else {
          progress.failed++;
          console.log(`   ❌ ${image.productSku}: ${image.filename} → ${result.error}`);
        }
        
      } catch (error) {
        progress.failed++;
        console.log(`   ❌ ${image.productSku}: ${image.filename} → ${error}`);
        
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
  }

  // Final summary
  await generateUploadReport(results, progress);
}

async function uploadSingleImage(mediaService: MediaService, image: any): Promise<UploadResult> {
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

    // Upload image to Shopify
    const uploadResult = await mediaService.uploadProductImage(
      product.shopifyProductId,
      image.localPath,
      image.imageOrder || 1,
      `${image.productSku} - Product Image`
    );

    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Update database with Shopify URL
    await prisma.productImage.update({
      where: { id: image.dbRecordId },
      data: {
        imageUrl: uploadResult.data.src,
        fileExists: true,
      },
    });

    return {
      success: true,
      imageId: uploadResult.data.id,
      shopifyUrl: uploadResult.data.src,
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

async function generateUploadReport(results: UploadResult[], progress: UploadProgress) {
  const totalDuration = Date.now() - progress.startTime.getTime();
  const averageUploadTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalImages: progress.total,
      successful: progress.successful,
      failed: progress.failed,
      successRate: ((progress.successful / progress.total) * 100).toFixed(2) + '%',
      totalDuration: `${Math.floor(totalDuration / 60000)}m ${Math.floor((totalDuration % 60000) / 1000)}s`,
      averageUploadTime: `${averageUploadTime.toFixed(0)}ms`,
    },
    failures: results.filter(r => !r.success).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      error: r.error,
    })),
    sampleSuccesses: results.filter(r => r.success).slice(0, 10).map(r => ({
      productSku: r.productSku,
      filename: r.filename,
      shopifyUrl: r.shopifyUrl,
    })),
  };

  const reportPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/image-upload-report.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 Upload Summary:');
  console.log('==================');
  console.log(`Total images: ${report.summary.totalImages}`);
  console.log(`✅ Successful: ${report.summary.successful} (${report.summary.successRate})`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`⏱️  Duration: ${report.summary.totalDuration}`);
  console.log(`📈 Average upload time: ${report.summary.averageUploadTime}`);
  console.log(`\n💾 Detailed report saved: ${reportPath}`);

  if (report.failures.length > 0) {
    console.log(`\n⚠️  ${report.failures.length} Upload Failures:`);
    report.failures.slice(0, 5).forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.productSku}: ${failure.error}`);
    });
    if (report.failures.length > 5) {
      console.log(`   ... and ${report.failures.length - 5} more (see report file)`);
    }
  }
}

// Execute migration
migrateImages();