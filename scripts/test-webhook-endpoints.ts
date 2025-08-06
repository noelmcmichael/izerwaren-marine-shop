#!/usr/bin/env ts-node

/**
 * Test Script for Shopify Webhook Endpoints
 * 
 * This script tests the webhook infrastructure including:
 * - Endpoint availability
 * - Signature validation
 * - Error handling
 * - Database integration
 */

import axios from 'axios';
import crypto from 'crypto';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'dev-webhook-secret';

interface WebhookTest {
  name: string;
  endpoint: string;
  payload: any;
  expectSuccess: boolean;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return hmac.digest('base64');
}

/**
 * Test webhook endpoint with proper signature
 */
async function testWebhookEndpoint(test: WebhookTest): Promise<boolean> {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    
    const payloadString = JSON.stringify(test.payload);
    const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);
    
    const response = await axios.post(`${BACKEND_URL}/api/v1/webhooks${test.endpoint}`, test.payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': signature,
        'X-Shopify-Shop-Domain': 'izerw-marine.myshopify.com',
      },
      timeout: 10000,
    });
    
    if (test.expectSuccess) {
      console.log(`✅ ${test.name} - Success (${response.status})`);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(`❌ ${test.name} - Expected failure but got success (${response.status})`);
      return false;
    }
    
  } catch (error: any) {
    if (!test.expectSuccess) {
      console.log(`✅ ${test.name} - Expected failure (${error.response?.status || 'Network Error'})`);
      return true;
    } else {
      console.log(`❌ ${test.name} - Unexpected failure:`, error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Test webhook health endpoint
 */
async function testWebhookHealth(): Promise<boolean> {
  try {
    console.log('\n🏥 Testing webhook health endpoint...');
    
    const response = await axios.get(`${BACKEND_URL}/api/v1/webhooks/health`);
    
    console.log('✅ Webhook health check passed');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error: any) {
    console.log('❌ Webhook health check failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test suite
 */
async function runWebhookTests() {
  console.log('🚀 Starting Webhook Endpoint Tests');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log(`🔐 Webhook Secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  
  // Test health endpoint first
  const healthPassed = await testWebhookHealth();
  if (!healthPassed) {
    console.log('\n❌ Health check failed - aborting tests');
    return;
  }
  
  // Define test cases
  const tests: WebhookTest[] = [
    {
      name: 'Product Create Webhook',
      endpoint: '/shopify/products/create',
      expectSuccess: true,
      payload: {
        id: 999999001,
        title: 'Test Product from Webhook',
        handle: 'test-product-webhook',
        body_html: '<p>This is a test product created via webhook</p>',
        vendor: 'Test Vendor',
        product_type: 'Test Category',
        status: 'active',
        tags: 'test, webhook',
        variants: [{
          id: 999999001,
          title: 'Default Title',
          sku: 'TEST-WEBHOOK-001',
          price: '99.99',
          inventory_quantity: 10,
          inventory_policy: 'deny',
        }],
        images: [{
          id: 999999001,
          src: 'https://example.com/test-image.jpg',
          alt: 'Test image',
          position: 1,
        }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    {
      name: 'Product Update Webhook',
      endpoint: '/shopify/products/update',
      expectSuccess: true,
      payload: {
        id: 999999001,
        title: 'Updated Test Product from Webhook',
        handle: 'test-product-webhook',
        body_html: '<p>This product was updated via webhook</p>',
        vendor: 'Updated Vendor',
        product_type: 'Updated Category',
        status: 'active',
        tags: 'test, webhook, updated',
        variants: [{
          id: 999999001,
          title: 'Default Title',
          sku: 'TEST-WEBHOOK-001',
          price: '149.99',
          inventory_quantity: 15,
          inventory_policy: 'continue',
        }],
        images: [{
          id: 999999001,
          src: 'https://example.com/updated-test-image.jpg',
          alt: 'Updated test image',
          position: 1,
        }],
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date().toISOString(),
      }
    },
    {
      name: 'Inventory Update Webhook',
      endpoint: '/shopify/inventory_levels/update',
      expectSuccess: true,
      payload: {
        inventory_item_id: 999999001,
        location_id: 1,
        available: 25,
        updated_at: new Date().toISOString(),
      }
    },
    {
      name: 'Order Create Webhook',
      endpoint: '/shopify/orders/create',
      expectSuccess: true,
      payload: {
        id: 999999001,
        order_number: 1001,
        email: 'test@example.com',
        customer: {
          id: 999999001,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'Customer',
        },
        line_items: [{
          id: 999999001,
          variant_id: 999999001,
          title: 'Test Product',
          quantity: 2,
          price: '99.99',
          sku: 'TEST-WEBHOOK-001',
        }],
        total_price: '199.98',
        subtotal_price: '199.98',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    {
      name: 'Product Delete Webhook',
      endpoint: '/shopify/products/delete',
      expectSuccess: true,
      payload: {
        id: 999999001,
      }
    },
  ];
  
  // Run all tests
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testWebhookEndpoint(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All webhook tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} tests failed. Check the logs above for details.`);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runWebhookTests().catch(console.error);
}

export { runWebhookTests };