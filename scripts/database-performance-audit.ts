#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditDatabasePerformance() {
  console.log('🔍 Database Performance Audit');
  console.log('==============================\n');

  // Check current table sizes and record counts
  console.log('📊 Table Sizes & Record Counts:');

  const tables = [
    { name: 'products', model: prisma.product },
    { name: 'product_images', model: prisma.productImage },
    { name: 'technical_specifications', model: prisma.technicalSpecification },
    { name: 'product_variant_groups', model: prisma.productVariantGroup },
    { name: 'product_variant_options', model: prisma.productVariantOption },
    { name: 'catalog_product_variants', model: prisma.catalogProductVariant },
    { name: 'product_catalogs', model: prisma.productCatalog },
    { name: 'accounts', model: prisma.account },
    { name: 'account_pricing', model: prisma.accountPricing },
  ];

  for (const table of tables) {
    try {
      const count = await table.model.count();
      console.log(`   ├─ ${table.name}: ${count.toLocaleString()} records`);
    } catch (error) {
      console.log(`   ├─ ${table.name}: Error counting records`);
    }
  }

  // Analyze common query patterns that might need indexes
  console.log('\n🔍 Query Pattern Analysis:');

  // Category distribution (would benefit from index)
  console.log('\n   📂 Category Distribution (needs index):');
  try {
    const categoryStats = (await prisma.$queryRaw`
      SELECT category_name, COUNT(*) as product_count
      FROM products 
      WHERE category_name IS NOT NULL
      GROUP BY category_name 
      ORDER BY product_count DESC 
      LIMIT 10
    `) as Array<{ category_name: string; product_count: bigint }>;

    categoryStats.forEach(stat => {
      console.log(`      ├─ ${stat.category_name}: ${stat.product_count} products`);
    });
  } catch (error) {
    console.log('      ❌ Error analyzing categories');
  }

  // Price range analysis (would benefit from index)
  console.log('\n   💰 Price Range Analysis (needs index):');
  try {
    const priceStats = (await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN price < 100 THEN 1 END) as under_100,
        COUNT(CASE WHEN price BETWEEN 100 AND 500 THEN 1 END) as between_100_500,
        COUNT(CASE WHEN price BETWEEN 500 AND 1000 THEN 1 END) as between_500_1000,
        COUNT(CASE WHEN price > 1000 THEN 1 END) as over_1000,
        COUNT(CASE WHEN price IS NULL THEN 1 END) as no_price
      FROM products
    `) as Array<any>;

    const stats = priceStats[0];
    console.log(`      ├─ Under $100: ${stats.under_100} products`);
    console.log(`      ├─ $100-$500: ${stats.between_100_500} products`);
    console.log(`      ├─ $500-$1000: ${stats.between_500_1000} products`);
    console.log(`      ├─ Over $1000: ${stats.over_1000} products`);
    console.log(`      └─ No price: ${stats.no_price} products`);
  } catch (error) {
    console.log('      ❌ Error analyzing prices');
  }

  // Technical specifications analysis (critical for search)
  console.log('\n   🔧 Technical Specifications Analysis:');
  try {
    const specStats = (await prisma.$queryRaw`
      SELECT specification, COUNT(*) as usage_count
      FROM technical_specifications 
      GROUP BY specification 
      ORDER BY usage_count DESC 
      LIMIT 10
    `) as Array<{ specification: string; usage_count: bigint }>;

    console.log('      Most Used Specifications (need indexes):');
    specStats.forEach(stat => {
      console.log(`      ├─ ${stat.specification}: ${stat.usage_count} uses`);
    });
  } catch (error) {
    console.log('      ❌ Error analyzing specifications');
  }

  // Image loading patterns
  console.log('\n   🖼️  Image Loading Patterns:');
  try {
    const imageStats = (await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_images,
        COUNT(CASE WHEN is_primary = false THEN 1 END) as gallery_images,
        AVG(image_order) as avg_image_order,
        MAX(image_order) as max_images_per_product
      FROM product_images
    `) as Array<any>;

    const stats = imageStats[0];
    console.log(`      ├─ Primary Images: ${stats.primary_images}`);
    console.log(`      ├─ Gallery Images: ${stats.gallery_images}`);
    console.log(`      ├─ Avg Images per Product: ${parseFloat(stats.avg_image_order).toFixed(1)}`);
    console.log(`      └─ Max Images per Product: ${stats.max_images_per_product}`);
  } catch (error) {
    console.log('      ❌ Error analyzing images');
  }

  // Variant complexity analysis
  console.log('\n   🔧 Variant Complexity Analysis:');
  try {
    const variantStats = await prisma.product.findMany({
      where: { hasVariants: true },
      include: {
        variantGroups: {
          include: {
            options: true,
          },
        },
        productVariants: true,
      },
      take: 5,
    });

    console.log('      Top Complex Products:');
    variantStats.forEach(product => {
      const totalOptions = product.variantGroups.reduce(
        (sum, group) => sum + group.options.length,
        0
      );
      console.log(
        `      ├─ ${product.sku}: ${product.variantGroups.length} groups, ${totalOptions} options, ${product.productVariants.length} variants`
      );
    });
  } catch (error) {
    console.log('      ❌ Error analyzing variants');
  }

  console.log('\n🚨 Performance Bottleneck Predictions:');
  console.log('=====================================');

  console.log('   🔴 HIGH IMPACT - Immediate Optimization Needed:');
  console.log('      ├─ No index on products.category_name (category filtering)');
  console.log('      ├─ No index on products.price (price range filtering)');
  console.log('      ├─ No index on technical_specifications.specification (search)');
  console.log('      ├─ No index on technical_specifications.value (search)');
  console.log('      └─ No composite index on product_images(product_id, image_order)');

  console.log('\n   🟡 MEDIUM IMPACT - Consider for Phase 2:');
  console.log('      ├─ No index on products.has_variants (variant filtering)');
  console.log('      ├─ No index on catalog_product_variants.product_id (variant lookup)');
  console.log('      ├─ Technical specs table size (24K records) may need partitioning');
  console.log('      └─ Image table size (12K records) growing with product catalog');

  console.log('\n   🟢 LOW IMPACT - Monitor and optimize later:');
  console.log('      ├─ Account-specific data access patterns');
  console.log('      ├─ RFQ request indexing');
  console.log('      └─ Audit log retention strategy');

  console.log('\n💡 Recommended Index Creation Priority:');
  console.log('======================================');

  console.log('   1️⃣ CREATE INDEX idx_products_category ON products(category_name);');
  console.log('   2️⃣ CREATE INDEX idx_products_price ON products(price) WHERE price IS NOT NULL;');
  console.log('   3️⃣ CREATE INDEX idx_tech_specs_spec ON technical_specifications(specification);');
  console.log('   4️⃣ CREATE INDEX idx_tech_specs_value ON technical_specifications(value);');
  console.log(
    '   5️⃣ CREATE INDEX idx_images_product_order ON product_images(product_id, image_order);'
  );
  console.log('   6️⃣ CREATE INDEX idx_images_primary ON product_images(product_id, is_primary);');
  console.log('   7️⃣ CREATE INDEX idx_products_variants ON products(has_variants);');

  await prisma.$disconnect();
}

auditDatabasePerformance().catch(console.error);
