/**
 * Migration script to expand from dealer-only to multi-account system
 * This preserves all existing dealer data by converting them to DEALER type accounts
 */

const { PrismaClient } = require('@prisma/client');

async function migrateToAccounts() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting migration to account system...');

    // Check if types exist before creating them
    try {
      await prisma.$executeRaw`CREATE TYPE "AccountType" AS ENUM ('DEALER', 'PRO', 'ACCOUNT_REP');`;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await prisma.$executeRaw`CREATE TYPE "AccountTier" AS ENUM ('STANDARD', 'PREMIUM', 'ENTERPRISE');`;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Create accounts table
    try {
      await prisma.$executeRaw`
        CREATE TABLE "accounts" (
          "id" TEXT NOT NULL,
          "firebase_uid" TEXT NOT NULL,
          "account_type" "AccountType" NOT NULL,
          "company_name" TEXT,
          "contact_email" TEXT NOT NULL,
          "contact_phone" TEXT,
          "tier" "AccountTier",
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          "territory_regions" TEXT[],
          "max_rfq_capacity" INTEGER,

          CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
        );
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Create unique index on firebase_uid
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX "accounts_firebase_uid_key" ON "accounts"("firebase_uid");`;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('Index may already exist, continuing...');
      }
    }

    // Create account_shopify_customers table
    try {
      await prisma.$executeRaw`
        CREATE TABLE "account_shopify_customers" (
          "id" TEXT NOT NULL,
          "account_id" TEXT NOT NULL,
          "shopify_customer_id" TEXT NOT NULL,

          CONSTRAINT "account_shopify_customers_pkey" PRIMARY KEY ("id")
        );
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Create indexes for account_shopify_customers
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "account_shopify_customers_account_id_shopify_customer_id_key" 
        ON "account_shopify_customers"("account_id", "shopify_customer_id");
      `;
    } catch (error) {
      console.log('Index may already exist, continuing...');
    }

    // Create account_pricing table
    try {
      await prisma.$executeRaw`
        CREATE TABLE "account_pricing" (
          "id" TEXT NOT NULL,
          "account_id" TEXT NOT NULL,
          "shopify_product_id" TEXT NOT NULL,
          "shopify_variant_id" TEXT,
          "markdown_percent" DECIMAL(5,2) NOT NULL,
          "fixed_price" DECIMAL(10,2),
          "min_quantity" INTEGER NOT NULL DEFAULT 1,
          "max_quantity" INTEGER,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "effective_until" TIMESTAMP(3),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "account_pricing_pkey" PRIMARY KEY ("id")
        );
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Create indexes for account_pricing
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "account_pricing_account_id_shopify_product_id_shopify_variant_id_key" 
        ON "account_pricing"("account_id", "shopify_product_id", "shopify_variant_id");
      `;
    } catch (error) {
      console.log('Index may already exist, continuing...');
    }

    // Add foreign key constraints
    try {
      await prisma.$executeRaw`
        ALTER TABLE "account_shopify_customers" 
        ADD CONSTRAINT "account_shopify_customers_account_id_fkey" 
        FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('Foreign key constraint may already exist, continuing...');
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "account_pricing" 
        ADD CONSTRAINT "account_pricing_account_id_fkey" 
        FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('Foreign key constraint may already exist, continuing...');
    }

    console.log('✅ Account system tables created');

    // Migrate existing dealers to accounts
    const dealers = await prisma.dealer.findMany();
    console.log(`📊 Found ${dealers.length} dealers to migrate`);

    for (const dealer of dealers) {
      // Convert dealer tier to account tier
      const tierMapping = {
        STANDARD: 'STANDARD',
        PREMIUM: 'PREMIUM',
        ENTERPRISE: 'ENTERPRISE',
      };

      const accountData = {
        id: dealer.id, // Keep same ID for consistency
        firebaseUid: dealer.firebaseUid,
        accountType: 'DEALER',
        companyName: dealer.companyName,
        contactEmail: dealer.contactEmail,
        contactPhone: dealer.contactPhone,
        tier: tierMapping[dealer.tier] || 'STANDARD',
        isActive: dealer.isActive,
        createdAt: dealer.createdAt,
        updatedAt: dealer.updatedAt,
        territoryRegions: [],
        maxRfqCapacity: null,
      };

      await prisma.account.create({
        data: accountData,
      });

      console.log(`✅ Migrated dealer: ${dealer.companyName}`);
    }

    // Migrate dealer shopify customers
    const dealerShopifyCustomers = await prisma.dealerShopifyCustomer.findMany();
    console.log(`📊 Found ${dealerShopifyCustomers.length} dealer-shopify mappings to migrate`);

    for (const mapping of dealerShopifyCustomers) {
      await prisma.accountShopifyCustomer.create({
        data: {
          accountId: mapping.dealerId, // Same ID as dealer
          shopifyCustomerId: mapping.shopifyCustomerId,
        },
      });
    }

    // Migrate dealer pricing
    const dealerPricing = await prisma.dealerPricing.findMany();
    console.log(`📊 Found ${dealerPricing.length} pricing rules to migrate`);

    for (const pricing of dealerPricing) {
      await prisma.accountPricing.create({
        data: {
          accountId: pricing.dealerId, // Same ID as dealer
          shopifyProductId: pricing.shopifyProductId,
          shopifyVariantId: pricing.shopifyVariantId,
          markdownPercent: pricing.markdownPercent,
          fixedPrice: pricing.fixedPrice,
          minQuantity: pricing.minQuantity,
          maxQuantity: pricing.maxQuantity,
          isActive: pricing.isActive,
          effectiveFrom: pricing.effectiveFrom,
          effectiveUntil: pricing.effectiveUntil,
          createdAt: pricing.createdAt,
          updatedAt: pricing.updatedAt,
        },
      });
    }

    // Update RFQ requests to include customer_id (same as dealer_id initially)
    try {
      await prisma.$executeRaw`ALTER TABLE "rfq_requests" ADD COLUMN "customer_id" TEXT;`;
    } catch (error) {
      console.log('Column customer_id may already exist, continuing...');
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "rfq_requests" ADD COLUMN "assigned_rep_id" TEXT;`;
    } catch (error) {
      console.log('Column assigned_rep_id may already exist, continuing...');
    }

    // Populate customer_id with dealer_id for existing RFQs
    await prisma.$executeRaw`
      UPDATE "rfq_requests" 
      SET "customer_id" = "dealer_id" 
      WHERE "customer_id" IS NULL AND "dealer_id" IS NOT NULL;
    `;

    // Add foreign key constraints for RFQ
    try {
      await prisma.$executeRaw`
        ALTER TABLE "rfq_requests" 
        ADD CONSTRAINT "rfq_requests_customer_id_fkey" 
        FOREIGN KEY ("customer_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('Foreign key constraint may already exist, continuing...');
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "rfq_requests" 
        ADD CONSTRAINT "rfq_requests_assigned_rep_id_fkey" 
        FOREIGN KEY ("assigned_rep_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `;
    } catch (error) {
      console.log('Foreign key constraint may already exist, continuing...');
    }

    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`  - Migrated ${dealers.length} dealers to accounts`);
    console.log(`  - Migrated ${dealerShopifyCustomers.length} shopify customer mappings`);
    console.log(`  - Migrated ${dealerPricing.length} pricing rules`);
    console.log('  - Updated RFQ system for account assignment');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateToAccounts()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToAccounts };
