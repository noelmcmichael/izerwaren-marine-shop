import { PrismaClient, AccountType, AccountTier, RfqStatus, RfqPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding B2B Development Scenarios...');
  console.log('=====================================\n');

  try {
    // Clean up existing test data
    await cleanupTestData();
    
    // Create test accounts
    const accounts = await createTestAccounts();
    
    // Create test products (if needed)
    const products = await createTestProducts();
    
    // Create account pricing rules
    await createAccountPricing(accounts, products);
    
    // Create RFQ scenarios
    await createRfqScenarios(accounts, products);
    
    // Create shopping cart scenarios
    await createShoppingCartScenarios(accounts, products);
    
    // Create volume discount rules
    await createVolumeDiscounts(products);
    
    console.log('\n🎉 B2B seed data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Test Accounts: ${accounts.length}`);
    console.log(`   - Test Products: ${products.length}`);
    console.log('   - Pricing Rules: Created');
    console.log('   - RFQ Scenarios: Created');
    console.log('   - Cart Scenarios: Created');
    console.log('   - Volume Discounts: Created');

  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  // Delete test data (accounts with email containing 'test' or 'demo')
  await prisma.rfqItem.deleteMany({
    where: {
      rfqRequest: {
        customer: {
          contactEmail: {
            contains: 'test'
          }
        }
      }
    }
  });

  await prisma.rfqRequest.deleteMany({
    where: {
      customer: {
        contactEmail: {
          contains: 'test'
        }
      }
    }
  });

  await prisma.accountPricing.deleteMany({
    where: {
      account: {
        contactEmail: {
          contains: 'test'
        }
      }
    }
  });

  await prisma.account.deleteMany({
    where: {
      OR: [
        { contactEmail: { contains: 'test' } },
        { contactEmail: { contains: 'demo' } }
      ]
    }
  });

  console.log('   ✅ Cleanup completed');
}

async function createTestAccounts() {
  console.log('👥 Creating test accounts...');

  const accounts = [];

  // 1. Enterprise Dealer Account
  const enterpriseDealer = await prisma.account.create({
    data: {
      firebaseUid: 'test-enterprise-dealer-001',
      accountType: AccountType.DEALER,
      companyName: 'MegaCorp Industrial Solutions',
      contactEmail: 'purchasing@test-megacorp.com',
      contactPhone: '(555) 100-0001',
      tier: AccountTier.ENTERPRISE,
      isActive: true
    }
  });
  accounts.push(enterpriseDealer);

  // 2. Premium Dealer Account
  const premiumDealer = await prisma.account.create({
    data: {
      firebaseUid: 'test-premium-dealer-002',
      accountType: AccountType.DEALER,
      companyName: 'Pro Tools & Equipment LLC',
      contactEmail: 'orders@test-protools.com',
      contactPhone: '(555) 200-0002',
      tier: AccountTier.PREMIUM,
      isActive: true
    }
  });
  accounts.push(premiumDealer);

  // 3. Standard Dealer Account
  const standardDealer = await prisma.account.create({
    data: {
      firebaseUid: 'test-standard-dealer-003',
      accountType: AccountType.DEALER,
      companyName: 'Small Business Solutions',
      contactEmail: 'admin@test-smallbiz.com',
      contactPhone: '(555) 300-0003',
      tier: AccountTier.STANDARD,
      isActive: true
    }
  });
  accounts.push(standardDealer);

  // 4. Professional Account
  const professionalAccount = await prisma.account.create({
    data: {
      firebaseUid: 'test-professional-004',
      accountType: AccountType.PRO,
      companyName: 'Independent Contractor Services',
      contactEmail: 'contractor@test-independent.com',
      contactPhone: '(555) 400-0004',
      tier: AccountTier.STANDARD,
      isActive: true
    }
  });
  accounts.push(professionalAccount);

  // 5. Account Representative
  const accountRep = await prisma.account.create({
    data: {
      firebaseUid: 'test-account-rep-005',
      accountType: AccountType.ACCOUNT_REP,
      companyName: 'Izerwaren Sales Team',
      contactEmail: 'sales.rep@test-izerwaren.com',
      contactPhone: '(555) 500-0005',
      territoryRegions: ['North America', 'Canada'],
      maxRfqCapacity: 50,
      isActive: true
    }
  });
  accounts.push(accountRep);

  console.log(`   ✅ Created ${accounts.length} test accounts`);
  return accounts;
}

async function createTestProducts() {
  console.log('📦 Creating test products...');

  // Get existing products to use for testing
  const existingProducts = await prisma.product.findMany({
    take: 10,
    where: {
      status: 'active'
    }
  });

  if (existingProducts.length < 5) {
    // Create minimal test products if none exist
    const testProducts = [];
    
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          title: `Test Product ${i}`,
          handle: `test-product-${i}`,
          vendor: 'Test Vendor',
          productType: 'SIMPLE',
          tags: ['test', 'demo'],
          description: `Test product ${i} for B2B development and testing`,
          status: 'active',
          sku: `TEST-${i.toString().padStart(3, '0')}`,
          price: 100 + (i * 50), // $150, $200, $250, etc.
          retailPrice: 150 + (i * 60),
          categoryName: 'Test Category',
          availability: 'In Stock',
          hasVariants: false,
          variantCount: 0
        }
      });
      testProducts.push(product);
    }

    console.log(`   ✅ Created ${testProducts.length} test products`);
    return testProducts;
  }

  console.log(`   ✅ Using ${existingProducts.length} existing products for testing`);
  return existingProducts.slice(0, 5);
}

async function createAccountPricing(accounts: any[], products: any[]) {
  console.log('💰 Creating account pricing rules...');

  const pricingRules = [];

  // Enterprise dealer gets 25% markdown on all test products
  const enterpriseDealer = accounts.find(a => a.tier === AccountTier.ENTERPRISE);
  if (enterpriseDealer) {
    for (const product of products) {
      const pricing = await prisma.accountPricing.create({
        data: {
          accountId: enterpriseDealer.id,
          shopifyProductId: product.shopifyProductId || `test-${product.id}`,
          markdownPercent: 25.00,
          minQuantity: 1,
          isActive: true,
          effectiveFrom: new Date(),
          productId: product.id
        }
      });
      pricingRules.push(pricing);
    }
  }

  // Premium dealer gets 15% markdown on select products
  const premiumDealer = accounts.find(a => a.tier === AccountTier.PREMIUM);
  if (premiumDealer) {
    for (let i = 0; i < 3; i++) {
      const product = products[i];
      const pricing = await prisma.accountPricing.create({
        data: {
          accountId: premiumDealer.id,
          shopifyProductId: product.shopifyProductId || `test-${product.id}`,
          markdownPercent: 15.00,
          minQuantity: 5,
          maxQuantity: 100,
          isActive: true,
          effectiveFrom: new Date(),
          productId: product.id
        }
      });
      pricingRules.push(pricing);
    }
  }

  // Standard dealer gets fixed pricing on one product
  const standardDealer = accounts.find(a => a.tier === AccountTier.STANDARD && a.accountType === AccountType.DEALER);
  if (standardDealer && products[0]) {
    const pricing = await prisma.accountPricing.create({
      data: {
        accountId: standardDealer.id,
        shopifyProductId: products[0].shopifyProductId || `test-${products[0].id}`,
        markdownPercent: 0,
        fixedPrice: 175.00,
        minQuantity: 1,
        isActive: true,
        effectiveFrom: new Date(),
        productId: products[0].id
      }
    });
    pricingRules.push(pricing);
  }

  console.log(`   ✅ Created ${pricingRules.length} pricing rules`);
}

async function createRfqScenarios(accounts: any[], products: any[]) {
  console.log('📋 Creating RFQ scenarios...');

  const accountRep = accounts.find(a => a.accountType === AccountType.ACCOUNT_REP);
  const enterpriseDealer = accounts.find(a => a.tier === AccountTier.ENTERPRISE);
  const premiumDealer = accounts.find(a => a.tier === AccountTier.PREMIUM);

  if (!accountRep || !enterpriseDealer || !premiumDealer) {
    console.log('   ⚠️  Missing required accounts for RFQ scenarios');
    return;
  }

  // Scenario 1: Pending RFQ from Enterprise Dealer
  const rfq1 = await prisma.rfqRequest.create({
    data: {
      customerId: enterpriseDealer.id,
      assignedRepId: accountRep.id,
      requestNumber: 'RFQ-TEST-001',
      status: RfqStatus.PENDING,
      priority: RfqPriority.HIGH,
      customerMessage: 'Need urgent quote for large order. Please prioritize.',
      items: {
        create: [
          {
            shopifyProductId: products[0].shopifyProductId || `test-${products[0].id}`,
            sku: products[0].sku || `TEST-001`,
            productTitle: products[0].title,
            quantity: 100,
            notes: 'Bulk order for new facility'
          },
          {
            shopifyProductId: products[1].shopifyProductId || `test-${products[1].id}`,
            sku: products[1].sku || `TEST-002`,
            productTitle: products[1].title,
            quantity: 50,
            notes: 'Backup inventory'
          }
        ]
      }
    },
    include: { items: true }
  });

  // Scenario 2: Quoted RFQ from Premium Dealer
  const rfq2 = await prisma.rfqRequest.create({
    data: {
      customerId: premiumDealer.id,
      assignedRepId: accountRep.id,
      requestNumber: 'RFQ-TEST-002',
      status: RfqStatus.QUOTED,
      priority: RfqPriority.NORMAL,
      customerMessage: 'Standard reorder request.',
      adminNotes: 'Applied standard premium pricing. Valid for 30 days.',
      quotedTotal: 2750.00,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: {
        create: [
          {
            shopifyProductId: products[2].shopifyProductId || `test-${products[2].id}`,
            sku: products[2].sku || `TEST-003`,
            productTitle: products[2].title,
            quantity: 25,
            unitPrice: 110.00,
            totalPrice: 2750.00
          }
        ]
      }
    },
    include: { items: true }
  });

  console.log(`   ✅ Created 2 RFQ scenarios`);
}

async function createShoppingCartScenarios(accounts: any[], products: any[]) {
  console.log('🛒 Creating shopping cart scenarios...');

  const premiumDealer = accounts.find(a => a.tier === AccountTier.PREMIUM);
  const standardDealer = accounts.find(a => a.tier === AccountTier.STANDARD && a.accountType === AccountType.DEALER);

  // Note: Using legacy Dealer model for cart items (as defined in schema)
  const legacyDealers = await prisma.dealer.findMany({
    where: {
      firebaseUid: {
        in: [premiumDealer?.firebaseUid, standardDealer?.firebaseUid]
      }
    }
  });

  if (legacyDealers.length === 0) {
    console.log('   ⚠️  No legacy dealers found for cart scenarios');
    return;
  }

  // Current cart items for premium dealer
  if (legacyDealers[0] && products[0]) {
    await prisma.cartItem.create({
      data: {
        customerId: legacyDealers[0].id,
        shopifyProductId: products[0].shopifyProductId || `test-${products[0].id}`,
        shopifyVariantId: `variant-${products[0].id}-1`,
        quantity: 5,
        unitPrice: 120.00,
        totalPrice: 600.00
      }
    });
  }

  // Saved cart scenario
  if (legacyDealers[0]) {
    const savedCart = await prisma.savedCart.create({
      data: {
        customerId: legacyDealers[0].id,
        name: 'Monthly Reorder',
        itemCount: 2,
        totalValue: 950.00,
        items: {
          create: [
            {
              shopifyProductId: products[1].shopifyProductId || `test-${products[1].id}`,
              shopifyVariantId: `variant-${products[1].id}-1`,
              quantity: 3,
              unitPrice: 150.00,
              totalPrice: 450.00
            },
            {
              shopifyProductId: products[2].shopifyProductId || `test-${products[2].id}`,
              shopifyVariantId: `variant-${products[2].id}-1`,
              quantity: 2,
              unitPrice: 250.00,
              totalPrice: 500.00
            }
          ]
        }
      }
    });
  }

  console.log(`   ✅ Created cart scenarios for ${legacyDealers.length} dealers`);
}

async function createVolumeDiscounts(products: any[]) {
  console.log('📈 Creating volume discount rules...');

  const discountRules = [];

  // Create volume discounts for first 3 test products
  for (let i = 0; i < Math.min(3, products.length); i++) {
    const product = products[i];
    
    // 10% discount for 10+ units
    const discount1 = await prisma.volumeDiscount.create({
      data: {
        shopifyProductId: product.shopifyProductId || `test-${product.id}`,
        minQuantity: 10,
        discountPercent: 10.00
      }
    });
    
    // 20% discount for 50+ units
    const discount2 = await prisma.volumeDiscount.create({
      data: {
        shopifyProductId: product.shopifyProductId || `test-${product.id}`,
        minQuantity: 50,
        discountPercent: 20.00
      }
    });

    discountRules.push(discount1, discount2);
  }

  console.log(`   ✅ Created ${discountRules.length} volume discount rules`);
}

// Run the seed script
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });