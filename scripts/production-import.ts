#!/usr/bin/env npx tsx

// Production import CLI script with full monitoring and control

import { program } from 'commander';
import inquirer from 'inquirer';

import ImportMonitor from '../src/lib/import/import-monitor';
import { ProductionImporter, ProductionImportConfig } from '../src/lib/import/production-importer';

const monitor = new ImportMonitor();

async function runProductionImport(options: any) {
  console.log('🚀 Starting Production Import System');
  console.log('====================================');

  const config: Partial<ProductionImportConfig> = {
    batchSize: options.batchSize || 50,
    maxRetries: options.maxRetries || 3,
    retryDelayMs: options.retryDelay || 1000,
    concurrentImageDownloads: options.concurrentImages || 5,
    enableImageDownload: !options.skipImages,
    enableSpecImport: !options.skipSpecs,
    resumeFromBatch: options.resumeFrom,
  };

  console.log('📋 Configuration:');
  console.log(`   Batch Size: ${config.batchSize}`);
  console.log(`   Max Retries: ${config.maxRetries}`);
  console.log(`   Image Download: ${config.enableImageDownload ? 'Enabled' : 'Disabled'}`);
  console.log(`   Spec Import: ${config.enableSpecImport ? 'Enabled' : 'Disabled'}`);

  if (config.resumeFromBatch) {
    console.log(`   Resume from batch: ${config.resumeFromBatch}`);
  }

  console.log();

  // Confirm before starting (unless force flag is set)
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will import ALL 947 products. Continue?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('❌ Import cancelled by user');
      return;
    }
  }

  // Create importer with progress callback
  const importer = new ProductionImporter(config, state => {
    // Progress updates are handled by the monitor
    // This callback can be used for real-time notifications
  });

  // Start monitoring in a separate process
  if (!options.noMonitor) {
    console.log('📊 Starting import monitor...');
    startMonitoringDashboard();
  }

  // Start the import
  console.log('🔄 Starting import process...');
  const result = await importer.startProductionImport();

  if (result.success) {
    console.log('\n🎉 Production import completed successfully!');
    console.log('📊 Final Statistics:');

    if (result.stats) {
      Object.entries(result.stats).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  ${result.errors.length} errors occurred during import`);
      console.log('📋 Generate detailed report with: npm run import:report');
    }
  } else {
    console.log('\n❌ Production import failed');
    console.log(`Error: ${result.message}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error}`);
      });

      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    console.log('\n💡 Try resuming with: npm run import:resume');
  }
}

async function startMonitoringDashboard() {
  // Start monitoring in background
  monitor.startMonitoring(2000);

  // Display initial status
  setTimeout(async () => {
    await monitor.displayStatus();

    // Update display every 5 seconds
    const displayInterval = setInterval(async () => {
      const state = await monitor.getCurrentState();
      if (state && ['completed', 'failed'].includes(state.status)) {
        clearInterval(displayInterval);
        monitor.stopMonitoring();
      } else {
        await monitor.displayStatus();
      }
    }, 5000);
  }, 1000);
}

async function showCurrentStatus() {
  await monitor.displayStatus();
}

async function resumeImport(fromBatch?: number) {
  console.log('🔄 Resuming production import...');

  const state = await monitor.getCurrentState();
  if (!state) {
    console.log('❌ No previous import state found');
    return;
  }

  if (state.status === 'completed') {
    console.log('✅ Previous import already completed');
    return;
  }

  const resumeBatch = fromBatch || state.batchProgress.current;

  await runProductionImport({
    force: true,
    resumeFrom: resumeBatch,
    noMonitor: false,
  });
}

async function generateReport() {
  console.log('📊 Generating detailed import report...');

  const reportPath = await monitor.saveReport();
  console.log(`✅ Report saved to: ${reportPath}`);

  // Also display summary
  await monitor.displayStatus();
}

async function validateImport() {
  console.log('🔍 Validating import results...');

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const stats = {
      totalProducts: await prisma.product.count(),
      simpleProducts: await prisma.product.count({ where: { productType: 'SIMPLE' } }),
      variableProducts: await prisma.product.count({ where: { productType: 'VARIABLE' } }),
      variantGroups: await prisma.productVariantGroup.count(),
      variantOptions: await prisma.productVariantOption.count(),
      productVariants: await prisma.catalogProductVariant.count(),
      technicalSpecs: await prisma.technicalSpecification.count(),

      // Validation checks
      productsWithoutVariants: await prisma.product.count({
        where: {
          productType: 'VARIABLE',
          productVariants: { none: {} },
        },
      }),

      orphanedVariantGroups: await prisma.productVariantGroup.count({
        where: { product: null },
      }),
    };

    console.log('\n📊 Import Validation Results:');
    console.log('===============================');

    Object.entries(stats).forEach(([key, value]) => {
      const icon =
        value === 0 && key.includes('orphaned')
          ? '✅'
          : value > 0 && key.includes('without')
            ? '⚠️'
            : '📊';
      console.log(`${icon} ${key}: ${value}`);
    });

    // Expected vs actual comparison
    console.log('\n🎯 Expected vs Actual:');
    console.log('=======================');
    console.log(
      `Simple Products: ${stats.simpleProducts}/884 (${((stats.simpleProducts / 884) * 100).toFixed(1)}%)`
    );
    console.log(
      `Variable Products: ${stats.variableProducts}/63 (${((stats.variableProducts / 63) * 100).toFixed(1)}%)`
    );
    console.log(
      `Total Products: ${stats.totalProducts}/947 (${((stats.totalProducts / 947) * 100).toFixed(1)}%)`
    );

    if (stats.productsWithoutVariants > 0) {
      console.log(
        `\n⚠️  Warning: ${stats.productsWithoutVariants} variable products missing variants`
      );
    }

    if (stats.orphanedVariantGroups > 0) {
      console.log(`\n⚠️  Warning: ${stats.orphanedVariantGroups} orphaned variant groups`);
    }

    if (stats.totalProducts === 947 && stats.productsWithoutVariants === 0) {
      console.log('\n🎉 Import validation passed!');
    } else {
      console.log('\n⚠️  Import validation found issues');
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI setup
program
  .name('production-import')
  .description('Production import system for Izerwaren 2.0')
  .version('1.0.0');

program
  .command('start')
  .description('Start full production import')
  .option('-b, --batch-size <size>', 'Batch size for processing', '50')
  .option('-r, --max-retries <retries>', 'Maximum retry attempts', '3')
  .option('-d, --retry-delay <ms>', 'Retry delay in milliseconds', '1000')
  .option('-i, --concurrent-images <count>', 'Concurrent image downloads', '5')
  .option('--skip-images', 'Skip image downloads')
  .option('--skip-specs', 'Skip technical specifications')
  .option('--resume-from <batch>', 'Resume from specific batch number')
  .option('-f, --force', 'Skip confirmation prompts')
  .option('--no-monitor', 'Disable progress monitoring')
  .action(runProductionImport);

program.command('status').description('Show current import status').action(showCurrentStatus);

program
  .command('resume')
  .description('Resume interrupted import')
  .option('-f, --from-batch <batch>', 'Resume from specific batch')
  .action(options => resumeImport(options.fromBatch));

program.command('report').description('Generate detailed import report').action(generateReport);

program.command('validate').description('Validate import results').action(validateImport);

program
  .command('monitor')
  .description('Start monitoring dashboard')
  .action(() => {
    console.log('📊 Starting import monitoring dashboard...');
    console.log('Press Ctrl+C to exit');

    startMonitoringDashboard();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping monitor...');
      monitor.stopMonitoring();
      process.exit(0);
    });
  });

// Handle unhandled errors
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled rejection:', error);
  monitor.stopMonitoring();
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  monitor.stopMonitoring();
  process.exit(1);
});

// Parse CLI arguments
program.parse();
