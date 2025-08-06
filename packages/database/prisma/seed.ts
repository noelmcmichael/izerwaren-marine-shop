import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // Create sample dealers
  const dealer1 = await prisma.dealer.upsert({
    where: { firebaseUid: 'demo-firebase-uid-1' },
    update: {},
    create: {
      firebaseUid: 'demo-firebase-uid-1',
      companyName: 'ACME Tools & Equipment',
      contactEmail: 'demo@acmetools.com',
      contactPhone: '(555) 123-4567',
      tier: 'PREMIUM',
      isActive: true,
    },
  });

  const dealer2 = await prisma.dealer.upsert({
    where: { firebaseUid: 'demo-firebase-uid-2' },
    update: {},
    create: {
      firebaseUid: 'demo-firebase-uid-2',
      companyName: 'Pro Equipment Solutions',
      contactEmail: 'orders@proequipment.com',
      contactPhone: '(555) 987-6543',
      tier: 'STANDARD',
      isActive: true,
    },
  });

  const dealer3 = await prisma.dealer.upsert({
    where: { firebaseUid: 'demo-firebase-uid-3' },
    update: {},
    create: {
      firebaseUid: 'demo-firebase-uid-3',
      companyName: 'Industrial Supply Co.',
      contactEmail: 'purchasing@industrialsupply.com',
      contactPhone: '(555) 555-0123',
      tier: 'ENTERPRISE',
      isActive: true,
    },
  });

  console.log(
    `✅ Created dealers: ${dealer1.companyName}, ${dealer2.companyName}, ${dealer3.companyName}`
  );

  // Create sample products (shadow table for Shopify sync)
  const product1 = await prisma.product.upsert({
    where: { shopifyProductId: 'demo-product-1' },
    update: {},
    create: {
      shopifyProductId: 'demo-product-1',
      title: 'Professional Drill Set',
      handle: 'professional-drill-set',
      description: 'High-quality drill set for professional use',
      status: 'active',
      vendor: 'ToolMaster',
      productType: 'Power Tools',
      tags: ['power-tools', 'professional', 'drills'],
      variants: {
        create: [
          {
            shopifyVariantId: 'demo-variant-1',
            title: 'Standard Set',
            price: 199.99,
            sku: 'DRL-SET-001',
            inventoryQty: 50,
            weight: 5.2,
            weightUnit: 'lb',
          },
          {
            shopifyVariantId: 'demo-variant-2',
            title: 'Deluxe Set',
            price: 299.99,
            sku: 'DRL-SET-002',
            inventoryQty: 30,
            weight: 7.8,
            weightUnit: 'lb',
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.upsert({
    where: { shopifyProductId: 'demo-product-2' },
    update: {},
    create: {
      shopifyProductId: 'demo-product-2',
      title: 'Industrial Safety Vest',
      handle: 'industrial-safety-vest',
      description: 'High-visibility safety vest meeting OSHA standards',
      status: 'active',
      vendor: 'SafetyFirst',
      productType: 'Safety Equipment',
      tags: ['safety', 'vest', 'high-visibility'],
      variants: {
        create: [
          {
            shopifyVariantId: 'demo-variant-3',
            title: 'Size L',
            price: 29.99,
            sku: 'VEST-L-001',
            inventoryQty: 100,
            weight: 0.5,
            weightUnit: 'lb',
          },
          {
            shopifyVariantId: 'demo-variant-4',
            title: 'Size XL',
            price: 29.99,
            sku: 'VEST-XL-001',
            inventoryQty: 75,
            weight: 0.6,
            weightUnit: 'lb',
          },
        ],
      },
    },
  });

  console.log(`✅ Created products: ${product1.title}, ${product2.title}`);

  // Create sample dealer pricing (tier-based discounts)
  const pricing1 = await prisma.dealerPricing.upsert({
    where: {
      dealerId_shopifyProductId_shopifyVariantId: {
        dealerId: dealer1.id,
        shopifyProductId: 'demo-product-1',
        shopifyVariantId: 'demo-variant-1',
      },
    },
    update: {},
    create: {
      dealerId: dealer1.id,
      shopifyProductId: 'demo-product-1',
      shopifyVariantId: 'demo-variant-1',
      markdownPercent: 20.0, // 20% discount for Premium tier
      fixedPrice: 159.99,
      minQuantity: 1,
      isActive: true,
    },
  });

  const pricing2 = await prisma.dealerPricing.upsert({
    where: {
      dealerId_shopifyProductId_shopifyVariantId: {
        dealerId: dealer2.id,
        shopifyProductId: 'demo-product-1',
        shopifyVariantId: 'demo-variant-1',
      },
    },
    update: {},
    create: {
      dealerId: dealer2.id,
      shopifyProductId: 'demo-product-1',
      shopifyVariantId: 'demo-variant-1',
      markdownPercent: 10.0, // 10% discount for Standard tier
      fixedPrice: 179.99,
      minQuantity: 1,
      isActive: true,
    },
  });

  console.log(`✅ Created pricing rules for dealers`);

  // Create sample RFQ request
  const rfqRequest = await prisma.rfqRequest.create({
    data: {
      dealerId: dealer1.id,
      requestNumber: 'RFQ-2024-001',
      status: 'PENDING',
      priority: 'NORMAL',
      customerMessage: 'Need quote for bulk order - construction project',
      items: {
        create: [
          {
            shopifyProductId: 'demo-product-1',
            shopifyVariantId: 'demo-variant-1',
            sku: 'DRL-SET-001',
            productTitle: 'Professional Drill Set - Standard Set',
            quantity: 25,
            notes: 'Standard drill sets for crew',
          },
          {
            shopifyProductId: 'demo-product-2',
            shopifyVariantId: 'demo-variant-3',
            sku: 'VEST-L-001',
            productTitle: 'Industrial Safety Vest - Size L',
            quantity: 50,
            notes: 'Safety vests for all workers',
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample RFQ request: ${rfqRequest.id}`);

  // Create sample sync log entry
  const syncLog = await prisma.productSyncLog.create({
    data: {
      productId: product1.id,
      shopifyProductId: 'demo-product-1',
      operation: 'CREATE',
      status: 'SUCCESS',
      sourceData: {
        title: 'Professional Drill Set',
        vendor: 'ToolMaster',
        created: 'seed-script',
      },
    },
  });

  console.log(`✅ Created sync log entry: ${syncLog.id}`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Sample data created:');
  console.log(`   • 3 dealers (GOLD, SILVER, BRONZE tiers)`);
  console.log(`   • 2 products with variants`);
  console.log(`   • Tier-based pricing rules`);
  console.log(`   • 1 sample RFQ request`);
  console.log(`   • Sync operation log`);
  console.log('\n🔗 Test the admin portal at: http://localhost:3000/admin/dashboard');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
