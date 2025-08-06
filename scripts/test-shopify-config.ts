#!/usr/bin/env tsx

/**
 * Test Shopify Configuration
 * 
 * Tests the current Shopify API configuration status
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function testShopifyConfig(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Environment Variables
  results.push({
    test: 'Environment Variables',
    status: process.env.SHOPIFY_SHOP_DOMAIN ? 'PASS' : 'FAIL',
    message: process.env.SHOPIFY_SHOP_DOMAIN 
      ? `Shop domain: ${process.env.SHOPIFY_SHOP_DOMAIN}`
      : 'SHOPIFY_SHOP_DOMAIN not configured'
  });

  results.push({
    test: 'Admin API Token',
    status: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? 'PASS' : 'FAIL',
    message: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN 
      ? `Token configured (${process.env.SHOPIFY_ADMIN_ACCESS_TOKEN.substring(0, 10)}...)`
      : 'SHOPIFY_ADMIN_ACCESS_TOKEN not configured'
  });

  results.push({
    test: 'Storefront API Token',
    status: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN === 'dev-storefront-token' 
      ? 'WARN' 
      : process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'PASS' : 'FAIL',
    message: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN === 'dev-storefront-token'
      ? 'Using placeholder token - checkout will not work'
      : process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN 
        ? 'Real token configured'
        : 'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN not configured'
  });

  // Test 2: Backend Admin API Connection
  try {
    const response = await fetch('http://localhost:3001/api/v1/sync/shopify/connection');
    const data = await response.json();
    
    results.push({
      test: 'Backend Admin API Connection',
      status: data.data?.connected ? 'PASS' : 'FAIL',
      message: data.data?.connected 
        ? `Connected to ${data.data.shop} with full permissions`
        : 'Admin API connection failed',
      details: data.data
    });
  } catch (error) {
    results.push({
      test: 'Backend Admin API Connection',
      status: 'FAIL',
      message: `Backend not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 3: Product Count Verification
  try {
    const response = await fetch('http://localhost:3001/api/v1/sync/shopify/products/count');
    const data = await response.json();
    
    results.push({
      test: 'Product Count Verification',
      status: data.data?.shopifyProductCount > 0 ? 'PASS' : 'FAIL',
      message: `Shopify has ${data.data?.shopifyProductCount || 0} products`,
      details: data.data
    });
  } catch (error) {
    results.push({
      test: 'Product Count Verification',
      status: 'FAIL',
      message: `Failed to get product count: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
}

async function main() {
  console.log('🧪 Testing Shopify Configuration\n');
  
  const results = await testShopifyConfig();
  
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
    
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'WARN') warnCount++;
    else failCount++;
  });

  console.log(`\n📊 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
  
  if (warnCount > 0 || failCount > 0) {
    console.log('\n🔧 Next Steps:');
    
    if (results.some(r => r.test === 'Storefront API Token' && r.status === 'WARN')) {
      console.log('1. Configure real Storefront API token for checkout functionality');
      console.log('   See docs/shopify-api-setup-guide.md for instructions');
    }
    
    if (failCount > 0) {
      console.log('2. Fix failed tests before proceeding');
    }
  } else {
    console.log('\n🎉 All tests passed! Ready for live checkout testing.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { testShopifyConfig };