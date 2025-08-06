// Quick script to get sample product data for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getSampleProducts() {
  try {
    console.log('🔍 Fetching sample products for cart testing...\n');

    // First check what's in the database
    const productCount = await prisma.product.count();
    const variantCount = await prisma.shopifyVariant.count();
    
    console.log(`Database counts: ${productCount} products, ${variantCount} variants\n`);
    
    // Get 5 simple products
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        shopifyVariants: {
          take: 2,
          select: {
            id: true,
            shopifyVariantId: true,
            title: true,
            sku: true,
            price: true,
          }
        },
        images: {
          take: 1,
          select: {
            imageUrl: true,
          }
        }
      }
    });

    // Also get some variants separately
    const variants = await prisma.shopifyVariant.findMany({
      take: 5,
      include: {
        product: {
          select: {
            title: true,
            sku: true,
            shopifyProductId: true,
          }
        }
      }
    });

    console.log(`📦 Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Shopify Product ID: ${product.shopifyProductId}`);
      
      if (product.shopifyVariants.length > 0) {
        console.log(`   Variants (${product.shopifyVariants.length}):`);
        product.shopifyVariants.forEach((variant, vIndex) => {
          console.log(`     ${vIndex + 1}. ${variant.title || 'Default'}`);
          console.log(`        Variant ID: ${variant.shopifyVariantId}`);
          console.log(`        SKU: ${variant.sku}`);
          console.log(`        Price: $${variant.price}`);
        });
      }
      
      if (product.images.length > 0) {
        console.log(`   Image: ${product.images[0].imageUrl}`);
      }
      
      console.log('');
    });

    console.log(`🔧 Found ${variants.length} standalone variants:\n`);

    variants.forEach((variant, index) => {
      console.log(`${index + 1}. ${variant.product?.title || 'Unknown Product'}`);
      console.log(`   Product ID: ${variant.product?.shopifyProductId || 'N/A'}`);
      console.log(`   Variant ID: ${variant.shopifyVariantId}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Price: $${variant.price}`);
      console.log('');
    });

    // Generate test curl commands
    console.log('🧪 Test API calls:\n');
    
    const testVariant = variants.length > 0 ? variants[0] : null;
    
    if (testVariant && testVariant.product?.shopifyProductId) {
      
      console.log('Add item to cart:');
      console.log(`curl -X POST http://localhost:3001/api/v1/customers/cart/items \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"productId": "${testVariant.product.shopifyProductId}", "variantId": "${testVariant.shopifyVariantId}", "quantity": 2}'`);
      console.log('');
      
      if (variants.length > 1) {
        const testVariant2 = variants[1];
        
        console.log('Bulk add multiple items:');
        console.log(`curl -X POST http://localhost:3001/api/v1/customers/cart/bulk/add \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{`);
        console.log(`    "items": [`);
        console.log(`      {"productId": "${testVariant.product.shopifyProductId}", "variantId": "${testVariant.shopifyVariantId}", "quantity": 1},`);
        console.log(`      {"productId": "${testVariant2.product?.shopifyProductId}", "variantId": "${testVariant2.shopifyVariantId}", "quantity": 3}`);
        console.log(`    ]`);
        console.log(`  }'`);
      }
    }

  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSampleProducts();