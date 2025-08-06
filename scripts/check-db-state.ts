#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('📊 Current Database State:');
  console.log('========================');

  try {
    // Product counts
    const totalProducts = await prisma.product.count();
    const simpleProducts = await prisma.product.count({
      where: { productType: 'SIMPLE' },
    });
    const variableProducts = await prisma.product.count({
      where: { productType: 'VARIABLE' },
    });

    console.log(`\n🛍️  Products: ${totalProducts} total`);
    console.log(
      `   └─ Simple: ${simpleProducts} (${((simpleProducts / totalProducts) * 100).toFixed(1)}%)`
    );
    console.log(
      `   └─ Variable: ${variableProducts} (${((variableProducts / totalProducts) * 100).toFixed(1)}%)`
    );

    // Variant structure counts
    const variantGroups = await prisma.productVariantGroup.count();
    const variantOptions = await prisma.productVariantOption.count();
    const productVariants = await prisma.catalogProductVariant.count();

    console.log(`\n🔧 Variant Structure:`);
    console.log(`   ├─ Variant Groups: ${variantGroups}`);
    console.log(`   ├─ Variant Options: ${variantOptions}`);
    console.log(`   └─ Product Variants: ${productVariants}`);

    // Technical specs
    const technicalSpecs = await prisma.technicalSpecification.count();
    console.log(`\n📋 Technical Specs: ${technicalSpecs}`);

    // Recent products with variants
    const variableProductsWithVariants = await prisma.product.findMany({
      where: { productType: 'VARIABLE' },
      include: {
        variantGroups: {
          include: {
            options: true,
          },
        },
        productVariants: true,
      },
      take: 3,
    });

    console.log(`\n🎯 Sample Variable Products:`);
    variableProductsWithVariants.forEach(product => {
      console.log(`   📦 ${product.sku} - ${product.title}`);
      console.log(
        `       └─ ${product.productVariants.length} variants, ${product.variantGroups.length} groups`
      );
      product.variantGroups.forEach(group => {
        console.log(
          `           ├─ ${group.name}: ${group.options.length} options (${group.inputType})`
        );
      });
    });

    // Check for any errors or incomplete imports
    const incompleteVariableProducts = await prisma.product.count({
      where: {
        productType: 'VARIABLE',
        productVariants: {
          none: {},
        },
      },
    });

    if (incompleteVariableProducts > 0) {
      console.log(
        `\n⚠️  Warning: ${incompleteVariableProducts} variable products without variants`
      );
    }

    console.log('\n✅ Database state check complete');
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
