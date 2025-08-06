import { chromium, FullConfig } from '@playwright/test';
import { TestReporter } from './utils/test-reporter';

/**
 * Global setup for Playwright tests
 * 
 * This runs once before all tests and handles:
 * - Environment validation
 * - Service health checks
 * - Test data preparation
 * - Correlation ID setup for test traceability
 */

async function globalSetup(config: FullConfig) {
  const reporter = new TestReporter('global-setup');
  const correlationId = reporter.generateCorrelationId();
  
  console.log(`\n🚀 Starting deployment validation tests`);
  console.log(`📋 Test run correlation ID: ${correlationId}`);
  console.log(`🌐 Base URL: ${config.use?.baseURL}`);
  console.log(`📊 Test environment: ${process.env.PLAYWRIGHT_ENV || 'local'}`);

  try {
    // Validate environment configuration
    await validateEnvironmentConfig(config, reporter);
    
    // Perform health checks
    await performHealthChecks(config, reporter);
    
    // Prepare test data if needed
    await prepareTestData(config, reporter);
    
    console.log(`✅ Global setup completed successfully\n`);
    
    // Store correlation ID for use in tests
    process.env.TEST_CORRELATION_ID = correlationId;
    
  } catch (error) {
    console.error(`❌ Global setup failed:`, error);
    
    await reporter.reportError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'global-setup',
        operation: 'test-initialization',
        metadata: {
          baseURL: config.use?.baseURL,
          environment: process.env.PLAYWRIGHT_ENV,
          correlationId,
        },
        severity: 'critical',
      }
    );
    
    throw error;
  }
}

async function validateEnvironmentConfig(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Validating environment configuration');
  
  const baseURL = config.use?.baseURL;
  if (!baseURL) {
    throw new Error('Base URL not configured for tests');
  }
  
  // Validate required environment variables
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  reporter.logInfo('Environment configuration validated');
}

async function performHealthChecks(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Performing pre-test health checks');
  
  const baseURL = config.use?.baseURL;
  if (!baseURL) {
    throw new Error('Base URL not configured');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright-health-check',
      'X-Correlation-ID': process.env.TEST_CORRELATION_ID || 'test-setup',
    },
  });
  
  try {
    const page = await context.newPage();
    
    // Test basic connectivity
    reporter.logInfo('Testing basic application connectivity');
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    if (!response || !response.ok()) {
      throw new Error(`Application not responding: ${response?.status()}`);
    }
    
    // Test health check endpoint
    reporter.logInfo('Testing health check endpoint');
    const healthResponse = await page.request.get(`${baseURL}/api/health`);
    
    if (!healthResponse.ok()) {
      throw new Error(`Health check failed: ${healthResponse.status()}`);
    }
    
    const healthData = await healthResponse.json();
    
    // Log health status
    reporter.logInfo('Health check results:', {
      status: healthData.status,
      services: Object.keys(healthData.services || {}),
      responseTime: healthData.metrics?.responseTime,
    });
    
    // Fail if system is unhealthy
    if (healthData.status === 'unhealthy') {
      const unhealthyServices = Object.entries(healthData.services || {})
        .filter(([_, service]: [string, any]) => service.status === 'unhealthy')
        .map(([name, service]: [string, any]) => `${name}: ${service.error}`);
      
      throw new Error(`System unhealthy. Failed services: ${unhealthyServices.join(', ')}`);
    }
    
    // Warn if degraded
    if (healthData.status === 'degraded') {
      reporter.logWarning('System is in degraded state, tests may be affected');
    }
    
    reporter.logInfo('Health checks passed');
    
  } finally {
    await context.close();
    await browser.close();
  }
}

async function prepareTestData(config: FullConfig, reporter: TestReporter): Promise<void> {
  reporter.logInfo('Preparing test data');
  
  // Store test configuration for use in tests
  const testConfig = {
    baseURL: config.use?.baseURL,
    environment: process.env.PLAYWRIGHT_ENV || 'local',
    timestamp: new Date().toISOString(),
    correlationId: process.env.TEST_CORRELATION_ID,
  };
  
  // You could add test data setup here if needed
  // For example: creating test users, seeding test products, etc.
  
  process.env.TEST_CONFIG = JSON.stringify(testConfig);
  
  reporter.logInfo('Test data preparation completed');
}

export default globalSetup;