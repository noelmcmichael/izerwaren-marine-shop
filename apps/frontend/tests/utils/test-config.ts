/**
 * Test Configuration
 * 
 * Centralized configuration for tests to handle environment-specific settings
 */

export const testConfig = {
  // Base URL for tests
  baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
  
  // Environment
  environment: process.env.PLAYWRIGHT_ENV || process.env.NODE_ENV || 'local',
  
  // Test timeouts
  timeouts: {
    navigation: 30000,
    health_check: 15000,
    api_request: 10000,
    element_wait: 10000,
    test_timeout: 60000,
  },
  
  // Performance thresholds
  performance: {
    page_load_max: 10000,
    dom_content_loaded_max: 8000,
    health_check_max: 5000,
  },
  
  // Test data
  testData: {
    searchTerms: ['test', 'marine', 'hardware'],
    expectedElements: {
      header: 'header',
      main: 'main',
      footer: 'footer',
      navigation: 'nav',
    },
  },
  
  // Feature flags for tests
  features: {
    skipMobileTests: process.env.SKIP_MOBILE_TESTS === 'true',
    skipAccessibilityTests: process.env.SKIP_ACCESSIBILITY_TESTS === 'true',
    skipPerformanceTests: process.env.SKIP_PERFORMANCE_TESTS === 'true',
  },
  
  // Correlation ID
  correlationId: process.env.TEST_CORRELATION_ID || `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
};

export default testConfig;