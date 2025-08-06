import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Deployment Validation and Smoke Tests
 * 
 * This configuration supports:
 * - Local development testing
 * - CI/CD pipeline integration
 * - Production deployment validation
 */

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Test file patterns
  testMatch: [
    '**/smoke/**/*.spec.ts',
    '**/integration/**/*.spec.ts',
    '**/deployment/**/*.spec.ts',
  ],

  // Global test timeout
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests when running locally for debugging
  workers: process.env.CI ? 4 : 1,

  // Test result reporters
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',

  // Global test setup
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // Test configuration
  use: {
    // Base URL for tests (can be overridden by environment variable)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Request timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Custom headers for test identification
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright-deployment-validation',
      'X-Test-Environment': process.env.NODE_ENV || 'test',
    },
  },

  // Project configurations for different browsers and scenarios
  projects: [
    {
      name: 'smoke-tests-chromium',
      testMatch: '**/smoke/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      timeout: 60000,
    },
    {
      name: 'smoke-tests-firefox',
      testMatch: '**/smoke/**/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
      timeout: 60000,
    },
    {
      name: 'integration-tests',
      testMatch: '**/integration/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['smoke-tests-chromium'],
    },
    {
      name: 'deployment-validation',
      testMatch: '**/deployment/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      timeout: 120000, // Longer timeout for deployment tests
    },
    {
      name: 'mobile-smoke',
      testMatch: '**/smoke/**/*.spec.ts',
      use: { ...devices['iPhone 13'] },
      timeout: 90000,
    },
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },
});

// Environment-specific configurations
if (process.env.PLAYWRIGHT_ENV === 'staging') {
  module.exports.use.baseURL = process.env.STAGING_URL || 'https://staging.izerwaren.com';
}

if (process.env.PLAYWRIGHT_ENV === 'production') {
  module.exports.use.baseURL = process.env.PRODUCTION_URL || 'https://izerwaren.com';
  module.exports.retries = 3; // More retries for production validation
  module.exports.workers = 2; // Fewer workers to reduce load
}

export {};