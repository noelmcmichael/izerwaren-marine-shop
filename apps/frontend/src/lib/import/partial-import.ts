// Partial import to test with just a few variable products

import { PrismaClient } from '@prisma/client';

import { revivalApi } from './revival-api-client';
import { VariantGroup } from './types';
import {
  generateVariantCombinations,
  generateVariantSku,
  generateVariantTitle,
  generateVariantHandle,
} from './variant-utils';

const prisma = new PrismaClient();

async function partialImport() {
  try {
    console.log('🧪 Running partial import (3 variable products)...');

    // Get first 3 variable products
    const variableResponse = await revivalApi.getVariableProducts(3, 0);
    console.log(`📦 Retrieved ${variableResponse.products.length} variable products`);

    for (const variableProduct of variableResponse.products) {
      console.log(`\n🔧 Processing ${variableProduct.sku}: ${variableProduct.name}`);

      // 1. Create the base product
      const product = await prisma.product.upsert({
        where: { sku: variableProduct.sku },
        update: {
          title: variableProduct.name,
          price: variableProduct.price,
          productType: 'VARIABLE',
          hasVariants: true,
          variantCount: variableProduct.variant_count,
          handle: generateProductHandle(variableProduct.name),
          vendor: 'Izerwaren',
          status: 'active',
        },
        create: {
          sku: variableProduct.sku,
          title: variableProduct.name,
          price: variableProduct.price,
          productType: 'VARIABLE',
          hasVariants: true,
          variantCount: variableProduct.variant_count,
          handle: generateProductHandle(variableProduct.name),
          vendor: 'Izerwaren',
          status: 'active',
        },
      });

      console.log(`✅ Created product: ${product.id}`);

      // 2. Parse variants and create variant groups/options
      const variants: Record<string, VariantGroup> = JSON.parse(variableProduct.variants_json);
      console.log(`📋 Variant groups: ${Object.keys(variants).join(', ')}`);

      for (const [groupName, groupData] of Object.entries(variants)) {
        // Create variant group
        const variantGroup = await prisma.productVariantGroup.upsert({
          where: {
            productId_name: {
              productId: product.id,
              name: groupName,
            },
          },
          update: {
            label: groupData.label,
            inputType: groupName.includes('Handing') ? 'radio' : 'dropdown',
            required: groupName.includes('Handing'),
            sortOrder: getSortOrder(groupName),
          },
          create: {
            productId: product.id,
            name: groupName,
            label: groupData.label,
            inputType: groupName.includes('Handing') ? 'radio' : 'dropdown',
            required: groupName.includes('Handing'),
            sortOrder: getSortOrder(groupName),
          },
        });

        console.log(
          `  📝 Created variant group: ${groupName} (${groupData.options.length} options)`
        );

        // Create variant options
        for (let i = 0; i < groupData.options.length; i++) {
          const option = groupData.options[i];

          await prisma.productVariantOption.upsert({
            where: {
              variantGroupId_value: {
                variantGroupId: variantGroup.id,
                value: option.value,
              },
            },
            update: {
              displayText: option.text,
              sortOrder: i,
            },
            create: {
              variantGroupId: variantGroup.id,
              value: option.value,
              displayText: option.text,
              sortOrder: i,
            },
          });
        }
      }

      // 3. Generate product variants (SKU combinations)
      const combinations = generateVariantCombinations(variants);
      console.log(`🔀 Generating ${combinations.length} variant combinations...`);

      for (const combination of combinations) {
        const variantSku = generateVariantSku(product.sku!, combination);
        const variantTitle = generateVariantTitle(product.title, combination);

        const productVariant = await prisma.catalogProductVariant.upsert({
          where: { sku: variantSku },
          update: {
            title: variantTitle,
            price: product.price,
          },
          create: {
            productId: product.id,
            sku: variantSku,
            title: variantTitle,
            price: product.price,
            inventoryQty: 0,
            isActive: true,
          },
        });

        // Create variant selections (links to options)
        for (const [groupName, optionValue] of Object.entries(combination)) {
          const variantGroup = await prisma.productVariantGroup.findFirst({
            where: {
              productId: product.id,
              name: groupName,
            },
          });

          if (variantGroup) {
            const variantOption = await prisma.productVariantOption.findFirst({
              where: {
                variantGroupId: variantGroup.id,
                value: optionValue,
              },
            });

            if (variantOption) {
              await prisma.productVariantSelection.upsert({
                where: {
                  variantId_optionId: {
                    variantId: productVariant.id,
                    optionId: variantOption.id,
                  },
                },
                update: {},
                create: {
                  variantId: productVariant.id,
                  optionId: variantOption.id,
                },
              });
            }
          }
        }
      }

      console.log(`✅ Created ${combinations.length} product variants for ${variableProduct.sku}`);
    }

    // Show final stats
    const stats = await getStats();
    console.log('\n📊 Final Statistics:');
    console.log(`  Products: ${stats.products}`);
    console.log(`  Variant Groups: ${stats.variantGroups}`);
    console.log(`  Variant Options: ${stats.variantOptions}`);
    console.log(`  Product Variants: ${stats.productVariants}`);
    console.log(`  Variant Selections: ${stats.variantSelections}`);

    console.log('\n🎉 Partial import completed successfully!');
  } catch (error) {
    console.error('❌ Partial import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateProductHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getSortOrder(groupName: string): number {
  const order = {
    Handing: 1,
    'Rimlock Handing': 1,
    'Door Thickness': 2,
    'Profile Cylinder Type': 3,
    'Tubular Latch Function': 4,
    'Chrome Plating': 5,
    'Key Rose Thickness': 6,
    'Magnetic Door Holder Light Duty': 7,
    'Keyed alike': 8,
    'Glass Thickness for Strike Box #82.1124': 9,
  };
  return order[groupName as keyof typeof order] || 10;
}

async function getStats() {
  const [products, variantGroups, variantOptions, productVariants, variantSelections] =
    await Promise.all([
      prisma.product.count(),
      prisma.productVariantGroup.count(),
      prisma.productVariantOption.count(),
      prisma.catalogProductVariant.count(),
      prisma.productVariantSelection.count(),
    ]);

  return { products, variantGroups, variantOptions, productVariants, variantSelections };
}

partialImport();
