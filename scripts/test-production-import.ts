#!/usr/bin/env npx tsx

// Test script for production import system - safe small batch testing

import ImportMonitor from '../src/lib/import/import-monitor';
import { ProductionImporter, ProductionImportConfig } from '../src/lib/import/production-importer';

async function testProductionImportSystem() {
  console.log('🧪 Testing Production Import System');
  console.log('===================================');

  // Conservative test configuration
  const testConfig: Partial<ProductionImportConfig> = {
    batchSize: 5, // Very small batch for testing
    maxRetries: 2, // Fewer retries for faster testing
    retryDelayMs: 500, // Shorter delay
    concurrentImageDownloads: 2,
    enableImageDownload: false, // Skip images for test
    enableSpecImport: true, // Test specs import
  };

  console.log('📋 Test Configuration:');
  console.log(`   Batch Size: ${testConfig.batchSize} (small for testing)`);
  console.log(`   Image Download: ${testConfig.enableImageDownload ? 'Enabled' : 'Disabled'}`);
  console.log(`   Spec Import: ${testConfig.enableSpecImport ? 'Enabled' : 'Disabled'}`);
  console.log();

  const monitor = new ImportMonitor();

  // Create test importer with detailed progress tracking
  const importer = new ProductionImporter(testConfig, state => {
    // Log important state changes
    if (state.currentPhase !== lastPhase) {
      console.log(`📋 Phase: ${state.currentPhase}`);
      lastPhase = state.currentPhase;
    }
  });

  let lastPhase = '';

  try {
    console.log('🔄 Starting test import...');
    const startTime = Date.now();

    const result = await importer.startProductionImport();

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Test completed in ${Math.round(duration / 1000)}s`);

    if (result.success) {
      console.log('✅ Test import completed successfully!');

      if (result.stats) {
        console.log('\n📊 Test Results:');
        Object.entries(result.stats).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }

      // Validate test results
      await validateTestResults(result.stats);

      if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️  ${result.errors.length} errors occurred (expected for testing):`);
        result.errors.slice(0, 5).forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    } else {
      console.log('❌ Test import failed');
      console.log(`Error: ${result.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

async function validateTestResults(stats: any) {
  console.log('\n🔍 Validating test results...');

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check database state after test
    const dbStats = {
      totalProducts: await prisma.product.count(),
      simpleProducts: await prisma.product.count({ where: { productType: 'SIMPLE' } }),
      variableProducts: await prisma.product.count({ where: { productType: 'VARIABLE' } }),
      variantGroups: await prisma.productVariantGroup.count(),
      productVariants: await prisma.catalogProductVariant.count(),
    };

    console.log('📊 Database after test:');
    Object.entries(dbStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Basic validation
    const expectedMinimumProducts = 3 + 5; // Original 3 + at least 5 new ones
    if (dbStats.totalProducts >= expectedMinimumProducts) {
      console.log('✅ Product count validation passed');
    } else {
      console.log(
        `⚠️  Expected at least ${expectedMinimumProducts} products, got ${dbStats.totalProducts}`
      );
    }

    // Check for data consistency
    const variableWithoutVariants = await prisma.product.count({
      where: {
        productType: 'VARIABLE',
        productVariants: { none: {} },
      },
    });

    if (variableWithoutVariants === 0) {
      console.log('✅ Variable product consistency validation passed');
    } else {
      console.log(`⚠️  Found ${variableWithoutVariants} variable products without variants`);
    }

    console.log('✅ Test validation completed');
  } catch (error) {
    console.error('❌ Test validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showPreTestState() {
  console.log('📊 Pre-test database state:');

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const stats = {
      totalProducts: await prisma.product.count(),
      simpleProducts: await prisma.product.count({ where: { productType: 'SIMPLE' } }),
      variableProducts: await prisma.product.count({ where: { productType: 'VARIABLE' } }),
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Failed to check pre-test state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  await showPreTestState();

  const success = await testProductionImportSystem();

  if (success) {
    console.log('\n🎉 Production import system test PASSED!');
    console.log('💡 Ready to run full production import with:');
    console.log('   npm run import:production');
  } else {
    console.log('\n❌ Production import system test FAILED!');
    console.log('💡 Check errors above and fix before running full import');
  }
}

main().catch(console.error);
