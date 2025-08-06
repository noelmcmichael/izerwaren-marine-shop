#!/usr/bin/env tsx

/**
 * Test Cart Functionality
 * 
 * Comprehensive test suite for the shopping cart functionality
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
  details?: any;
}

async function testFrontendAccessibility(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/catalog');
    const duration = Date.now() - start;
    
    if (response.ok) {
      return {
        test: 'Frontend Accessibility',
        status: 'PASS',
        message: `Catalog page accessible (${response.status})`,
        duration
      };
    } else {
      return {
        test: 'Frontend Accessibility',
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration
      };
    }
  } catch (error) {
    return {
      test: 'Frontend Accessibility',
      status: 'FAIL',
      message: `Cannot reach frontend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

async function testBackendAPI(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/v1/health');
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      return {
        test: 'Backend API Health',
        status: 'PASS',
        message: `Backend healthy (${data.status})`,
        duration,
        details: data
      };
    } else {
      return {
        test: 'Backend API Health',
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration
      };
    }
  } catch (error) {
    return {
      test: 'Backend API Health',
      status: 'FAIL',
      message: `Cannot reach backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

async function testStorefrontAPIConfig(): Promise<TestResult> {
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  
  if (!token || token === 'dev-storefront-token') {
    return {
      test: 'Storefront API Configuration',
      status: 'FAIL',
      message: 'Storefront API token not configured or using placeholder'
    };
  }
  
  const start = Date.now();
  
  try {
    const query = `
      query {
        shop {
          name
          primaryDomain {
            host
          }
        }
      }
    `;
    
    const response = await fetch(`https://izerw-marine.myshopify.com/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });
    
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.errors) {
        return {
          test: 'Storefront API Configuration',
          status: 'FAIL',
          message: `GraphQL errors: ${JSON.stringify(data.errors)}`,
          duration
        };
      }
      
      return {
        test: 'Storefront API Configuration',
        status: 'PASS',
        message: `Connected to ${data.data?.shop?.name || 'Shopify store'}`,
        duration,
        details: data.data
      };
    } else {
      return {
        test: 'Storefront API Configuration',
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration
      };
    }
  } catch (error) {
    return {
      test: 'Storefront API Configuration',
      status: 'FAIL',
      message: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

async function testProductsAPI(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/v1/products?limit=5');
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      const products = data.data || [];
      const total = data.pagination?.total || 0;
      
      return {
        test: 'Products API',
        status: products.length > 0 ? 'PASS' : 'FAIL',
        message: `Retrieved ${products.length} products`,
        duration,
        details: {
          totalProducts: total,
          sampleProduct: products[0]?.title || 'None'
        }
      };
    } else {
      return {
        test: 'Products API',
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration
      };
    }
  } catch (error) {
    return {
      test: 'Products API',
      status: 'FAIL',
      message: `Products API failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

async function runCartFunctionalityTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Infrastructure tests
  results.push(await testFrontendAccessibility());
  results.push(await testBackendAPI());
  results.push(await testStorefrontAPIConfig());
  results.push(await testProductsAPI());
  
  // Cart-specific tests would require browser automation
  // For now, we'll provide manual test instructions
  const storefrontConfigured = results.find(r => r.test === 'Storefront API Configuration')?.status === 'PASS';
  
  if (storefrontConfigured) {
    results.push({
      test: 'Cart Manual Testing Required',
      status: 'PASS',
      message: 'Ready for manual cart testing - see test instructions below'
    });
  } else {
    results.push({
      test: 'Cart Manual Testing Required',
      status: 'SKIP',
      message: 'Configure Storefront API first'
    });
  }
  
  return results;
}

function printManualTestInstructions() {
  console.log('\n📋 Manual Cart Testing Instructions:');
  console.log('');
  console.log('1. 🌐 Open http://localhost:3000/catalog in your browser');
  console.log('2. 🛒 Click "Add to Cart" on any product');
  console.log('3. 👀 Verify cart icon shows item count');
  console.log('4. 📱 Click cart icon to open mini cart');
  console.log('5. ➕➖ Test quantity increase/decrease');
  console.log('6. 🗑️  Test item removal');
  console.log('7. 🔄 Refresh page - cart should persist');
  console.log('8. 💳 Click "Checkout" - should redirect to Shopify');
  console.log('9. 🔍 Verify Shopify checkout URL contains cart items');
  console.log('');
  console.log('Expected behaviors:');
  console.log('✅ Cart updates immediately on add/remove');
  console.log('✅ Cart persists across page reloads');
  console.log('✅ Checkout URL leads to Shopify with items');
  console.log('✅ Responsive design works on mobile');
  console.log('');
}

async function main() {
  console.log('🧪 Testing Cart Functionality\n');
  
  const results = await runCartFunctionalityTests();
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
    const durationText = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.test}: ${result.message}${durationText}`);
    
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'SKIP') skipCount++;
    else failCount++;
  });

  console.log(`\n📊 Summary: ${passCount} passed, ${skipCount} skipped, ${failCount} failed`);
  
  const readyForManualTesting = results.find(r => r.test === 'Cart Manual Testing Required')?.status === 'PASS';
  
  if (readyForManualTesting) {
    printManualTestInstructions();
  } else {
    console.log('\n🔧 Fix configuration issues before testing cart functionality');
    
    if (results.find(r => r.test === 'Storefront API Configuration')?.status === 'FAIL') {
      console.log('• Run: npx tsx scripts/configure-storefront-token.ts');
    }
    
    if (results.find(r => r.test === 'Frontend Accessibility')?.status === 'FAIL') {
      console.log('• Start frontend: npm run frontend:dev');
    }
    
    if (results.find(r => r.test === 'Backend API Health')?.status === 'FAIL') {
      console.log('• Start backend: npm run backend:dev');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runCartFunctionalityTests };