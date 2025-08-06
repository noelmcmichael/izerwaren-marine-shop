#!/usr/bin/env tsx
/* eslint-disable no-console */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

import { PrismaClient } from '@izerwaren/database';
import { 
  createShopifyClient,
  MigrationEngine,
  type MigrationConfig,
  defaultMigrationConfig 
} from '@izerwaren/shopify-integration';

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const program = new Command();

// Global instances
const prisma = new PrismaClient();
let migrationEngine: MigrationEngine | null = null;

async function initializeMigration(config: MigrationConfig) {
  try {
    // Validate environment variables
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!shopDomain || !accessToken) {
      console.error('❌ Missing required environment variables:');
      console.error('   - SHOPIFY_SHOP_DOMAIN');
      console.error('   - SHOPIFY_ADMIN_ACCESS_TOKEN');
      process.exit(1);
    }

    // Create Shopify client
    const shopifyClient = createShopifyClient(shopDomain, accessToken);

    // Initialize migration engine
    migrationEngine = new MigrationEngine(prisma, shopifyClient, config);

    // Set up event listeners
    migrationEngine.on('migration:started', (progress) => {
      console.log('🚀 Migration started');
      console.log(`📊 Total products: ${progress.totalProducts}`);
      console.log(`🖼️  Total images: ${progress.totalImages}`);
    });

    migrationEngine.on('phase:started', (phase) => {
      console.log(`\n📁 Starting phase: ${phase}`);
    });

    migrationEngine.on('phase:completed', (phase) => {
      console.log(`✅ Completed phase: ${phase}`);
    });

    migrationEngine.on('phase:error', (phase, error) => {
      console.error(`❌ Phase ${phase} failed:`, error);
    });

    migrationEngine.on('product:processed', (result) => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'failed' ? '❌' : 
                    result.status === 'skipped' ? '⏭️' : '⏳';
      
      console.log(`${status} Product ${result.localProductId}: ${result.status}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   ⚠️  ${error}`));
      }
    });

    migrationEngine.on('progress:update', (progress) => {
      const productProgress = progress.totalProducts > 0 ? 
        `${progress.processedProducts}/${progress.totalProducts}` : '0/0';
      
      const imageProgress = progress.totalImages > 0 ? 
        `${progress.processedImages}/${progress.totalImages}` : '0/0';

      console.log(`📈 Progress - Products: ${productProgress}, Images: ${imageProgress}`);
    });

    migrationEngine.on('migration:completed', (progress) => {
      console.log('\n🎉 Migration completed!');
      printSummary(progress);
    });

    migrationEngine.on('migration:error', (error) => {
      console.error('💥 Migration failed:', error);
    });

    return migrationEngine;

  } catch (error) {
    console.error('❌ Failed to initialize migration:', error);
    process.exit(1);
  }
}

function printSummary(progress: any) {
  console.log('\n📊 Migration Summary:');
  console.log('═'.repeat(50));
  console.log(`⏱️  Duration: ${calculateDuration(progress.startTime, progress.endTime)}`);
  console.log(`📦 Products: ${progress.successfulProducts}/${progress.totalProducts} successful`);
  console.log(`🖼️  Images: ${progress.successfulImages}/${progress.totalImages} successful`);
  
  if (progress.failedProducts > 0) {
    console.log(`❌ Failed products: ${progress.failedProducts}`);
  }
  
  if (progress.failedImages > 0) {
    console.log(`❌ Failed images: ${progress.failedImages}`);
  }

  if (progress.errors.length > 0) {
    console.log(`\n🚨 Errors (${progress.errors.length}):`);
    progress.errors.slice(0, 10).forEach((error: any) => {
      console.log(`   • ${error.type}: ${error.message}`);
    });
    
    if (progress.errors.length > 10) {
      console.log(`   ... and ${progress.errors.length - 10} more errors`);
    }
  }
}

function calculateDuration(start: Date, end?: Date): string {
  if (!end) return 'Running...';
  
  const duration = Math.round((end.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Command: Start migration
program
  .command('start')
  .description('Start the Shopify migration process')
  .option('--dry-run', 'Run without making changes to Shopify')
  .option('--batch-size <number>', 'Number of products to process per batch', '10')
  .option('--max-retries <number>', 'Maximum number of retries for failed operations', '3')
  .option('--skip-images', 'Skip image migration')
  .option('--skip-pdfs', 'Skip PDF migration')
  .option('--include-types <types>', 'Comma-separated list of product types to include')
  .option('--exclude-types <types>', 'Comma-separated list of product types to exclude')
  .option('--resume-from <productId>', 'Resume migration from specific product ID')
  .option('--validate-only', 'Only validate data without migrating')
  .action(async (options) => {
    console.log('🔧 Initializing Shopify migration...');
    
    const config: MigrationConfig = {
      ...defaultMigrationConfig,
      dryRun: options.dryRun || false,
      batchSize: parseInt(options.batchSize) || 10,
      maxRetries: parseInt(options.maxRetries) || 3,
      skipImages: options.skipImages || false,
      skipPdfs: options.skipPdfs || false,
      includeProductTypes: options.includeTypes ? options.includeTypes.split(',') : [],
      excludeProductTypes: options.excludeTypes ? options.excludeTypes.split(',') : [],
      resumeFromProduct: options.resumeFrom,
      validateOnly: options.validateOnly || false,
    };

    if (config.dryRun) {
      console.log('🧪 Running in DRY RUN mode - no changes will be made to Shopify');
    }

    try {
      const engine = await initializeMigration(config);
      await engine.start();
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Command: Check status
program
  .command('status')
  .description('Check migration status and progress')
  .action(async () => {
    try {
      console.log('📊 Checking migration status...\n');

      // Count products by sync status
      const totalProducts = await prisma.product.count();
      const syncedProducts = await prisma.product.count({
        where: { shopifyProductId: { not: null } }
      });

      // Get recent sync logs
      const recentLogs = await prisma.productSyncLog.findMany({
        take: 10,
        orderBy: { syncedAt: 'desc' },
        include: {
          product: {
            select: { title: true }
          }
        }
      });

      // Calculate statistics
      const pendingProducts = totalProducts - syncedProducts;
      const syncProgress = totalProducts > 0 ? ((syncedProducts / totalProducts) * 100).toFixed(1) : '0';

      console.log('📈 Migration Status:');
      console.log('═'.repeat(40));
      console.log(`📦 Total products: ${totalProducts}`);
      console.log(`✅ Synced products: ${syncedProducts}`);
      console.log(`⏳ Pending products: ${pendingProducts}`);
      console.log(`📊 Progress: ${syncProgress}%`);

      if (recentLogs.length > 0) {
        console.log('\n📝 Recent sync activity:');
        recentLogs.forEach(log => {
          const status = log.status === 'SUCCESS' ? '✅' : '❌';
          const productTitle = log.product?.title || 'Unknown';
          console.log(`${status} ${log.operation} - ${productTitle} (${log.syncedAt.toLocaleString()})`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to check status:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

// Command: Validate data
program
  .command('validate')
  .description('Validate product data for Shopify compatibility')
  .option('--product-id <id>', 'Validate specific product')
  .option('--sample-size <number>', 'Number of products to validate', '50')
  .action(async (options) => {
    try {
      console.log('🔍 Validating product data...\n');

      const whereClause = options.productId ? { id: options.productId } : {};
      const products = await prisma.product.findMany({
        where: whereClause,
        take: options.productId ? 1 : parseInt(options.sampleSize),
        include: {
          productVariants: true,
          images: true,
          technicalSpecs: true,
          catalogs: true,
          syncLogs: true,
        }
      });

      let validProducts = 0;
      let invalidProducts = 0;
      const issues: string[] = [];

      for (const product of products) {
        // Basic validation
        const hasTitle = product.title && product.title.length > 0;
        const hasValidSku = !product.sku || product.sku.length <= 100;
        const hasImages = product.images.length > 0;

        if (hasTitle && hasValidSku) {
          validProducts++;
          console.log(`✅ ${product.title}`);
        } else {
          invalidProducts++;
          console.log(`❌ ${product.title}`);
          
          if (!hasTitle) issues.push(`Product ${product.id}: Missing title`);
          if (!hasValidSku) issues.push(`Product ${product.id}: Invalid SKU`);
        }

        if (!hasImages) {
          console.log(`   ⚠️  No images found`);
        }
      }

      console.log('\n📊 Validation Summary:');
      console.log('═'.repeat(30));
      console.log(`✅ Valid products: ${validProducts}`);
      console.log(`❌ Invalid products: ${invalidProducts}`);
      
      if (issues.length > 0) {
        console.log('\n🚨 Issues found:');
        issues.forEach(issue => console.log(`   • ${issue}`));
      }

    } catch (error) {
      console.error('❌ Validation failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

// Command: Generate report
program
  .command('report')
  .description('Generate migration report')
  .option('--days <number>', 'Number of days to include in report', '7')
  .option('--output <file>', 'Output file path (optional)')
  .action(async (options) => {
    try {
      console.log('📋 Generating migration report...\n');

      const days = parseInt(options.days);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      // Get sync statistics
      const logs = await prisma.productSyncLog.findMany({
        where: {
          syncedAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        include: {
          product: {
            select: { title: true }
          }
        },
        orderBy: { syncedAt: 'desc' }
      });

      const report = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: days
        },
        summary: {
          totalOperations: logs.length,
          successful: logs.filter(l => l.status === 'SUCCESS').length,
          failed: logs.filter(l => l.status === 'FAILED').length,
          operationTypes: logs.reduce((acc, log) => {
            acc[log.operation] = (acc[log.operation] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        failures: logs
          .filter(l => l.status === 'FAILED')
          .map(l => ({
            productId: l.productId,
            productTitle: l.product?.title,
            operation: l.operation,
            error: l.errorMessage,
            timestamp: l.syncedAt.toISOString()
          }))
      };

      // Print report
      console.log(`📊 Migration Report (${days} days):`);
      console.log('═'.repeat(50));
      console.log(`🕐 Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
      console.log(`📦 Total operations: ${report.summary.totalOperations}`);
      console.log(`✅ Successful: ${report.summary.successful}`);
      console.log(`❌ Failed: ${report.summary.failed}`);

      if (Object.keys(report.summary.operationTypes).length > 0) {
        console.log('\n📈 Operations by type:');
        Object.entries(report.summary.operationTypes).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
      }

      if (report.failures.length > 0) {
        console.log(`\n🚨 Recent failures (${Math.min(report.failures.length, 10)}):`);
        report.failures.slice(0, 10).forEach(failure => {
          console.log(`   • ${failure.productTitle || failure.productId}: ${failure.error}`);
        });
      }

      // Save to file if requested
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(report, null, 2));
        console.log(`\n💾 Report saved to: ${options.output}`);
      }

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

// Command: Stop migration
program
  .command('stop')
  .description('Stop running migration')
  .action(async () => {
    if (migrationEngine) {
      console.log('🛑 Stopping migration...');
      await migrationEngine.stop();
      console.log('✅ Migration stopped');
    } else {
      console.log('ℹ️  No migration currently running');
    }
  });

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal');
  if (migrationEngine) {
    await migrationEngine.stop();
  }
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received terminate signal');
  if (migrationEngine) {
    await migrationEngine.stop();
  }
  await prisma.$disconnect();
  process.exit(0);
});

// Parse command line arguments
program
  .name('shopify-migration')
  .description('Shopify migration tool for Izerwaren 2.0')
  .version('1.0.0');

program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}