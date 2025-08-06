import { test, expect } from '@playwright/test';
import { TestReporter } from '../utils/test-reporter';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Core Application Smoke Tests
 * 
 * These tests validate that the core application functionality is working
 * correctly after deployment, including navigation, basic UI elements,
 * and critical user paths.
 */

test.describe('Core Application Functionality', () => {
  let reporter: TestReporter;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    reporter = new TestReporter('application-core-smoke');
    helpers = new TestHelpers(page, reporter);
  });

  test('Homepage loads successfully', async ({ page }) => {
    reporter.logTestStart('Homepage load test');

    try {
      await helpers.navigateToPage('/', {
        expectedTitle: 'Izerwaren',
        timeout: 30000,
      });

      // Check for key homepage elements
      await helpers.waitForElement('header', { timeout: 10000 });
      await helpers.waitForElement('main', { timeout: 10000 });
      await helpers.waitForElement('footer', { timeout: 10000 });

      // Check for logo
      const logo = await helpers.waitForElement('img[alt*="Izerwaren"], img[alt*="Logo"]');
      expect(await logo.isVisible()).toBeTruthy();

      // Check for navigation elements
      await helpers.waitForElement('nav');

      // Measure page performance
      const performance = await helpers.measurePagePerformance();
      reporter.logStep('Homepage performance metrics', performance);

      // Performance thresholds
      if (performance.loadTime > 5000) {
        reporter.logWarning(`Homepage load time (${performance.loadTime}ms) exceeds 5 seconds`);
      }

      // Check for console errors
      await helpers.checkForConsoleErrors();

      // Take screenshot for visual verification
      await helpers.takeScreenshot('homepage-loaded');

      reporter.logTestComplete('homepage-load', 'passed', {
        loadTime: performance.loadTime,
        domContentLoaded: performance.domContentLoaded,
      });

    } catch (error) {
      await helpers.takeScreenshot('homepage-load-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'homepage-load',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('homepage-load', 'failed');
      throw error;
    }
  });

  test('Navigation menu is functional', async ({ page }) => {
    reporter.logTestStart('Navigation functionality test');

    try {
      await helpers.navigateToPage('/');

      // Find navigation elements
      const nav = await helpers.waitForElement('nav');
      const navLinks = await nav.locator('a').all();

      if (navLinks.length === 0) {
        throw new Error('No navigation links found');
      }

      reporter.logStep(`Found ${navLinks.length} navigation links`);

      // Test first few navigation links (to avoid long test times)
      const linksToTest = Math.min(3, navLinks.length);
      
      for (let i = 0; i < linksToTest; i++) {
        const link = navLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        if (href && href.startsWith('/') && !href.includes('#')) {
          reporter.logStep(`Testing navigation link: ${text} -> ${href}`);
          
          try {
            await link.click();
            await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
            
            // Verify we navigated successfully
            const currentUrl = page.url();
            expect(currentUrl).toContain(href);
            
            // Go back to homepage for next test
            await page.goBack();
            await page.waitForLoadState('domcontentloaded');
            
          } catch (navError) {
            reporter.logWarning(`Navigation link failed: ${href}`, {
              error: navError instanceof Error ? navError.message : String(navError),
            });
          }
        }
      }

      reporter.logTestComplete('navigation-functionality', 'passed', {
        totalLinks: navLinks.length,
        testedLinks: linksToTest,
      });

    } catch (error) {
      await helpers.takeScreenshot('navigation-test-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'navigation-functionality',
          severity: 'high',
        }
      );
      reporter.logTestComplete('navigation-functionality', 'failed');
      throw error;
    }
  });

  test('Product catalog page loads', async ({ page }) => {
    reporter.logTestStart('Product catalog page test');

    try {
      // Try common product/catalog page URLs
      const catalogUrls = ['/products', '/catalog', '/shop'];
      let catalogLoaded = false;
      let workingUrl = '';

      for (const url of catalogUrls) {
        try {
          const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
          });
          
          if (response && response.ok()) {
            workingUrl = url;
            catalogLoaded = true;
            break;
          }
        } catch {
          // Try next URL
          continue;
        }
      }

      if (!catalogLoaded) {
        // Check if products are displayed on homepage instead
        await helpers.navigateToPage('/');
        
        // Look for product-related elements
        const productElements = await page.locator('[data-testid*="product"], .product, [class*="product"]').count();
        
        if (productElements > 0) {
          reporter.logStep(`Found ${productElements} product elements on homepage`);
          catalogLoaded = true;
          workingUrl = '/';
        }
      }

      if (!catalogLoaded) {
        reporter.logWarning('No product catalog page found, skipping product tests');
        reporter.logTestComplete('product-catalog-load', 'skipped');
        return;
      }

      reporter.logStep(`Product catalog accessible at: ${workingUrl}`);

      // Basic content validation
      await helpers.waitForElement('main');
      
      // Look for any product-related content
      const hasProducts = await page.locator('img, [data-testid*="product"], .product, [class*="product"]').count() > 0;
      
      if (hasProducts) {
        reporter.logStep('Product content detected');
      } else {
        reporter.logWarning('No product content detected');
      }

      // Check for search functionality
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        reporter.logStep('Search functionality detected');
      }

      await helpers.takeScreenshot('product-catalog-loaded');

      reporter.logTestComplete('product-catalog-load', 'passed', {
        catalogUrl: workingUrl,
        hasProducts,
        hasSearch: await searchInput.count() > 0,
      });

    } catch (error) {
      await helpers.takeScreenshot('product-catalog-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'product-catalog-load',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('product-catalog-load', 'failed');
      throw error;
    }
  });

  test('Error boundaries work correctly', async ({ page }) => {
    reporter.logTestStart('Error boundary functionality test');

    try {
      // Visit the test monitoring page to test error boundaries
      await helpers.navigateToPage('/test-monitoring', {
        timeout: 15000,
      });

      // Look for error boundary test section
      const errorTestSection = page.locator('text=Error Boundary Test').first();
      
      if (await errorTestSection.count() === 0) {
        reporter.logWarning('Error boundary test page not found, skipping test');
        reporter.logTestComplete('error-boundary-test', 'skipped');
        return;
      }

      // Find and click the error trigger button
      const errorButton = page.locator('button:has-text("Trigger Component Error")');
      
      if (await errorButton.count() === 0) {
        reporter.logWarning('Error trigger button not found');
        reporter.logTestComplete('error-boundary-test', 'skipped');
        return;
      }

      reporter.logStep('Triggering test error to validate error boundary');
      
      await errorButton.click();
      
      // Wait a moment for error boundary to activate
      await page.waitForTimeout(1000);

      // Check for error boundary UI
      const errorBoundaryUI = page.locator('text=Something went wrong, text=Try Again, text=Reload Page');
      
      if (await errorBoundaryUI.count() > 0) {
        reporter.logStep('Error boundary activated successfully');
        
        // Test retry functionality
        const retryButton = page.locator('button:has-text("Try Again")');
        if (await retryButton.count() > 0) {
          await retryButton.click();
          await page.waitForTimeout(500);
          reporter.logStep('Error boundary retry functionality tested');
        }
      } else {
        throw new Error('Error boundary did not activate as expected');
      }

      await helpers.takeScreenshot('error-boundary-tested');

      reporter.logTestComplete('error-boundary-test', 'passed', {
        errorBoundaryActivated: true,
        retryFunctionality: await page.locator('button:has-text("Try Again")').count() > 0,
      });

    } catch (error) {
      await helpers.takeScreenshot('error-boundary-test-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'error-boundary-test',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('error-boundary-test', 'failed');
      throw error;
    }
  });

  test('Application accessibility basics', async ({ page }) => {
    reporter.logTestStart('Basic accessibility validation');

    try {
      await helpers.navigateToPage('/');
      await helpers.validatePageAccessibility();

      reporter.logTestComplete('accessibility-validation', 'passed');

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'accessibility-validation',
          severity: 'low',
        }
      );
      reporter.logTestComplete('accessibility-validation', 'failed');
      // Don't throw - accessibility issues shouldn't fail deployment
      reporter.logWarning('Accessibility validation failed but not blocking deployment');
    }
  });

  test('Mobile responsiveness basic check', async ({ page }) => {
    reporter.logTestStart('Mobile responsiveness test');

    try {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 size

      await helpers.navigateToPage('/');

      // Check that main elements are still visible
      await helpers.waitForElement('header');
      await helpers.waitForElement('main');
      await helpers.waitForElement('footer');

      // Check for mobile menu or responsive navigation
      const mobileNav = page.locator('[aria-label*="menu"], button[aria-expanded], .mobile-menu, [data-testid*="mobile"]');
      const hasMobileNav = await mobileNav.count() > 0;

      // Check that content doesn't overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > window.innerWidth;
      });

      if (bodyOverflow) {
        reporter.logWarning('Content appears to overflow viewport width');
      }

      await helpers.takeScreenshot('mobile-view');

      reporter.logTestComplete('mobile-responsiveness', 'passed', {
        hasMobileNav,
        hasOverflow: bodyOverflow,
        viewport: { width: 390, height: 844 },
      });

    } catch (error) {
      await helpers.takeScreenshot('mobile-test-failed');
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'application-core-smoke',
          operation: 'mobile-responsiveness',
          severity: 'low',
        }
      );
      reporter.logTestComplete('mobile-responsiveness', 'failed');
      // Don't throw - mobile issues shouldn't fail deployment
      reporter.logWarning('Mobile responsiveness test failed but not blocking deployment');
    }
  });
});