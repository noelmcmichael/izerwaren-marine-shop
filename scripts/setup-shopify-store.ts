#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Automated Shopify Development Store Setup
 * Creates a development store and configures API access for migration
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';

const program = new Command();

interface StoreSetupConfig {
  storeName: string;
  storeUrl?: string;
  adminAccessToken?: string;
  partnerApiKey: string;
  partnerApiSecret: string;
}

async function getPartnerCredentials(): Promise<{ apiKey: string; apiSecret: string } | null> {
  try {
    // Read credentials that were saved earlier
    const credentialsPath = '/tmp/shopify_credentials.txt';
    
    try {
      const content = await fs.readFile(credentialsPath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length >= 2) {
        return {
          apiKey: lines[0].trim(),
          apiSecret: lines[1].trim()
        };
      }
    } catch {
      // File doesn't exist, try alternative approach
    }

    // Fallback: Use keyring command line
    
    console.log('🔄 Retrieving credentials from Memex secrets...');
    
    // For now, instruct user to provide the store domain manually
    console.log('⚠️  For now, we need to set up the store manually.');
    console.log('   Please provide your store domain and access token.');
    
    return null;
  } catch (error) {
    console.error('❌ Error retrieving Partner credentials:', error);
    return null;
  }
}

async function createDevStore(config: StoreSetupConfig): Promise<void> {
  console.log('🏪 SHOPIFY DEVELOPMENT STORE SETUP');
  console.log('==================================\n');
  
  console.log('📋 Store Configuration:');
  console.log(`   Store Name: ${config.storeName}`);
  console.log(`   Partner API Key: ${config.partnerApiKey.substring(0, 8)}...`);
  console.log('');
  
  // For now, provide manual setup instructions
  console.log('🔧 MANUAL SETUP REQUIRED');
  console.log('========================');
  console.log('');
  console.log('Since automated store creation requires additional Partner API setup,');
  console.log('please follow these steps:');
  console.log('');
  console.log('1. 🌐 Go to: https://partners.shopify.com/');
  console.log('2. 🏪 Click "Stores" → "Add store" → "Development store"');
  console.log('3. 📝 Store name: "izerwaren-dev" (or your preference)');
  console.log('4. 🎯 Purpose: "Testing new app or theme"');
  console.log('5. 💾 Click "Save" and wait for creation');
  console.log('');
  console.log('After store creation:');
  console.log('6. 🔗 Click "Log in to store"');
  console.log('7. ⚙️  Go to Apps → "App and sales channel settings"');
  console.log('8. 🔧 Click "Develop apps for your store"');
  console.log('9. ✅ Click "Allow custom app development"');
  console.log('10. 📱 Click "Create an app" → Name: "Izerwaren API"');
  console.log('');
  console.log('Configure API Scopes:');
  console.log('11. 📋 In "Admin API access scopes", enable:');
  console.log('    ✅ read_products, write_products');
  console.log('    ✅ read_inventory, write_inventory');
  console.log('    ✅ read_customers, write_customers');
  console.log('    ✅ read_orders, write_orders');
  console.log('12. 💾 Click "Save"');
  console.log('');
  console.log('Generate API Token:');
  console.log('13. 🔑 Click "API credentials" tab');
  console.log('14. ✅ Click "Install app" → "Install"');
  console.log('15. 📋 Copy the "Admin API access token" (starts with shpat_)');
  console.log('16. 📝 Note your store domain (ends with .myshopify.com)');
  console.log('');
  console.log('🎯 Once you have these, run:');
  console.log('   npm run shopify:configure <store-domain> <admin-access-token>');
}

async function configureEnvironment(storeDomain: string, adminAccessToken: string): Promise<void> {
  console.log('⚙️  CONFIGURING ENVIRONMENT');
  console.log('===========================\n');
  
  const envPath = '.env';
  const envContent = await fs.readFile(envPath, 'utf-8');
  
  // Update Shopify configuration
  let updatedContent = envContent;
  
  // Update store domain (remove placeholder)
  updatedContent = updatedContent.replace(
    /NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="[^"]*"/,
    `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="${storeDomain}"`
  );
  
  // Update admin access token (remove placeholder)  
  updatedContent = updatedContent.replace(
    /SHOPIFY_ADMIN_ACCESS_TOKEN="[^"]*"/,
    `SHOPIFY_ADMIN_ACCESS_TOKEN="${adminAccessToken}"`
  );
  
  // Add missing SHOPIFY_SHOP_DOMAIN if needed
  if (!updatedContent.includes('SHOPIFY_SHOP_DOMAIN=')) {
    updatedContent += `\n# Shopify Store Configuration\nSHOPIFY_SHOP_DOMAIN="${storeDomain}"\n`;
  } else {
    updatedContent = updatedContent.replace(
      /SHOPIFY_SHOP_DOMAIN="[^"]*"/,
      `SHOPIFY_SHOP_DOMAIN="${storeDomain}"`
    );
  }
  
  await fs.writeFile(envPath, updatedContent);
  
  console.log('✅ Environment configured successfully!');
  console.log(`🏪 Store Domain: ${storeDomain}`);
  console.log(`🔑 Admin Token: ${adminAccessToken.substring(0, 8)}...`);
  console.log('');
  console.log('🚀 Ready to test migration:');
  console.log('   npm run shopify:validate    # Test connection');
  console.log('   npm run shopify:migrate:dry-run  # Dry run');
  console.log('   npm run shopify:migrate     # Full migration');
}

// CLI Commands
program
  .name('setup-shopify-store')
  .description('Setup Shopify development store for migration');

program
  .command('create')
  .description('Create development store (manual setup guide)')
  .option('--store-name <name>', 'Store name', 'izerwaren-dev')
  .action(async (options) => {
    const credentials = await getPartnerCredentials();
    if (!credentials) {
      console.error('❌ Could not retrieve Partner API credentials');
      process.exit(1);
    }
    
    await createDevStore({
      storeName: options.storeName,
      partnerApiKey: credentials.apiKey,
      partnerApiSecret: credentials.apiSecret
    });
  });

program
  .command('configure')
  .description('Configure environment with store credentials')
  .argument('<store-domain>', 'Store domain (e.g., my-store.myshopify.com)')
  .argument('<admin-access-token>', 'Admin API access token (starts with shpat_)')
  .action(async (storeDomain, adminAccessToken) => {
    if (!storeDomain.includes('.myshopify.com')) {
      console.error('❌ Store domain must end with .myshopify.com');
      process.exit(1);
    }
    
    if (!adminAccessToken.startsWith('shpat_')) {
      console.error('❌ Admin access token must start with shpat_');
      process.exit(1);
    }
    
    await configureEnvironment(storeDomain, adminAccessToken);
  });

program
  .command('test')
  .description('Test current Shopify configuration')
  .action(async () => {
    console.log('🔍 TESTING SHOPIFY CONFIGURATION');
    console.log('================================\n');
    
    // Check environment variables
    const envPath = '.env';
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    const shopDomain = envContent.match(/SHOPIFY_SHOP_DOMAIN="([^"]*)"/)?.[1];
    const adminToken = envContent.match(/SHOPIFY_ADMIN_ACCESS_TOKEN="([^"]*)"/)?.[1];
    
    if (!shopDomain || shopDomain === 'dev-store.myshopify.com') {
      console.log('❌ Store domain not configured');
    } else {
      console.log(`✅ Store domain: ${shopDomain}`);
    }
    
    if (!adminToken || adminToken === 'dev-token') {
      console.log('❌ Admin access token not configured');
    } else {
      console.log(`✅ Admin token: ${adminToken.substring(0, 8)}...`);
    }
    
    if (shopDomain && adminToken && 
        shopDomain !== 'dev-store.myshopify.com' && 
        adminToken !== 'dev-token') {
      console.log('\n🚀 Configuration looks good! Ready to test:');
      console.log('   npm run shopify:validate');
    } else {
      console.log('\n⚠️  Configuration incomplete. Run:');
      console.log('   npm run shopify:setup configure <domain> <token>');
    }
  });

if (require.main === module) {
  program.parse();
}