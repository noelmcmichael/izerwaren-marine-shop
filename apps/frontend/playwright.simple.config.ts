import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright Configuration for Testing Framework
 */

export default defineConfig({
  testDir: './tests',
  testMatch: '**/smoke/basic-connectivity.spec.ts',
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 0,
  workers: 1,
  
  reporter: [['list'], ['html', { outputFolder: 'test-results/html-report' }]],
  outputDir: 'test-results/artifacts',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'basic-test',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export {};