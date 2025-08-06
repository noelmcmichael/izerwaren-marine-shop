// Verify the imported data

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  try {
    console.log('🔍 Verifying imported data...\n');

    // Get all products with their variants
    const products = await prisma.product.findMany({
      include: {
        variantGroups: {
          include: {
            options: true,
          },
        },
        productVariants: {
          include: {
            selections: {
              include: {
                option: {
                  include: {
                    variantGroup: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const product of products) {
      console.log(`📦 Product: ${product.sku} - ${product.title}`);
      console.log(`   Type: ${product.productType}, Has Variants: ${product.hasVariants}`);
      console.log(`   Price: $${product.price}, Handle: ${product.handle}`);

      if (product.variantGroups.length > 0) {
        console.log(`   📋 Variant Groups (${product.variantGroups.length}):`);
        for (const group of product.variantGroups) {
          console.log(
            `     - ${group.name} (${group.label}): ${group.inputType}, Required: ${group.required}`
          );
          console.log(`       Options: ${group.options.map(o => `"${o.value}"`).join(', ')}`);
        }
      }

      if (product.productVariants.length > 0) {
        console.log(`   🔀 Product Variants (${product.productVariants.length}):`);
        for (const variant of product.productVariants) {
          const selections = variant.selections
            .map(s => `${s.option.variantGroup.name}:${s.option.value}`)
            .join(', ');
          console.log(`     - ${variant.sku}: ${variant.title} [$${variant.price}]`);
          console.log(`       Selections: ${selections}`);
        }
      }

      console.log('');
    }

    // Summary statistics
    const stats = {
      products: await prisma.product.count(),
      variantGroups: await prisma.productVariantGroup.count(),
      variantOptions: await prisma.productVariantOption.count(),
      productVariants: await prisma.catalogProductVariant.count(),
      variantSelections: await prisma.productVariantSelection.count(),
    };

    console.log('📊 Database Statistics:');
    console.log(`   Products: ${stats.products}`);
    console.log(`   Variant Groups: ${stats.variantGroups}`);
    console.log(`   Variant Options: ${stats.variantOptions}`);
    console.log(`   Product Variants: ${stats.productVariants}`);
    console.log(`   Variant Selections: ${stats.variantSelections}`);

    console.log('\n✅ Verification completed!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport();
