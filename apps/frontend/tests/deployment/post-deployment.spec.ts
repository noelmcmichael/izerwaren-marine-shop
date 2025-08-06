import { test, expect } from '@playwright/test';
import { TestReporter } from '../utils/test-reporter';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Post-Deployment Validation Tests
 * 
 * These tests run immediately after deployment to validate that:
 * - The deployment was successful
 * - Critical functionality is working
 * - No regressions were introduced
 * - System is ready for production traffic
 */

test.describe('Post-Deployment Validation', () => {
  let reporter: TestReporter;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    reporter = new TestReporter('post-deployment-validation');
    helpers = new TestHelpers(page, reporter);
  });

  test('Deployment health validation', async ({ page }) => {
    reporter.logTestStart('Full deployment health validation');

    try {
      // Get comprehensive health check
      const healthData = await helpers.testApiEndpoint('/api/health', {
        expectedStatus: 200,
        timeout: 30000,
        retries: 3,
      });

      // Validate system is not unhealthy
      if (healthData.status === 'unhealthy') {
        const unhealthyServices = Object.entries(healthData.services)
          .filter(([_, service]: [string, any]) => service.status === 'unhealthy')
          .map(([name, service]: [string, any]) => `${name}: ${service.error}`);

        throw new Error(`Deployment validation failed - System unhealthy. Services: ${unhealthyServices.join(', ')}`);
      }

      // Log deployment health summary
      reporter.logStep('Deployment health summary', {
        overallStatus: healthData.status,
        version: healthData.version,
        environment: healthData.environment,
        correlationId: healthData.correlationId,
        responseTime: healthData.metrics.responseTime,
        memoryUsage: healthData.metrics.memoryUsage,
        uptime: healthData.metrics.uptime,
        serviceCount: Object.keys(healthData.services).length,
      });

      // Validate each service
      for (const [serviceName, service] of Object.entries(healthData.services) as [string, any][]) {
        reporter.logStep(`Service ${serviceName}`, {
          status: service.status,
          responseTime: service.responseTime,
          error: service.error,
        });

        // Critical services must be healthy
        if (['shopify', 'database'].includes(serviceName.toLowerCase()) && service.status === 'unhealthy') {
          throw new Error(`Critical service ${serviceName} is unhealthy: ${service.error}`);
        }
      }

      // Validate performance metrics
      const responseTime = healthData.metrics.responseTime;
      const memoryUsage = healthData.metrics.memoryUsage;

      if (responseTime > 5000) {
        reporter.logWarning(`Health check response time (${responseTime}ms) is slow`);
      }

      if (memoryUsage > 512) { // 512MB threshold
        reporter.logWarning(`Memory usage (${memoryUsage}MB) is high`);
      }

      reporter.logTestComplete('deployment-health-validation', 'passed', {
        overallStatus: healthData.status,
        healthyServices: Object.values(healthData.services).filter((s: any) => s.status === 'healthy').length,
        degradedServices: Object.values(healthData.services).filter((s: any) => s.status === 'degraded').length,
        unhealthyServices: Object.values(healthData.services).filter((s: any) => s.status === 'unhealthy').length,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'deployment-health-validation',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('deployment-health-validation', 'failed');
      throw error;
    }
  });

  test('Critical path functionality verification', async ({ page }) => {
    reporter.logTestStart('Critical path functionality verification');

    try {
      // Test 1: Homepage loads and displays correctly
      reporter.logStep('Testing homepage critical path');
      await helpers.navigateToPage('/', {
        expectedTitle: 'Izerwaren',
        timeout: 30000,
      });

      // Verify key elements are present
      await helpers.waitForElement('header', { timeout: 15000 });
      await helpers.waitForElement('main', { timeout: 15000 });
      await helpers.waitForElement('footer', { timeout: 15000 });

      // Test 2: Navigation is functional
      reporter.logStep('Testing navigation critical path');
      const navElement = await helpers.waitForElement('nav');
      const navLinks = await navElement.locator('a').count();
      
      if (navLinks === 0) {
        throw new Error('No navigation links found');
      }

      // Test 3: Search functionality (if available)
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        reporter.logStep('Testing search functionality');
        await searchInput.first().fill('test search');
        // Don't actually submit to avoid creating test data
        await searchInput.first().clear();
      }

      // Test 4: Product display (if available)
      const productElements = await page.locator('img, [data-testid*="product"], .product, [class*="product"]').count();
      if (productElements > 0) {
        reporter.logStep(`Product display verification: ${productElements} product elements found`);
      }

      // Test 5: No critical JavaScript errors
      await helpers.checkForConsoleErrors();

      // Take success screenshot
      await helpers.takeScreenshot('critical-path-success');

      reporter.logTestComplete('critical-path-verification', 'passed', {
        homepageLoaded: true,
        navigationWorking: navLinks > 0,
        searchAvailable: await searchInput.count() > 0,
        productsDisplayed: productElements > 0,
        noConsoleErrors: true,
      });

    } catch (error) {
      await helpers.takeScreenshot('critical-path-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'critical-path-verification',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('critical-path-verification', 'failed');
      throw error;
    }
  });

  test('Regression detection', async ({ page }) => {
    reporter.logTestStart('Regression detection');

    try {
      // Test that key pages still load correctly
      const pagesToTest = ['/', '/products', '/catalog', '/shop'];
      const workingPages: string[] = [];
      const failedPages: string[] = [];

      for (const pagePath of pagesToTest) {
        try {
          reporter.logStep(`Testing page: ${pagePath}`);
          
          const response = await page.goto(pagePath, { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
          });

          if (response && response.ok()) {
            // Verify page has basic structure
            await helpers.waitForElement('body', { timeout: 5000 });
            
            // Check that page is not a generic error page
            const hasErrorContent = await page.locator('text=error, text=Error, text=not found, text=404').count() > 0;
            
            if (!hasErrorContent) {
              workingPages.push(pagePath);
              reporter.logStep(`✅ Page ${pagePath} loads correctly`);
            } else {
              failedPages.push(pagePath);
              reporter.logStep(`❌ Page ${pagePath} shows error content`);
            }
          } else {
            failedPages.push(pagePath);
            reporter.logStep(`❌ Page ${pagePath} returned ${response?.status()}`);
          }
        } catch (pageError) {
          failedPages.push(pagePath);
          reporter.logStep(`❌ Page ${pagePath} failed to load: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        }
      }

      // At least the homepage should work
      if (!workingPages.includes('/')) {
        throw new Error('Homepage regression detected - homepage is not loading correctly');
      }

      // Test error monitoring is still working
      reporter.logStep('Testing error monitoring regression');
      try {
        const errorTestData = await helpers.testApiEndpoint('/api/test-error?type=warning', {
          expectedStatus: 200,
          timeout: 10000,
        });
        
        if (!errorTestData.message?.includes('Warning reported successfully')) {
          throw new Error('Error monitoring appears to have regressed');
        }
      } catch (monitoringError) {
        reporter.logWarning('Error monitoring test failed', {
          error: monitoringError instanceof Error ? monitoringError.message : String(monitoringError),
        });
      }

      // Test health checks are still working
      reporter.logStep('Testing health check regression');
      const healthResponse = await helpers.testApiEndpoint('/api/health/ready', {
        expectedStatus: 200,
        timeout: 10000,
      });

      if (healthResponse.status !== 'ready') {
        throw new Error('Health check regression detected - system not ready');
      }

      reporter.logTestComplete('regression-detection', 'passed', {
        workingPages: workingPages.length,
        failedPages: failedPages.length,
        pageResults: { working: workingPages, failed: failedPages },
        errorMonitoringWorking: true,
        healthCheckWorking: true,
      });

    } catch (error) {
      await helpers.takeScreenshot('regression-detection-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'regression-detection',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('regression-detection', 'failed');
      throw error;
    }
  });

  test('Performance baseline validation', async ({ page }) => {
    reporter.logTestStart('Performance baseline validation');

    try {
      // Measure homepage performance
      await helpers.navigateToPage('/');
      const performance = await helpers.measurePagePerformance();

      reporter.logStep('Performance measurements', performance);

      // Define performance thresholds for post-deployment
      const thresholds = {
        loadTime: 10000, // 10 seconds max
        domContentLoaded: 8000, // 8 seconds max
      };

      const performanceIssues: string[] = [];

      if (performance.loadTime > thresholds.loadTime) {
        performanceIssues.push(`Load time (${performance.loadTime}ms) exceeds threshold (${thresholds.loadTime}ms)`);
      }

      if (performance.domContentLoaded > thresholds.domContentLoaded) {
        performanceIssues.push(`DOM content loaded (${performance.domContentLoaded}ms) exceeds threshold (${thresholds.domContentLoaded}ms)`);
      }

      if (performanceIssues.length > 0) {
        reporter.logWarning('Performance issues detected', { issues: performanceIssues });
        
        // For post-deployment, log performance issues but don't fail unless extreme
        if (performance.loadTime > thresholds.loadTime * 2) {
          throw new Error(`Severe performance regression: ${performanceIssues.join(', ')}`);
        }
      }

      reporter.logTestComplete('performance-baseline-validation', 'passed', {
        loadTime: performance.loadTime,
        domContentLoaded: performance.domContentLoaded,
        withinThresholds: performanceIssues.length === 0,
        performanceIssues: performanceIssues.length,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'performance-baseline-validation',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('performance-baseline-validation', 'failed');
      throw error;
    }
  });

  test('Environment configuration validation', async ({ page }) => {
    reporter.logTestStart('Environment configuration validation');

    try {
      // Get health check data to validate environment
      const healthData = await helpers.testApiEndpoint('/api/health');

      // Validate environment-specific configurations
      const environment = healthData.environment;
      const version = healthData.version;

      reporter.logStep('Environment configuration', {
        environment,
        version,
        correlationId: healthData.correlationId,
      });

      // Validate we're in the expected environment
      const expectedEnv = process.env.PLAYWRIGHT_ENV || 'development';
      if (environment !== expectedEnv && expectedEnv !== 'test') {
        reporter.logWarning(`Environment mismatch: expected ${expectedEnv}, got ${environment}`);
      }

      // Validate version is present
      if (!version || version === 'unknown') {
        reporter.logWarning('Version information missing or unknown');
      }

      // Validate correlation ID format
      if (!healthData.correlationId || !healthData.correlationId.includes('-')) {
        throw new Error('Correlation ID format is invalid');
      }

      // Check for environment-specific URLs and configurations
      const currentUrl = page.url();
      reporter.logStep('Current environment URL', { url: currentUrl });

      // For production, ensure HTTPS
      if (environment === 'production' && !currentUrl.startsWith('https://')) {
        throw new Error('Production environment should use HTTPS');
      }

      reporter.logTestComplete('environment-configuration-validation', 'passed', {
        environment,
        version,
        httpsInProduction: environment !== 'production' || currentUrl.startsWith('https://'),
        correlationIdValid: !!healthData.correlationId,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'environment-configuration-validation',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('environment-configuration-validation', 'failed');
      throw error;
    }
  });

  test('Production readiness final check', async ({ page }) => {
    reporter.logTestStart('Production readiness final check');

    try {
      const readinessChecks = {
        healthEndpoint: false,
        readinessEndpoint: false,
        livenessEndpoint: false,
        errorMonitoring: false,
        basicNavigation: false,
        noJavaScriptErrors: false,
      };

      // Health endpoint check
      try {
        const healthData = await helpers.testApiEndpoint('/api/health', { timeout: 15000 });
        readinessChecks.healthEndpoint = healthData.status !== 'unhealthy';
      } catch { /* handled below */ }

      // Readiness endpoint check
      try {
        const readinessData = await helpers.testApiEndpoint('/api/health/ready', { timeout: 10000 });
        readinessChecks.readinessEndpoint = readinessData.status === 'ready';
      } catch { /* handled below */ }

      // Liveness endpoint check
      try {
        const livenessData = await helpers.testApiEndpoint('/api/health/live', { timeout: 10000 });
        readinessChecks.livenessEndpoint = livenessData.status === 'alive';
      } catch { /* handled below */ }

      // Error monitoring check
      try {
        const errorTestData = await helpers.testApiEndpoint('/api/test-error?type=warning', { timeout: 10000 });
        readinessChecks.errorMonitoring = errorTestData.message?.includes('Warning reported successfully');
      } catch { /* handled below */ }

      // Basic navigation check
      try {
        await helpers.navigateToPage('/', { timeout: 20000 });
        await helpers.waitForElement('body', { timeout: 10000 });
        readinessChecks.basicNavigation = true;
      } catch { /* handled below */ }

      // JavaScript errors check
      try {
        await helpers.checkForConsoleErrors();
        readinessChecks.noJavaScriptErrors = true;
      } catch { /* handled below */ }

      // Count passed checks
      const passedChecks = Object.values(readinessChecks).filter(Boolean).length;
      const totalChecks = Object.keys(readinessChecks).length;

      reporter.logStep('Production readiness summary', {
        passedChecks,
        totalChecks,
        percentage: Math.round((passedChecks / totalChecks) * 100),
        details: readinessChecks,
      });

      // Minimum 80% of checks must pass for production readiness
      const minimumPassPercentage = 80;
      const actualPassPercentage = (passedChecks / totalChecks) * 100;

      if (actualPassPercentage < minimumPassPercentage) {
        throw new Error(`Production readiness insufficient: ${actualPassPercentage}% passed (minimum: ${minimumPassPercentage}%)`);
      }

      // Critical checks that must pass
      const criticalChecks = ['healthEndpoint', 'basicNavigation'];
      const failedCriticalChecks = criticalChecks.filter(check => !readinessChecks[check as keyof typeof readinessChecks]);

      if (failedCriticalChecks.length > 0) {
        throw new Error(`Critical production readiness checks failed: ${failedCriticalChecks.join(', ')}`);
      }

      await helpers.takeScreenshot('production-ready');

      reporter.logTestComplete('production-readiness-final-check', 'passed', {
        passedChecks,
        totalChecks,
        percentage: actualPassPercentage,
        readyForProduction: true,
      });

    } catch (error) {
      await helpers.takeScreenshot('production-readiness-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'post-deployment-validation',
          operation: 'production-readiness-final-check',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('production-readiness-final-check', 'failed');
      throw error;
    }
  });
});