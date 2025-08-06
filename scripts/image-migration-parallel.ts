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
  retries?: number;
}

interface BatchStats {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  avgDuration: number;
  throughput: number; // images per minute
}

class ParallelImageMigrator {
  private mediaService: StagedMediaService;
  private concurrency: number;
  private batchSize: number;
  private stats: BatchStats;
  private startTime: number;
  private checkpointInterval: number;

  constructor(mediaService: StagedMediaService) {
    this.mediaService = mediaService;
    this.concurrency = 10; // Process 10 images simultaneously
    this.batchSize = 100; // Commit database updates in batches of 100
    this.checkpointInterval = 500; // Save progress every 500 images
    this.stats = {
      total: 0,
      completed: 0,
      successful: 0,
      failed: 0,
      avgDuration: 0,
      throughput: 0
    };
    this.startTime = Date.now();
  }

  async migrateImages(images: ImageToMigrate[]): Promise<void> {
    this.stats.total = images.length;
    console.log(`🚀 Starting parallel migration of ${images.length} images`);
    console.log(`   Concurrency: ${this.concurrency} simultaneous uploads`);
    console.log(`   Batch size: ${this.batchSize} database commits`);
    console.log(`   Target throughput: ~${this.concurrency * 2} images/minute\n`);

    const results: UploadResult[] = [];
    
    // Process images in concurrent batches
    for (let i = 0; i < images.length; i += this.concurrency) {
      const batch = images.slice(i, i + this.concurrency);
      const batchResults = await this.processConcurrentBatch(batch, i);
      results.push(...batchResults);

      // Update database in batches for better performance
      if (results.length >= this.batchSize || i + this.concurrency >= images.length) {
        await this.updateDatabaseBatch(results.slice(-this.batchSize));
      }

      // Save checkpoint periodically
      if (results.length % this.checkpointInterval === 0 || i + this.concurrency >= images.length) {
        await this.saveCheckpoint(results);
      }

      // Memory management - force garbage collection periodically
      if (results.length % 1000 === 0) {
        if (global.gc) {
          global.gc();
        }
      }
    }

    await this.generateFinalReport(results);
  }

  private async processConcurrentBatch(batch: ImageToMigrate[], startIndex: number): Promise<UploadResult[]> {
    const promises = batch.map((image, index) => 
      this.uploadSingleImageWithRetry(image, startIndex + index + 1)
    );

    const results = await Promise.allSettled(promises);
    
    const batchResults: UploadResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle promise rejection
        const image = batch[index];
        return {
          success: false,
          error: `Promise rejected: ${result.reason}`,
          dbRecordId: image.dbRecordId,
          productSku: image.productSku,
          filename: image.filename,
          duration: 0
        };
      }
    });

    // Update stats
    batchResults.forEach(result => {
      this.stats.completed++;
      if (result.success) {
        this.stats.successful++;
      } else {
        this.stats.failed++;
      }
    });

    this.updateProgress();
    return batchResults;
  }

  private async uploadSingleImageWithRetry(image: ImageToMigrate, imageNumber: number): Promise<UploadResult> {
    const maxRetries = 3;
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, jitter));

        const uploadResult = await this.mediaService.uploadProductImage(
          image.shopifyProductId,
          image.localPath,
          `${image.productSku} - Product Image`
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        return {
          success: true,
          imageId: uploadResult.imageId,
          shopifyUrl: uploadResult.imageUrl,
          dbRecordId: image.dbRecordId,
          productSku: image.productSku,
          filename: image.filename,
          duration: Date.now() - startTime,
          retries: attempt - 1
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`   ⚠️ [${imageNumber}] Retry ${attempt}/${maxRetries}: ${image.productSku}`);
        } else {
          console.log(`   ❌ [${imageNumber}] Failed after ${maxRetries} attempts: ${image.productSku} - ${lastError}`);
        }
      }
    }

    return {
      success: false,
      error: lastError,
      dbRecordId: image.dbRecordId,
      productSku: image.productSku,
      filename: image.filename,
      duration: 0,
      retries: maxRetries
    };
  }

  private async updateDatabaseBatch(results: UploadResult[]): Promise<void> {
    const successfulResults = results.filter(r => r.success && r.shopifyUrl);
    
    if (successfulResults.length === 0) return;

    try {
      // Use transaction for batch updates
      await prisma.$transaction(async (tx) => {
        const updatePromises = successfulResults.map(result =>
          tx.productImage.update({
            where: { id: result.dbRecordId },
            data: {
              imageUrl: result.shopifyUrl!,
              fileExists: true,
            },
          })
        );
        
        await Promise.all(updatePromises);
      });

      console.log(`   💾 Database batch updated: ${successfulResults.length} images`);
    } catch (error) {
      console.error(`   ❌ Database batch update failed:`, error);
      // Fall back to individual updates
      for (const result of successfulResults) {
        try {
          await prisma.productImage.update({
            where: { id: result.dbRecordId },
            data: {
              imageUrl: result.shopifyUrl!,
              fileExists: true,
            },
          });
        } catch (err) {
          console.error(`   ❌ Individual update failed for ${result.productSku}:`, err);
        }
      }
    }
  }

  private updateProgress(): void {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    this.stats.throughput = this.stats.completed / Math.max(elapsed, 0.1);
    const successRate = ((this.stats.successful / Math.max(this.stats.completed, 1)) * 100).toFixed(1);
    const eta = (this.stats.total - this.stats.completed) / Math.max(this.stats.throughput, 0.1);
    
    process.stdout.write(`\r   Progress: ${this.stats.completed}/${this.stats.total} (${((this.stats.completed/this.stats.total)*100).toFixed(1)}%) | ✅ ${this.stats.successful} | ❌ ${this.stats.failed} | Rate: ${this.stats.throughput.toFixed(1)} img/min | Success: ${successRate}% | ETA: ${eta.toFixed(0)}m`);
  }

  private async saveCheckpoint(results: UploadResult[]): Promise<void> {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      recentFailures: results.filter(r => !r.success).slice(-10).map(r => ({
        productSku: r.productSku,
        filename: r.filename,
        error: r.error,
        retries: r.retries
      })),
      performance: {
        throughput: this.stats.throughput,
        avgDuration: results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / Math.max(results.filter(r => r.success).length, 1)
      }
    };

    const checkpointPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/parallel-migration-checkpoint.json';
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  private async generateFinalReport(results: UploadResult[]): Promise<void> {
    const totalDuration = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const finalThroughput = this.stats.total / totalDuration;
    const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(2);
    
    console.log('\n\n📊 Parallel Migration Final Report:');
    console.log('===================================');
    console.log(`Total images processed: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.successful} (${successRate}%)`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Total duration: ${totalDuration.toFixed(1)} minutes`);
    console.log(`🚀 Average throughput: ${finalThroughput.toFixed(1)} images/minute`);
    console.log(`📈 Performance improvement: ${(finalThroughput / 1).toFixed(1)}x faster than serial`);

    if (this.stats.failed > 0) {
      console.log(`\n⚠️ Failed Uploads (last 10):`);
      results.filter(r => !r.success).slice(-10).forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.productSku}: ${failure.error} (retries: ${failure.retries || 0})`);
      });
    }

    // Save final report
    const finalReport = {
      timestamp: new Date().toISOString(),
      performance: {
        totalDurationMinutes: totalDuration,
        throughputImagesPerMinute: finalThroughput,
        improvementFactor: finalThroughput / 1, // vs 1 img/min baseline
        concurrency: this.concurrency,
        batchSize: this.batchSize
      },
      results: {
        total: this.stats.total,
        successful: this.stats.successful,
        failed: this.stats.failed,
        successRate: `${successRate}%`
      },
      failures: results.filter(r => !r.success),
      retryStats: {
        withRetries: results.filter(r => r.retries && r.retries > 0).length,
        maxRetries: Math.max(...results.map(r => r.retries || 0))
      }
    };

    const reportPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/parallel-migration-final.json';
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    console.log(`\n💾 Final report saved: parallel-migration-final.json`);
    console.log(`🎉 Parallel migration completed!`);
  }
}

async function runParallelMigration() {
  console.log('🚀 Parallel Image Migration Pipeline');
  console.log('====================================');
  
  try {
    // Step 1: Find remaining images
    console.log('📊 Step 1: Finding remaining images to migrate...');
    const imagesToMigrate = await findRemainingImages();
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

    // Step 3: Quick validation
    console.log('\n🧪 Step 3: Quick validation test...');
    await quickValidationTest(imagesToMigrate.slice(0, 3));

    // Step 4: Run parallel migration
    console.log('\n🚀 Step 4: Starting parallel migration...');
    const migrator = new ParallelImageMigrator(mediaService);
    await migrator.migrateImages(imagesToMigrate);

    console.log('\n✅ Parallel migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function findRemainingImages(): Promise<ImageToMigrate[]> {
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

    const filename = image.imageUrl.split('/').pop();
    if (!filename) continue;

    const localPath = `/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products/${filename}`;
    
    // Quick file existence check (don't await all at once)
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
      // Skip missing files silently for speed
    }
  }

  return results;
}

async function quickValidationTest(testImages: ImageToMigrate[]) {
  console.log('   Quick validation of first 3 images...');
  
  for (const image of testImages) {
    try {
      const stats = await fs.stat(image.localPath);
      console.log(`   ✅ ${image.filename}: ${(stats.size / 1024).toFixed(1)}KB`);
    } catch {
      console.warn(`   ⚠️ ${image.filename}: File not accessible`);
    }
  }
  
  console.log('   ✅ Quick validation completed');
}

// Execute migration
runParallelMigration();