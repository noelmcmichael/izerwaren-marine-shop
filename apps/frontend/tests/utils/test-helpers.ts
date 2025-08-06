import { Page, expect, Locator } from '@playwright/test';
import { TestReporter } from './test-reporter';

/**
 * Test Helper Utilities
 * 
 * Common utilities for deployment validation tests:
 * - Page interaction helpers
 * - Wait strategies
 * - Data validation
 * - Performance measurement
 */

export class TestHelpers {
  private page: Page;
  private reporter: TestReporter;

  constructor(page: Page, reporter: TestReporter) {
    this.page = page;
    this.reporter = reporter;
  }

  /**
   * Navigate to a page with comprehensive error handling
   */
  async navigateToPage(url: string, options?: { 
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
    expectedTitle?: string;
  }): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('navigate');
    stepReporter.logStep(`Navigating to: ${url}`);

    try {
      const response = await this.page.goto(url, {
        waitUntil: options?.waitUntil || 'domcontentloaded',
        timeout: options?.timeout || 30000,
      });

      if (!response) {
        throw new Error('Navigation failed - no response received');
      }

      if (!response.ok()) {
        throw new Error(`Navigation failed with status: ${response.status()}`);
      }

      // Check expected title if provided
      if (options?.expectedTitle) {
        await expect(this.page).toHaveTitle(new RegExp(options.expectedTitle, 'i'));
      }

      stepReporter.logStep(`Navigation successful`);
      
    } catch (error) {
      await stepReporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'test-helpers',
          operation: 'navigate-to-page',
          metadata: { url, options },
          severity: 'high',
        }
      );
      throw error;
    }
  }

  /**
   * Wait for element with retry logic
   */
  async waitForElement(
    selector: string, 
    options?: { 
      timeout?: number; 
      state?: 'visible' | 'hidden' | 'attached' | 'detached';
    }
  ): Promise<Locator> {
    const stepReporter = this.reporter.createStepReporter('wait-element');
    stepReporter.logStep(`Waiting for element: ${selector}`);

    try {
      const element = this.page.locator(selector);
      await element.waitFor({
        state: options?.state || 'visible',
        timeout: options?.timeout || 10000,
      });

      stepReporter.logStep(`Element found: ${selector}`);
      return element;
      
    } catch (error) {
      await stepReporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'test-helpers',
          operation: 'wait-for-element',
          metadata: { selector, options },
          severity: 'medium',
        }
      );
      throw error;
    }
  }

  /**
   * Check if page has no console errors
   */
  async checkForConsoleErrors(): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('console-check');
    
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      
      const timeout = setTimeout(() => {
        if (errors.length > 0) {
          stepReporter.logWarning(`Console errors detected`, { errors });
          reject(new Error(`Console errors detected: ${errors.join(', ')}`));
        } else {
          stepReporter.logStep('No console errors detected');
          resolve();
        }
      }, 1000);

      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      this.page.on('pageerror', (error) => {
        errors.push(error.message);
      });
    });
  }

  /**
   * Measure page performance
   */
  async measurePagePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  }> {
    const stepReporter = this.reporter.createStepReporter('performance');
    stepReporter.logStep('Measuring page performance');

    try {
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstContentfulPaint: navigation.loadEventEnd - navigation.fetchStart,
          largestContentfulPaint: navigation.loadEventEnd - navigation.fetchStart,
        };
      });

      stepReporter.logStep('Performance measurement completed', performanceMetrics);
      return performanceMetrics;
      
    } catch (error) {
      await stepReporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'test-helpers',
          operation: 'measure-performance',
          severity: 'low',
        }
      );
      throw error;
    }
  }

  /**
   * Test API endpoint with retry logic
   */
  async testApiEndpoint(
    endpoint: string, 
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      expectedStatus?: number;
      timeout?: number;
      retries?: number;
    }
  ): Promise<any> {
    const stepReporter = this.reporter.createStepReporter('api-test');
    const method = options?.method || 'GET';
    const expectedStatus = options?.expectedStatus || 200;
    const timeout = options?.timeout || 10000;
    const retries = options?.retries || 2;

    stepReporter.logStep(`Testing API endpoint: ${method} ${endpoint}`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          stepReporter.logStep(`Retry attempt ${attempt}/${retries}`);
          await this.page.waitForTimeout(1000 * attempt); // Exponential backoff
        }

        const response = await this.page.request.request({
          url: endpoint,
          method,
          data: options?.data,
          timeout,
          headers: {
            'X-Test-Source': 'playwright-api-test',
            'X-Correlation-ID': this.reporter.getCorrelationId(),
          },
        });

        if (response.status() !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status()}`);
        }

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }

        stepReporter.logStep(`API test successful`, { 
          status: response.status(),
          endpoint,
          method,
        });

        return responseData;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retries) {
          await stepReporter.reportError(lastError, {
            component: 'test-helpers',
            operation: 'test-api-endpoint',
            metadata: { 
              endpoint, 
              method, 
              expectedStatus, 
              attempt: attempt + 1,
              totalRetries: retries + 1,
            },
            severity: 'medium',
          });
          throw lastError;
        }
      }
    }

    throw lastError || new Error('API test failed after all retries');
  }

  /**
   * Take screenshot with timestamp and correlation ID
   */
  async takeScreenshot(name: string): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('screenshot');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const correlationId = this.reporter.getCorrelationId();
      const filename = `${name}-${timestamp}-${correlationId}.png`;
      
      await this.page.screenshot({ 
        path: `./test-results/screenshots/${filename}`,
        fullPage: true,
      });
      
      stepReporter.logStep(`Screenshot saved: ${filename}`);
      
    } catch (error) {
      stepReporter.logWarning('Failed to take screenshot', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Validate page accessibility
   */
  async validatePageAccessibility(): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('accessibility');
    stepReporter.logStep('Validating page accessibility');

    try {
      // Basic accessibility checks
      await expect(this.page.locator('[role="main"], main')).toBeVisible();
      
      // Check for alt text on images
      const images = await this.page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src');
        
        if (!alt && src && !src.includes('decorative')) {
          stepReporter.logWarning('Image missing alt text', { src });
        }
      }

      stepReporter.logStep('Accessibility validation completed');
      
    } catch (error) {
      await stepReporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'test-helpers',
          operation: 'validate-accessibility',
          severity: 'low',
        }
      );
      throw error;
    }
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout: number = 30000): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('network-idle');
    stepReporter.logStep('Waiting for network idle');

    try {
      await this.page.waitForLoadState('networkidle', { timeout });
      stepReporter.logStep('Network is idle');
      
    } catch (error) {
      stepReporter.logWarning('Network idle timeout', { timeout });
      // Don't throw - this might be expected in some cases
    }
  }

  /**
   * Assert element text content
   */
  async assertElementText(selector: string, expectedText: string | RegExp): Promise<void> {
    const stepReporter = this.reporter.createStepReporter('assert-text');
    stepReporter.logStep(`Asserting element text: ${selector}`);

    try {
      const element = await this.waitForElement(selector);
      await expect(element).toHaveText(expectedText);
      stepReporter.logStep('Text assertion passed');
      
    } catch (error) {
      await stepReporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'test-helpers',
          operation: 'assert-element-text',
          metadata: { selector, expectedText },
          severity: 'medium',
        }
      );
      throw error;
    }
  }
}