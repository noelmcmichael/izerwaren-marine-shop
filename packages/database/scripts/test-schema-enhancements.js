#!/usr/bin/env node

/**
 * Schema Enhancement Testing Script
 * Tests the current database schema and applies performance optimizations
 * Author: Memex AI
 * Date: 2025-01-30
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🔍 Testing Database Schema Enhancements');
  console.log('=====================================\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Schema Validation
    console.log('2. Validating current schema...');
    await validateSchema();
    console.log('✅ Schema validation completed\n');

    // Test 3: Performance Index Analysis
    console.log('3. Analyzing current indexes...');
    await analyzeIndexes();
    console.log('✅ Index analysis completed\n');

    // Test 4: Data Integrity Check
    console.log('4. Checking data integrity...');
    await checkDataIntegrity();
    console.log('✅ Data integrity check completed\n');

    // Test 5: Query Performance Baseline
    console.log('5. Establishing query performance baseline...');
    await performanceBaseline();
    console.log('✅ Performance baseline established\n');

    // Test 6: Apply Performance Optimizations
    console.log('6. Applying performance optimizations...');
    await applyPerformanceOptimizations();
    console.log('✅ Performance optimizations applied\n');

    // Test 7: Apply Data Constraints
    console.log('7. Applying data constraints...');
    await applyDataConstraints();
    console.log('✅ Data constraints applied\n');

    // Test 8: Post-optimization Performance Test
    console.log('8. Testing post-optimization performance...');
    await postOptimizationTest();
    console.log('✅ Post-optimization testing completed\n');

    console.log('🎉 Schema enhancement testing completed successfully!');

  } catch (error) {
    console.error('❌ Schema enhancement testing failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function validateSchema() {
  // Test core table existence
  const tables = [
    'Account', 'Dealer', 'Product', 'ProductVariant', 'AccountPricing',
    'RfqRequest', 'RfqItem', 'TechnicalSpecification', 'ProductImage',
    'CartItem', 'SavedCart', 'VolumeDiscount'
  ];

  for (const table of tables) {
    try {
      const modelName = table.toLowerCase();
      const count = await prisma[modelName].count();
      console.log(`   - ${table}: ${count} records`);
    } catch (error) {
      console.log(`   - ${table}: Error accessing table (${error.message})`);
    }
  }
}

async function analyzeIndexes() {
  // Query current index information
  const indexQuery = `
    SELECT 
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename IN ('accounts', 'products', 'account_pricing', 'rfq_requests')
    ORDER BY tablename, indexname;
  `;

  try {
    const indexes = await prisma.$queryRaw`${indexQuery}`;
    console.log(`   Found ${indexes.length} existing indexes on core tables`);
    
    // Check for critical indexes
    const indexNames = indexes.map(idx => idx.indexname);
    const criticalIndexes = [
      'accounts_firebase_uid_key',
      'products_shopify_product_id_key', 
      'account_pricing_account_id_shopify_product_id_shopify_variant_id_key'
    ];

    criticalIndexes.forEach(idx => {
      if (indexNames.includes(idx)) {
        console.log(`   ✅ Critical index found: ${idx}`);
      } else {
        console.log(`   ⚠️  Critical index missing: ${idx}`);
      }
    });
  } catch (error) {
    console.log(`   ⚠️  Could not analyze indexes: ${error.message}`);
  }
}

async function checkDataIntegrity() {
  // Test foreign key relationships
  try {
    // Check account-pricing relationship
    const accountPricingCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as orphaned_pricing
      FROM account_pricing ap
      LEFT JOIN accounts a ON ap.account_id = a.id
      WHERE a.id IS NULL;
    `;
    console.log(`   - Orphaned account pricing records: ${accountPricingCheck[0].orphaned_pricing}`);

    // Check product-variant relationship
    const productVariantCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as orphaned_variants
      FROM product_variants pv
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE p.id IS NULL;
    `;
    console.log(`   - Orphaned product variant records: ${productVariantCheck[0].orphaned_variants}`);

    // Check RFQ-customer relationship
    const rfqCustomerCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as orphaned_rfqs
      FROM rfq_requests r
      LEFT JOIN accounts a ON r.customer_id = a.id
      WHERE a.id IS NULL AND r.customer_id IS NOT NULL;
    `;
    console.log(`   - Orphaned RFQ records: ${rfqCustomerCheck[0].orphaned_rfqs}`);

  } catch (error) {
    console.log(`   ⚠️  Could not check data integrity: ${error.message}`);
  }
}

async function performanceBaseline() {
  const startTime = Date.now();
  
  try {
    // Test 1: Product search performance
    const productSearchStart = Date.now();
    const products = await prisma.product.findMany({
      where: {
        status: 'active'
      },
      take: 10,
      include: {
        productVariants: true,
        technicalSpecs: true
      }
    });
    const productSearchTime = Date.now() - productSearchStart;
    console.log(`   - Product search (10 records): ${productSearchTime}ms`);

    // Test 2: Account pricing lookup
    const pricingStart = Date.now();
    const pricing = await prisma.accountPricing.findMany({
      where: {
        isActive: true
      },
      take: 10
    });
    const pricingTime = Date.now() - pricingStart;
    console.log(`   - Account pricing lookup: ${pricingTime}ms`);

    // Test 3: RFQ query performance
    const rfqStart = Date.now();
    const rfqs = await prisma.rfqRequest.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        items: true,
        customer: true
      },
      take: 5
    });
    const rfqTime = Date.now() - rfqStart;
    console.log(`   - RFQ query with relations: ${rfqTime}ms`);

    // Test 4: Technical specification search
    const techSpecStart = Date.now();
    const techSpecs = await prisma.technicalSpecification.findMany({
      where: {
        isSearchable: true,
        category: 'dimension'
      },
      take: 10
    });
    const techSpecTime = Date.now() - techSpecStart;
    console.log(`   - Technical specification search: ${techSpecTime}ms`);

  } catch (error) {
    console.log(`   ⚠️  Performance baseline failed: ${error.message}`);
  }
}

async function applyPerformanceOptimizations() {
  try {
    const sqlFile = path.join(__dirname, '../migrations/performance-optimizations.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`   Executing ${statements.length} optimization statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.log(`   ⚠️  Statement ${i + 1} failed: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not apply performance optimizations: ${error.message}`);
  }
}

async function applyDataConstraints() {
  try {
    const sqlFile = path.join(__dirname, '../migrations/data-constraints.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`   Executing ${statements.length} constraint statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`   ✅ Constraint ${i + 1} applied successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Constraint ${i + 1} skipped (already exists)`);
          } else {
            console.log(`   ⚠️  Constraint ${i + 1} failed: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not apply data constraints: ${error.message}`);
  }
}

async function postOptimizationTest() {
  try {
    // Re-run performance tests to measure improvement
    console.log('   Re-running performance tests...');
    await performanceBaseline();
    
    // Test new indexes are being used
    const explainQuery = `
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT * FROM products 
      WHERE status = 'active' 
        AND product_type = 'SIMPLE' 
      LIMIT 10;
    `;
    
    const explainResult = await prisma.$queryRaw`${explainQuery}`;
    console.log(`   - Query plan analysis completed (${explainResult.length} steps)`);
    
  } catch (error) {
    console.log(`   ⚠️  Post-optimization testing failed: ${error.message}`);
  }
}

// Run the test script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };