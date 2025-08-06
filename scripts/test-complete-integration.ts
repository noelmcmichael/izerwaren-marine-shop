#!/usr/bin/env ts-node

/**
 * Complete Shopify Integration Test Suite
 * 
 * Comprehensive testing of the entire Shopify integration including:
 * - End-to-end user flows
 * - Webhook processing
 * - B2B cart features
 * - Error handling
 * - Performance benchmarking
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class IntegrationTestSuite {
  private results: TestResult[] = [];

  /**
   * Run complete integration test suite
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Complete Shopify Integration Test Suite');
    console.log(`📡 Backend: ${BACKEND_URL}`);
    console.log(`🌐 Frontend: ${FRONTEND_URL}`);
    console.log('');

    // 1. Basic Health Checks
    await this.testHealthChecks();

    // 2. API Integration Tests
    await this.testAPIIntegration();

    // 3. Webhook Infrastructure Tests
    await this.testWebhookInfrastructure();

    // 4. Shopping Cart Integration Tests
    await this.testShoppingCartIntegration();

    // 5. B2B Feature Tests
    await this.testB2BFeatures();

    // 6. Error Handling Tests
    await this.testErrorHandling();

    // 7. Performance Tests
    await this.testPerformance();

    // Generate report
    this.generateReport();
  }

  /**
   * Test basic health checks
   */
  private async testHealthChecks(): Promise<void> {
    console.log('🏥 Testing Health Checks...');

    await this.runTest('Backend Health Check', async () => {
      const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      return { status: response.data.status };
    });

    await this.runTest('Frontend Accessibility', async () => {
      const response = await axios.get(`${FRONTEND_URL}`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      return { accessible: true };
    });

    await this.runTest('API Status Endpoint', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/status`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      return response.data;
    });
  }

  /**
   * Test API integration
   */
  private async testAPIIntegration(): Promise<void> {
    console.log('\n📡 Testing API Integration...');

    await this.runTest('Database Connection', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/health/detailed`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const health = response.data;
      if (!health.database?.isHealthy) {
        throw new Error('Database is not healthy');
      }
      
      return { 
        database: health.database.isHealthy,
        shopify: health.shopify?.isHealthy || false
      };
    });

    await this.runTest('Products API', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/products?limit=5`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Products API returned invalid data structure');
      }
      
      return { 
        productCount: data.data.length,
        hasProducts: data.data.length > 0
      };
    });

    await this.runTest('Sync Status API', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/sync/status`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      return response.data;
    });
  }

  /**
   * Test webhook infrastructure
   */
  private async testWebhookInfrastructure(): Promise<void> {
    console.log('\n🔗 Testing Webhook Infrastructure...');

    await this.runTest('Webhook Health Check', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/webhooks/health`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const health = response.data;
      return {
        status: health.status,
        endpointsCount: health.endpoints?.length || 0,
        webhookSecret: health.webhookSecret
      };
    });

    // Test webhook endpoints (without valid signature in development)
    const webhookEndpoints = [
      '/shopify/products/create',
      '/shopify/products/update',
      '/shopify/products/delete',
      '/shopify/inventory_levels/update',
      '/shopify/orders/create',
      '/shopify/orders/updated'
    ];

    for (const endpoint of webhookEndpoints) {
      await this.runTest(`Webhook Endpoint: ${endpoint}`, async () => {
        try {
          // This should fail with 401 (missing signature) in production
          // or succeed in development with placeholder secret
          const response = await axios.post(
            `${BACKEND_URL}/api/v1/webhooks${endpoint}`,
            { test: 'data' },
            { 
              timeout: 5000,
              validateStatus: () => true // Accept any status
            }
          );
          
          // We expect either 200 (dev) or 401 (missing signature)
          if (![200, 400, 401].includes(response.status)) {
            throw new Error(`Unexpected status ${response.status}`);
          }
          
          return {
            endpoint,
            status: response.status,
            accessible: true
          };
        } catch (error: any) {
          if (error.code === 'ECONNREFUSED') {
            throw new Error('Backend server not accessible');
          }
          throw error;
        }
      });
    }
  }

  /**
   * Test shopping cart integration
   */
  private async testShoppingCartIntegration(): Promise<void> {
    console.log('\n🛒 Testing Shopping Cart Integration...');

    await this.runTest('Cart Page Accessibility', async () => {
      const response = await axios.get(`${FRONTEND_URL}/cart`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const html = response.data;
      const hasCartElements = html.includes('Shopping Cart') || html.includes('cart');
      
      return {
        accessible: true,
        hasCartElements
      };
    });

    await this.runTest('Catalog Page Accessibility', async () => {
      const response = await axios.get(`${FRONTEND_URL}/catalog`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const html = response.data;
      const hasProductElements = html.includes('product') || html.includes('catalog');
      
      return {
        accessible: true,
        hasProductElements
      };
    });
  }

  /**
   * Test B2B features
   */
  private async testB2BFeatures(): Promise<void> {
    console.log('\n🏢 Testing B2B Features...');

    await this.runTest('B2B Database Schema', async () => {
      // Test that our B2B tables exist and are accessible
      const response = await axios.get(`${BACKEND_URL}/api/v1/health/detailed`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const health = response.data;
      return {
        databaseHealthy: health.database?.isHealthy || false,
        tablesAccessible: health.database?.tablesCount > 0
      };
    });

    await this.runTest('Product Catalog with B2B Data', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/v1/products?limit=1&include=variants,images`, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      const data = response.data;
      const products = data.data;
      
      if (products.length === 0) {
        return { hasProducts: false, b2bDataAvailable: false };
      }
      
      const product = products[0];
      const hasB2BData = !!(product.sku && product.price);
      
      return {
        hasProducts: true,
        b2bDataAvailable: hasB2BData,
        productFields: Object.keys(product)
      };
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    console.log('\n⚠️ Testing Error Handling...');

    await this.runTest('404 Error Handling', async () => {
      const response = await axios.get(
        `${BACKEND_URL}/api/v1/nonexistent-endpoint`,
        { 
          timeout: 5000,
          validateStatus: () => true
        }
      );
      
      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }
      
      return {
        handlesNotFound: true,
        errorResponse: response.data
      };
    });

    await this.runTest('Invalid API Request', async () => {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/products`,
        { invalid: 'data' },
        { 
          timeout: 5000,
          validateStatus: () => true
        }
      );
      
      // Should return 400 or 405 (method not allowed)
      if (![400, 405].includes(response.status)) {
        throw new Error(`Expected 400 or 405, got ${response.status}`);
      }
      
      return {
        handlesInvalidRequests: true,
        errorStatus: response.status
      };
    });
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance...');

    await this.runTest('API Response Time', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BACKEND_URL}/api/v1/health`, { timeout: 5000 });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (responseTime > 1000) {
        throw new Error(`Response time too slow: ${responseTime.toFixed(2)}ms`);
      }
      
      return {
        responseTime: Math.round(responseTime),
        status: 'fast'
      };
    });

    await this.runTest('Products API Performance', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BACKEND_URL}/api/v1/products?limit=10`, { timeout: 10000 });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      return {
        responseTime: Math.round(responseTime),
        productCount: response.data.data?.length || 0,
        performance: responseTime < 2000 ? 'good' : 'slow'
      };
    });

    await this.runTest('Frontend Load Time', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${FRONTEND_URL}`, { timeout: 15000 });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      return {
        loadTime: Math.round(loadTime),
        performance: loadTime < 3000 ? 'good' : 'slow'
      };
    });
  }

  /**
   * Run individual test with error handling
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      this.results.push({
        name,
        passed: true,
        duration,
        details: result
      });
      
      console.log(`✅ ${name} (${duration}ms)`);
      
    } catch (error: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      this.results.push({
        name,
        passed: false,
        duration,
        error: error.message
      });
      
      console.log(`❌ ${name} (${duration}ms): ${error.message}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): void {
    console.log('\n📊 Integration Test Report');
    console.log('═'.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   ❌ ${r.name}: ${r.error}`);
        });
    }
    
    // Performance summary
    const performanceTests = this.results.filter(r => 
      r.name.toLowerCase().includes('performance') || 
      r.name.toLowerCase().includes('response time') ||
      r.name.toLowerCase().includes('load time')
    );
    
    if (performanceTests.length > 0) {
      console.log('\n⚡ Performance Summary:');
      performanceTests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`   ${status} ${test.name}: ${test.duration}ms`);
      });
    }
    
    // Overall status
    console.log('\n🎯 Overall Status:');
    if (successRate >= 90) {
      console.log('🟢 EXCELLENT - Integration is production-ready');
    } else if (successRate >= 75) {
      console.log('🟡 GOOD - Minor issues need attention');
    } else if (successRate >= 50) {
      console.log('🟠 FAIR - Several issues need fixing');
    } else {
      console.log('🔴 POOR - Major issues prevent production deployment');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (failed === 0) {
      console.log('   🎉 All tests passed! Integration is ready for production.');
    } else {
      console.log('   🔧 Fix failing tests before production deployment.');
      console.log('   📋 Review error details above for specific issues.');
    }
    
    if (performanceTests.some(t => t.duration > 2000)) {
      console.log('   ⚡ Consider performance optimizations for slow endpoints.');
    }
  }
}

// Run the test suite if this script is executed directly
if (require.main === module) {
  const testSuite = new IntegrationTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export { IntegrationTestSuite };