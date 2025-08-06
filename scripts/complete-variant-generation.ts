#!/usr/bin/env npx tsx

// Complete variant generation for the 60 variable products missing variants

import { PrismaClient } from '@prisma/client';

import { revivalApi } from '../src/lib/import/revival-api-client';
import {
  generateVariantCombinations,
  generateVariantSku,
  generateVariantTitle,
  generateVariantHandle,
} from '../src/lib/import/variant-utils';

const prisma = new PrismaClient();

interface VariantStats {
  processed: number;
  variantGroupsCreated: number;
  variantOptionsCreated: number;
  productVariantsCreated: number;
  errors: Array<{ sku: string; error: string }>;
}

async function completeVariantGeneration(): Promise<VariantStats> {
  console.log('🔧 Completing Variant Generation for Variable Products');
  console.log('=====================================================');

  const stats: VariantStats = {
    processed: 0,
    variantGroupsCreated: 0,
    variantOptionsCreated: 0,
    productVariantsCreated: 0,
    errors: [],
  };

  try {
    // Find all variable products without variants
    const incompleteProducts = await prisma.product.findMany({
      where: {
        productType: 'VARIABLE',
        productVariants: {
          none: {},
        },
      },
      include: {
        variantGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    console.log(
      `📋 Found ${incompleteProducts.length} variable products needing variant generation`
    );

    for (const product of incompleteProducts) {
      try {
        console.log(`\n🔄 Processing ${product.sku} - ${product.title}`);

        // Get variant data from Revival API
        const variantData = await revivalApi.getProductVariants(product.sku!);

        if (!variantData || !variantData.variants) {
          console.log(`  ⏭️  No variant data available for ${product.sku}`);
          continue;
        }

        // Check if variant groups already exist
        if (product.variantGroups.length === 0) {
          console.log(`  🏗️  Creating variant structure...`);

          // Create variant groups and options
          for (const [groupKey, groupData] of Object.entries(variantData.variants)) {
            if (!groupData || typeof groupData !== 'object' || !groupData.options) {
              continue;
            }

            const inputType = groupData.options.length <= 2 ? 'radio' : 'dropdown';

            const variantGroup = await prisma.productVariantGroup.create({
              data: {
                productId: product.id,
                name: groupKey,
                label: groupData.label || groupKey,
                inputType,
                required: true,
                sortOrder: 0,
              },
            });

            stats.variantGroupsCreated++;
            console.log(`    ✅ Created group: ${groupKey} (${groupData.options.length} options)`);

            // Create variant options
            for (let i = 0; i < groupData.options.length; i++) {
              const option = groupData.options[i];

              await prisma.productVariantOption.create({
                data: {
                  variantGroupId: variantGroup.id,
                  value: option.value,
                  displayText: option.text || option.value,
                  sortOrder: i,
                  priceModifier: 0,
                },
              });

              stats.variantOptionsCreated++;
            }
          }
        }

        // Generate product variants
        console.log(`  🎯 Generating product variants...`);
        const variantCount = await generateProductVariantsForProduct(product);
        stats.productVariantsCreated += variantCount;

        console.log(`  ✅ Generated ${variantCount} variants for ${product.sku}`);
        stats.processed++;
      } catch (error) {
        console.error(`  ❌ Failed to process ${product.sku}:`, error);
        stats.errors.push({
          sku: product.sku || 'unknown',
          error: (error as Error).message,
        });
      }
    }

    return stats;
  } catch (error) {
    console.error('❌ Variant generation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateProductVariantsForProduct(product: any): Promise<number> {
  // Get all variant groups for this product
  const variantGroups = await prisma.productVariantGroup.findMany({
    where: { productId: product.id },
    include: {
      options: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (variantGroups.length === 0) {
    return 0;
  }

  // Generate all possible combinations
  const combinations = generateVariantCombinations(
    variantGroups.map(group => ({
      name: group.name,
      options: group.options.map(opt => ({
        value: opt.value,
        text: opt.displayText,
      })),
    }))
  );

  let variantCount = 0;

  // Create product variants for each combination
  for (const combination of combinations) {
    const variantSku = generateVariantSku(product.sku, combination);
    const variantTitle = generateVariantTitle(product.title, combination);

    // Check if variant already exists
    const existingVariant = await prisma.catalogProductVariant.findUnique({
      where: { sku: variantSku },
    });

    if (existingVariant) {
      continue; // Skip if already exists
    }

    const productVariant = await prisma.catalogProductVariant.create({
      data: {
        productId: product.id,
        sku: variantSku,
        title: variantTitle,
        price: product.price || 0,
        isActive: true,
        inventoryQty: 100,
      },
    });

    // Create variant selections
    for (const selection of combination) {
      const option = await prisma.productVariantOption.findFirst({
        where: {
          variantGroup: {
            productId: product.id,
            name: selection.groupName,
          },
          value: selection.value,
        },
      });

      if (option) {
        await prisma.productVariantSelection.create({
          data: {
            variantId: productVariant.id,
            optionId: option.id,
          },
        });
      }
    }

    variantCount++;
  }

  return variantCount;
}

async function validateCompletion() {
  console.log('\n🔍 Validating completion...');

  const stats = {
    totalProducts: await prisma.product.count(),
    simpleProducts: await prisma.product.count({ where: { productType: 'SIMPLE' } }),
    variableProducts: await prisma.product.count({ where: { productType: 'VARIABLE' } }),
    variableWithoutVariants: await prisma.product.count({
      where: {
        productType: 'VARIABLE',
        productVariants: { none: {} },
      },
    }),
    variantGroups: await prisma.productVariantGroup.count(),
    variantOptions: await prisma.productVariantOption.count(),
    productVariants: await prisma.catalogProductVariant.count(),
  };

  console.log('📊 Final Statistics:');
  Object.entries(stats).forEach(([key, value]) => {
    const icon =
      key === 'variableWithoutVariants' && value === 0
        ? '✅'
        : key === 'variableWithoutVariants' && value > 0
          ? '⚠️'
          : '📊';
    console.log(`   ${icon} ${key}: ${value}`);
  });

  if (stats.variableWithoutVariants === 0) {
    console.log('\n🎉 Variant generation completed successfully!');
    console.log('✅ All variable products now have variants');
  } else {
    console.log(`\n⚠️  ${stats.variableWithoutVariants} variable products still missing variants`);
  }

  return stats.variableWithoutVariants === 0;
}

// Main execution
async function main() {
  try {
    const stats = await completeVariantGeneration();

    console.log('\n📊 Generation Summary:');
    console.log('======================');
    console.log(`✅ Products Processed: ${stats.processed}`);
    console.log(`🏗️  Variant Groups Created: ${stats.variantGroupsCreated}`);
    console.log(`⚙️  Variant Options Created: ${stats.variantOptionsCreated}`);
    console.log(`🎯 Product Variants Created: ${stats.productVariantsCreated}`);

    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors (${stats.errors.length}):`);
      stats.errors.forEach(error => {
        console.log(`   ${error.sku}: ${error.error}`);
      });
    }

    const success = await validateCompletion();

    if (success) {
      console.log('\n🎉 Production import fully completed!');
      console.log('💡 Ready for RFQ integration and Shopify mapping');
    } else {
      console.log('\n⚠️  Some issues remain - check errors above');
    }
  } catch (error) {
    console.error('❌ Variant completion failed:', error);
    process.exit(1);
  }
}

main();
