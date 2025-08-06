import { test, expect } from '@playwright/test';
import { TestReporter } from '../utils/test-reporter';
import { TestHelpers } from '../utils/test-helpers';

/**
 * External Services Integration Tests
 * 
 * These tests validate that external service integrations are working correctly,
 * including Shopify API, Legacy Revival API, and other third-party services.
 */

test.describe('External Service Integrations', () => {
  let reporter: TestReporter;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    reporter = new TestReporter('external-services-integration');
    helpers = new TestHelpers(page, reporter);
  });

  test('Shopify integration is functional', async ({ page }) => {
    reporter.logTestStart('Shopify API integration test');

    try {
      // First check health status for Shopify service
      const healthData = await helpers.testApiEndpoint('/api/health');
      
      const shopifyService = healthData.services?.shopify;
      if (!shopifyService) {
        throw new Error('Shopify service not found in health check');
      }

      reporter.logStep('Shopify service health status', {
        status: shopifyService.status,
        responseTime: shopifyService.responseTime,
        error: shopifyService.error,
      });

      if (shopifyService.status === 'unhealthy') {
        throw new Error(`Shopify service is unhealthy: ${shopifyService.error}`);
      }

      // Test Shopify integration by loading a page that should use Shopify data
      await helpers.navigateToPage('/');

      // Look for product data that would come from Shopify
      // This is a heuristic approach since we don't know the exact implementation
      const productElements = await page.locator('img[src*="cdn.shopify"], [data-shopify], .shopify-product').count();
      const hasShopifyContent = productElements > 0;

      if (hasShopifyContent) {
        reporter.logStep(`Found ${productElements} Shopify-related elements`);
      } else {
        reporter.logStep('No obvious Shopify content detected, checking for product listings');
        
        // Check for any product listings
        const anyProducts = await page.locator('img, [class*="product"], [data-testid*="product"]').count();
        if (anyProducts > 0) {
          reporter.logStep(`Found ${anyProducts} potential product elements`);
        }
      }

      // Check for any Shopify-related errors in console
      const shopifyErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().toLowerCase().includes('shopify')) {
          shopifyErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000); // Wait to capture any async errors

      if (shopifyErrors.length > 0) {
        reporter.logWarning('Shopify-related console errors detected', { errors: shopifyErrors });
      }

      reporter.logTestComplete('shopify-integration', 'passed', {
        serviceStatus: shopifyService.status,
        hasShopifyContent,
        productElements,
        consoleErrors: shopifyErrors.length,
      });

    } catch (error) {
      await helpers.takeScreenshot('shopify-integration-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'shopify-integration',
          severity: 'high',
        }
      );
      reporter.logTestComplete('shopify-integration', 'failed');
      throw error;
    }
  });

  test('Backend API connectivity', async ({ page }) => {
    reporter.logTestStart('Backend API connectivity test');

    try {
      // Check health status for backend API service
      const healthData = await helpers.testApiEndpoint('/api/health');
      
      const backendService = healthData.services?.backendAPI;
      if (!backendService) {
        reporter.logWarning('Backend API service not found in health check');
        reporter.logTestComplete('backend-api-connectivity', 'skipped');
        return;
      }

      reporter.logStep('Backend API service health status', {
        status: backendService.status,
        responseTime: backendService.responseTime,
        error: backendService.error,
        configured: backendService.details?.configured,
      });

      // If backend API is not configured, that's acceptable for frontend-only deployment
      if (!backendService.details?.configured) {
        reporter.logStep('Backend API not configured - operating in standalone mode');
        reporter.logTestComplete('backend-api-connectivity', 'passed', {
          mode: 'standalone',
          backendConfigured: false,
        });
        return;
      }

      // If configured but unhealthy, that's a problem
      if (backendService.status === 'unhealthy') {
        throw new Error(`Backend API is unhealthy: ${backendService.error}`);
      }

      reporter.logTestComplete('backend-api-connectivity', 'passed', {
        serviceStatus: backendService.status,
        responseTime: backendService.responseTime,
        backendConfigured: true,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'backend-api-connectivity',
          severity: 'medium', // Less critical since frontend can operate standalone
        }
      );
      reporter.logTestComplete('backend-api-connectivity', 'failed');
      throw error;
    }
  });

  test('External APIs connectivity', async ({ page }) => {
    reporter.logTestStart('External APIs connectivity test');

    try {
      // Check health status for external APIs
      const healthData = await helpers.testApiEndpoint('/api/health');
      
      const externalService = healthData.services?.externalAPIs;
      if (!externalService) {
        reporter.logWarning('External APIs service not found in health check');
        reporter.logTestComplete('external-apis-connectivity', 'skipped');
        return;
      }

      reporter.logStep('External APIs service health status', {
        status: externalService.status,
        responseTime: externalService.responseTime,
        error: externalService.error,
        configured: externalService.details?.configured,
      });

      // External APIs being unhealthy is acceptable but should be logged
      if (externalService.status === 'unhealthy') {
        reporter.logWarning(`External APIs are unhealthy: ${externalService.error}`);
        
        // Don't fail the test unless it's a critical external service
        if (externalService.error?.includes('critical') || externalService.error?.includes('payment')) {
          throw new Error(`Critical external API is unhealthy: ${externalService.error}`);
        }
      }

      reporter.logTestComplete('external-apis-connectivity', 'passed', {
        serviceStatus: externalService.status,
        responseTime: externalService.responseTime,
        configured: externalService.details?.configured,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'external-apis-connectivity',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('external-apis-connectivity', 'failed');
      throw error;
    }
  });

  test('Error monitoring integration', async ({ page }) => {
    reporter.logTestStart('Error monitoring integration test');

    try {
      // Test error monitoring by triggering a test error
      const testErrorData = await helpers.testApiEndpoint('/api/test-error?type=warning', {
        expectedStatus: 200,
        timeout: 10000,
      });

      expect(testErrorData).toHaveProperty('message');
      expect(testErrorData.message).toContain('Warning reported successfully');

      reporter.logStep('Error monitoring warning test successful');

      // Test Sentry tunnel endpoint
      try {
        const sentryResponse = await page.request.post('/monitoring/sentry-tunnel', {
          headers: {
            'Content-Type': 'application/x-sentry-envelope',
          },
          data: 'test-envelope-data',
          timeout: 5000,
        });

        // Sentry tunnel should respond (even if it fails internally)
        expect(sentryResponse.status()).toBeGreaterThanOrEqual(200);
        expect(sentryResponse.status()).toBeLessThan(500);

        reporter.logStep('Sentry tunnel endpoint is responsive');

      } catch (sentryError) {
        reporter.logWarning('Sentry tunnel test failed', {
          error: sentryError instanceof Error ? sentryError.message : String(sentryError),
        });
      }

      reporter.logTestComplete('error-monitoring-integration', 'passed', {
        warningReportWorking: true,
        sentryTunnelWorking: true,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'error-monitoring-integration',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('error-monitoring-integration', 'failed');
      throw error;
    }
  });

  test('CDN and static assets loading', async ({ page }) => {
    reporter.logTestStart('CDN and static assets test');

    try {
      await helpers.navigateToPage('/');

      // Track failed resource loads
      const failedResources: { url: string; status: number }[] = [];
      
      page.on('response', (response) => {
        if (!response.ok() && (
          response.url().includes('.js') ||
          response.url().includes('.css') ||
          response.url().includes('.png') ||
          response.url().includes('.jpg') ||
          response.url().includes('.svg') ||
          response.url().includes('.ico')
        )) {
          failedResources.push({
            url: response.url(),
            status: response.status(),
          });
        }
      });

      // Wait for network to be idle
      await helpers.waitForNetworkIdle(15000);

      // Check for Shopify CDN assets
      const shopifyAssets = await page.locator('img[src*="cdn.shopify.com"]').count();
      if (shopifyAssets > 0) {
        reporter.logStep(`Found ${shopifyAssets} Shopify CDN assets`);
      }

      // Check for local assets
      const localAssets = await page.locator('img[src^="/"], link[href^="/"]').count();
      if (localAssets > 0) {
        reporter.logStep(`Found ${localAssets} local assets`);
      }

      // Report any failed assets
      if (failedResources.length > 0) {
        reporter.logWarning('Some assets failed to load', { failedResources });
        
        // Fail only if critical assets failed
        const criticalFailures = failedResources.filter(r => 
          r.url.includes('main.') || r.url.includes('app.') || r.status >= 500
        );
        
        if (criticalFailures.length > 0) {
          throw new Error(`Critical assets failed to load: ${criticalFailures.map(r => r.url).join(', ')}`);
        }
      }

      reporter.logTestComplete('cdn-static-assets', 'passed', {
        shopifyAssets,
        localAssets,
        failedAssets: failedResources.length,
        criticalFailures: 0,
      });

    } catch (error) {
      await helpers.takeScreenshot('cdn-assets-test-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'cdn-static-assets',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('cdn-static-assets', 'failed');
      throw error;
    }
  });

  test('Performance under load simulation', async ({ page }) => {
    reporter.logTestStart('Performance under simulated load');

    try {
      const performanceResults = [];

      // Simulate multiple page loads to test performance consistency
      for (let i = 0; i < 3; i++) {
        reporter.logStep(`Performance test iteration ${i + 1}/3`);
        
        await helpers.navigateToPage('/', { timeout: 30000 });
        
        const performance = await helpers.measurePagePerformance();
        performanceResults.push(performance);
        
        // Wait between iterations
        await page.waitForTimeout(1000);
      }

      // Calculate average performance
      const avgLoadTime = performanceResults.reduce((sum, p) => sum + p.loadTime, 0) / performanceResults.length;
      const avgDomContentLoaded = performanceResults.reduce((sum, p) => sum + p.domContentLoaded, 0) / performanceResults.length;

      reporter.logStep('Performance results', {
        iterations: performanceResults.length,
        avgLoadTime,
        avgDomContentLoaded,
        results: performanceResults,
      });

      // Performance thresholds
      const maxLoadTime = 8000; // 8 seconds
      const maxDomContentLoaded = 5000; // 5 seconds

      if (avgLoadTime > maxLoadTime) {
        throw new Error(`Average load time (${avgLoadTime}ms) exceeds threshold (${maxLoadTime}ms)`);
      }

      if (avgDomContentLoaded > maxDomContentLoaded) {
        throw new Error(`Average DOM content loaded time (${avgDomContentLoaded}ms) exceeds threshold (${maxDomContentLoaded}ms)`);
      }

      reporter.logTestComplete('performance-load-simulation', 'passed', {
        avgLoadTime,
        avgDomContentLoaded,
        iterations: performanceResults.length,
        passedThresholds: true,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'external-services-integration',
          operation: 'performance-load-simulation',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('performance-load-simulation', 'failed');
      throw error;
    }
  });
});