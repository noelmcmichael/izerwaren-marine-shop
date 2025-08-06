// Small test to import just a few products for validation

import { PrismaClient } from '@prisma/client';

import { revivalApi } from './revival-api-client';

const prisma = new PrismaClient();

async function smallTest() {
  try {
    console.log('🧪 Running small test import...');

    // Test API connection
    console.log('📡 Testing Revival API connection...');
    const summary = await revivalApi.getVariantSummary();
    console.log('✅ API connected. Summary:', {
      totalProducts: summary.extraction_progress.total_products,
      variableProducts: summary.variant_statistics.products_with_variants,
      simpleProducts: summary.variant_statistics.products_without_variants,
    });

    // Get first 5 products
    console.log('📦 Fetching sample products...');
    const response = await revivalApi.getAllProducts(5, 0);
    console.log(`📦 Retrieved ${response.products.length} sample products`);

    // Get variable products info
    console.log('🔧 Fetching variable products...');
    const variableResponse = await revivalApi.getVariableProducts(3, 0);
    console.log(`🔧 Retrieved ${variableResponse.products.length} variable products`);

    // Test variant data for one variable product
    if (variableResponse.products.length > 0) {
      const firstVariableProduct = variableResponse.products[0];
      console.log(`🔍 Testing variant data for ${firstVariableProduct.sku}...`);

      try {
        const variantData = await revivalApi.getProductVariants(firstVariableProduct.sku);
        console.log('✅ Variant data retrieved:', {
          hasVariants: variantData.has_variants,
          variantCount: variantData.variant_count,
          groups: Object.keys(variantData.variants),
        });
      } catch (error) {
        console.log('⚠️ Could not get variant data:', error);
      }
    }

    // Test technical specs
    console.log('📋 Testing technical specifications...');
    const firstProduct = response.products[0];
    try {
      const techSpecs = await revivalApi.getTechnicalSpecs(firstProduct.sku);
      console.log('✅ Technical specs retrieved for', firstProduct.sku);
      console.log('📊 Spec categories:', Object.keys(techSpecs.technical_specifications || {}));
    } catch (error) {
      console.log('⚠️ Could not get technical specs:', error);
    }

    // Test database connection
    console.log('🗄️ Testing database connection...');
    const existingProducts = await prisma.product.count();
    console.log(`✅ Database connected. Existing products: ${existingProducts}`);

    console.log('🎉 Small test completed successfully!');
  } catch (error) {
    console.error('❌ Small test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

smallTest();
