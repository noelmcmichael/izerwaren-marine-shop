import { FullConfig } from '@playwright/test';
import { TestReporter } from './utils/test-reporter';

/**
 * Global teardown for Playwright tests
 * 
 * This runs once after all tests and handles:
 * - Test result summary
 * - Cleanup operations
 * - Final health check
 * - Test report generation
 */

async function globalTeardown(config: FullConfig) {
  const reporter = new TestReporter('global-teardown');
  const correlationId = process.env.TEST_CORRELATION_ID || 'teardown';
  
  console.log(`\n🏁 Completing deployment validation tests`);
  console.log(`📋 Test run correlation ID: ${correlationId}`);

  try {
    // Perform cleanup operations
    await performCleanup(config, reporter);
    
    // Generate test summary
    await generateTestSummary(config, reporter);
    
    // Final health check (optional)
    if (process.env.PLAYWRIGHT_FINAL_HEALTH_CHECK === 'true') {
      await performFinalHealthCheck(config, reporter);
    }
    
    console.log(`✅ Global teardown completed successfully\n`);
    
  } catch (error) {
    console.error(`❌ Global teardown failed:`, error);
    
    await reporter.reportError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'global-teardown',
        operation: 'test-cleanup',
        metadata: {
          correlationId,
          environment: process.env.PLAYWRIGHT_ENV,
        },
        severity: 'medium',
      }
    );
    
    // Don't throw in teardown as it might mask test failures
    console.log(`⚠️ Continuing despite teardown errors`);
  }
}

async function performCleanup(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Performing test cleanup');
  
  // Clean up any test data that was created
  // For example: removing test users, cleaning up test orders, etc.
  
  // Clear test environment variables
  delete process.env.TEST_CORRELATION_ID;
  delete process.env.TEST_CONFIG;
  
  reporter.logInfo('Test cleanup completed');
}

async function generateTestSummary(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Generating test summary');
  
  const testConfig = process.env.TEST_CONFIG ? JSON.parse(process.env.TEST_CONFIG) : {};
  const endTime = new Date().toISOString();
  const startTime = testConfig.timestamp;
  
  const summary = {
    correlationId: process.env.TEST_CORRELATION_ID,
    environment: process.env.PLAYWRIGHT_ENV || 'local',
    baseURL: config.use?.baseURL,
    startTime,
    endTime,
    duration: startTime ? 
      Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 
      'unknown',
    testResultsPath: './test-results',
  };
  
  console.log(`\n📊 Test Run Summary:`);
  console.log(`   Environment: ${summary.environment}`);
  console.log(`   Base URL: ${summary.baseURL}`);
  console.log(`   Duration: ${summary.duration} seconds`);
  console.log(`   Results: ${summary.testResultsPath}`);
  console.log(`   Correlation ID: ${summary.correlationId}\n`);
  
  // Save summary to file for CI/CD pipeline consumption
  const fs = await import('fs');
  await fs.promises.writeFile(
    './test-results/test-summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  reporter.logInfo('Test summary generated');
}

async function performFinalHealthCheck(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Performing final health check');
  
  const baseURL = config.use?.baseURL;
  if (!baseURL) {
    reporter.logWarning('Base URL not configured, skipping final health check');
    return;
  }

  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      extraHTTPHeaders: {
        'X-Test-Source': 'playwright-final-health-check',
        'X-Correlation-ID': process.env.TEST_CORRELATION_ID || 'final-check',
      },
    });
    
    const page = await context.newPage();
    
    // Quick health check
    const healthResponse = await page.request.get(`${baseURL}/api/health`);
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      reporter.logInfo('Final health check passed', { status: healthData.status });
    } else {
      reporter.logWarning(`Final health check returned ${healthResponse.status()}`);
    }
    
    await context.close();
    await browser.close();
    
  } catch (error) {
    reporter.logWarning('Final health check failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

export default globalTeardown;