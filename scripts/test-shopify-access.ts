#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Test Shopify API access and help determine next steps
 */

import * as keyring from 'keyring';

async function getShopifyCredentials() {
  try {
    const shopifyApiKey = await keyring.get('memex', 'shopify_api_key');
    const shopifyApiSecret = await keyring.get('memex', 'shopify_api_secret_key');
    
    if (!shopifyApiKey || !shopifyApiSecret) {
      console.error('❌ Could not retrieve Shopify credentials from Memex secrets');
      return null;
    }
    
    console.log('✅ Retrieved Shopify credentials from Memex secrets');
    console.log(`🔑 API Key: ${shopifyApiKey.substring(0, 8)}${'*'.repeat(shopifyApiKey.length - 8)}`);
    console.log(`🔐 API Secret: ${shopifyApiSecret.substring(0, 8)}${'*'.repeat(shopifyApiSecret.length - 8)}`);
    
    return { shopifyApiKey, shopifyApiSecret };
  } catch (error) {
    console.error('❌ Error retrieving credentials:', error);
    return null;
  }
}

async function analyzeCredentials() {
  console.log('🔍 SHOPIFY ACCESS ANALYSIS');
  console.log('========================\n');
  
  const credentials = await getShopifyCredentials();
  if (!credentials) {
    return;
  }
  
  const { shopifyApiKey, shopifyApiSecret } = credentials;
  
  // Analyze credential format
  console.log('📋 CREDENTIAL ANALYSIS');
  console.log('======================');
  
  if (shopifyApiKey.length === 32 && /^[a-f0-9]+$/.test(shopifyApiKey)) {
    console.log('✅ API Key format: Partner API Key (32 hex characters)');
  } else {
    console.log('⚠️  API Key format: Non-standard format');
  }
  
  if (shopifyApiSecret.length === 32 && /^[a-f0-9]+$/.test(shopifyApiSecret)) {
    console.log('✅ API Secret format: Partner API Secret (32 hex characters)');
  } else {
    console.log('⚠️  API Secret format: Non-standard format');
  }
  
  console.log('\n🏪 STORE SETUP REQUIREMENTS');
  console.log('===========================');
  console.log('Your credentials appear to be Partner API credentials.');
  console.log('For the migration, we need:');
  console.log('');
  console.log('1. A Shopify store (development or production)');
  console.log('2. Admin API access token for that specific store');
  console.log('3. Store domain (e.g., your-store.myshopify.com)');
  console.log('');
  console.log('📝 NEXT STEPS:');
  console.log('==============');
  console.log('A) Create a development store via Shopify Partners');
  console.log('B) Create a private app in that store');
  console.log('C) Generate Admin API access token');
  console.log('D) Configure store domain and access token');
  console.log('');
  console.log('Would you like help setting up a development store?');
}

if (require.main === module) {
  analyzeCredentials().catch(console.error);
}