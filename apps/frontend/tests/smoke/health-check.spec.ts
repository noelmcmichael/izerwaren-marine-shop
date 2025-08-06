import { test, expect } from '@playwright/test';
import { TestReporter } from '../utils/test-reporter';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Health Check Smoke Tests
 * 
 * These tests validate that all health check endpoints are working correctly
 * and that the system is in a healthy state after deployment.
 */

test.describe('Health Check Endpoints', () => {
  let reporter: TestReporter;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    reporter = new TestReporter('health-check-smoke');
    helpers = new TestHelpers(page, reporter);
    reporter.logTestStart('Health check endpoint validation');
  });

  test('Basic health check endpoint responds correctly', async ({ page }) => {
    reporter.logStep('Testing basic health check endpoint');

    try {
      const healthData = await helpers.testApiEndpoint('/api/health', {
        expectedStatus: 200,
        timeout: 15000,
      });

      // Validate response structure
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('correlationId');
      expect(healthData).toHaveProperty('services');
      expect(healthData).toHaveProperty('metrics');

      // Validate status values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.status);

      // Validate services
      expect(healthData.services).toBeInstanceOf(Object);
      expect(Object.keys(healthData.services).length).toBeGreaterThan(0);

      // Validate metrics
      expect(healthData.metrics).toHaveProperty('responseTime');
      expect(healthData.metrics).toHaveProperty('memoryUsage');
      expect(healthData.metrics).toHaveProperty('uptime');

      // Log service statuses
      for (const [serviceName, service] of Object.entries(healthData.services as Record<string, any>)) {
        reporter.logStep(`Service ${serviceName}: ${service.status}`, {
          status: service.status,
          error: service.error,
          responseTime: service.responseTime,
        });
      }

      // System should not be unhealthy for deployment to succeed
      if (healthData.status === 'unhealthy') {
        const unhealthyServices = Object.entries(healthData.services as Record<string, any>)
          .filter(([_, service]) => service.status === 'unhealthy')
          .map(([name, service]) => `${name}: ${service.error}`);

        throw new Error(`System is unhealthy. Failed services: ${unhealthyServices.join(', ')}`);
      }

      reporter.logTestComplete('health-check-basic', 'passed', {
        systemStatus: healthData.status,
        responseTime: healthData.metrics.responseTime,
        serviceCount: Object.keys(healthData.services).length,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'basic-health-check',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('health-check-basic', 'failed');
      throw error;
    }
  });

  test('Readiness check endpoint responds correctly', async ({ page }) => {
    reporter.logStep('Testing readiness check endpoint');

    try {
      const readinessData = await helpers.testApiEndpoint('/api/health/ready', {
        expectedStatus: 200,
        timeout: 10000,
      });

      // Validate response structure
      expect(readinessData).toHaveProperty('status');
      expect(readinessData).toHaveProperty('timestamp');
      expect(readinessData).toHaveProperty('checks');

      // Validate readiness status
      expect(['ready', 'not-ready']).toContain(readinessData.status);

      // System should be ready for deployment to succeed
      if (readinessData.status !== 'ready') {
        throw new Error(`System is not ready: ${JSON.stringify(readinessData.checks)}`);
      }

      reporter.logTestComplete('readiness-check', 'passed', {
        status: readinessData.status,
        checks: readinessData.checks,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'readiness-check',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('readiness-check', 'failed');
      throw error;
    }
  });

  test('Liveness check endpoint responds correctly', async ({ page }) => {
    reporter.logStep('Testing liveness check endpoint');

    try {
      const livenessData = await helpers.testApiEndpoint('/api/health/live', {
        expectedStatus: 200,
        timeout: 10000,
      });

      // Validate response structure
      expect(livenessData).toHaveProperty('status');
      expect(livenessData).toHaveProperty('timestamp');

      // Validate liveness status
      expect(livenessData.status).toBe('alive');

      reporter.logTestComplete('liveness-check', 'passed', {
        status: livenessData.status,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'liveness-check',
          severity: 'critical',
        }
      );
      reporter.logTestComplete('liveness-check', 'failed');
      throw error;
    }
  });

  test('Deep health check provides detailed diagnostics', async ({ page }) => {
    reporter.logStep('Testing deep health check endpoint');

    try {
      const deepHealthData = await helpers.testApiEndpoint('/api/health/deep', {
        expectedStatus: 200,
        timeout: 20000, // Longer timeout for deep checks
      });

      // Validate response structure
      expect(deepHealthData).toHaveProperty('status');
      expect(deepHealthData).toHaveProperty('timestamp');
      expect(deepHealthData).toHaveProperty('correlationId');
      expect(deepHealthData).toHaveProperty('services');
      expect(deepHealthData).toHaveProperty('metrics');
      expect(deepHealthData).toHaveProperty('diagnostics');

      // Validate diagnostics
      expect(deepHealthData.diagnostics).toBeInstanceOf(Object);

      // Log detailed diagnostics
      reporter.logStep('Deep health diagnostics', {
        status: deepHealthData.status,
        serviceCount: Object.keys(deepHealthData.services).length,
        diagnostics: deepHealthData.diagnostics,
      });

      reporter.logTestComplete('deep-health-check', 'passed', {
        systemStatus: deepHealthData.status,
        responseTime: deepHealthData.metrics.responseTime,
        diagnosticsAvailable: Object.keys(deepHealthData.diagnostics).length > 0,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'deep-health-check',
          severity: 'medium', // Deep check failure is less critical
        }
      );
      reporter.logTestComplete('deep-health-check', 'failed');
      throw error;
    }
  });

  test('Health check response time is acceptable', async ({ page }) => {
    reporter.logStep('Testing health check response time');

    try {
      const startTime = Date.now();
      
      await helpers.testApiEndpoint('/api/health', {
        expectedStatus: 200,
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      const maxAcceptableTime = 3000; // 3 seconds

      reporter.logStep(`Health check response time: ${responseTime}ms`);

      if (responseTime > maxAcceptableTime) {
        reporter.logWarning(`Health check response time (${responseTime}ms) exceeds threshold (${maxAcceptableTime}ms)`);
        
        // Log warning but don't fail the test unless it's extremely slow
        if (responseTime > maxAcceptableTime * 2) {
          throw new Error(`Health check too slow: ${responseTime}ms (max: ${maxAcceptableTime}ms)`);
        }
      }

      reporter.logTestComplete('health-check-performance', 'passed', {
        responseTime,
        threshold: maxAcceptableTime,
        performance: responseTime <= maxAcceptableTime ? 'good' : 'degraded',
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'health-check-performance',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('health-check-performance', 'failed');
      throw error;
    }
  });

  test('Health check includes correlation ID for traceability', async ({ page }) => {
    reporter.logStep('Validating correlation ID in health check');

    try {
      const response = await page.request.get('/api/health', {
        headers: {
          'X-Correlation-ID': reporter.getCorrelationId(),
        },
      });

      expect(response.ok()).toBeTruthy();

      const healthData = await response.json();
      expect(healthData).toHaveProperty('correlationId');
      expect(typeof healthData.correlationId).toBe('string');
      expect(healthData.correlationId.length).toBeGreaterThan(0);

      // Check response headers for correlation ID
      const responseCorrelationId = response.headers()['x-correlation-id'];
      if (responseCorrelationId) {
        expect(responseCorrelationId).toBe(healthData.correlationId);
      }

      reporter.logTestComplete('correlation-id-validation', 'passed', {
        correlationId: healthData.correlationId,
        hasResponseHeader: !!responseCorrelationId,
      });

    } catch (error) {
      await reporter.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'health-check-smoke',
          operation: 'correlation-id-validation',
          severity: 'medium',
        }
      );
      reporter.logTestComplete('correlation-id-validation', 'failed');
      throw error;
    }
  });
});