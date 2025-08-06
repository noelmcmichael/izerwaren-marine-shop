import { NextResponse } from 'next/server';
import ShopifyBuy from 'shopify-buy';
import { config } from '@/lib/config';
import { withRequestLogging } from '@/middleware/logging';
import { createLogger, createTimer } from '@/lib/logger';
import { ErrorMonitoring } from '@/lib/error-monitoring';

// Types for health check responses
interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
  lastCheck: string;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  correlationId: string;
  services: Record<string, ServiceHealth>;
  metrics: {
    responseTime: number;
    memoryUsage: number;
    uptime: number;
    loadAverage?: number[];
  };
}

// Generate correlation ID for tracing
function generateCorrelationId(): string {
  return `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Test backend API connectivity (where database access happens)
async function checkBackendAPI(logger: ReturnType<typeof createLogger>): Promise<ServiceHealth> {
  const timer = createTimer('backend-api-check', { component: 'health-check' });
  try {
    logger.debug('Starting backend API health check');
    // Check if backend API is configured and reachable
    const backendUrl = config.api.revivalBaseUrl;
    
    if (!backendUrl || backendUrl === '') {
      logger.debug('Backend API not configured - operating in standalone mode');
      timer.end(true);
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        details: {
          configured: false,
          message: 'Backend API not configured - frontend operates in standalone mode',
        },
      };
    }

    // Test backend health endpoint
    logger.debug('Testing backend API connectivity', { backendUrl });
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Izerwaren-Frontend-HealthCheck/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = timer.end(true);

    if (!response.ok) {
      logger.warn('Backend API health check returned non-OK status', {
        status: response.status,
        statusText: response.statusText,
        responseTime,
      });
      
      return {
        status: 'degraded',
        responseTime,
        error: `Backend API returned HTTP ${response.status}: ${response.statusText}`,
        lastCheck: new Date().toISOString(),
        details: {
          configured: true,
          baseUrl: backendUrl,
          httpStatus: response.status,
        },
      };
    }

    logger.debug('Backend API health check successful', { responseTime });
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        configured: true,
        baseUrl: backendUrl,
        httpStatus: response.status,
      },
    };
  } catch (error) {
    const responseTime = timer.end(false, error instanceof Error ? error.name : 'UnknownError');
    
    logger.error('Backend API health check failed', error instanceof Error ? error : new Error(String(error)), {
      responseTime,
      backendUrl,
    });
    
    // Report critical backend API failure to monitoring
    ErrorMonitoring.reportError(
      error instanceof Error ? error : new Error('Backend API connection failed'),
      {
        component: 'health-check',
        operation: 'backend-api-check',
        metadata: {
          backendUrl,
          responseTime,
          configured: !!config.api.revivalBaseUrl,
        },
        severity: 'high',
      }
    );
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Backend API connection failed',
      lastCheck: new Date().toISOString(),
      details: {
        configured: !!config.api.revivalBaseUrl,
        baseUrl: config.api.revivalBaseUrl,
      },
    };
  }
}

// Test Shopify Storefront API
async function checkShopifyStorefront(logger: ReturnType<typeof createLogger>): Promise<ServiceHealth> {
  const timer = createTimer('shopify-storefront-check', { component: 'health-check' });
  try {
    logger.debug('Starting Shopify storefront health check');
    if (!config.shopify.isConfigured) {
      logger.warn('Shopify credentials not configured');
      timer.end(false, 'ConfigurationMissing');
      return {
        status: 'unhealthy',
        error: 'Shopify credentials not configured',
        lastCheck: new Date().toISOString(),
        details: {
          configured: false,
          domain: config.shopify.storeDomain,
          hasToken: !!config.shopify.storefrontAccessToken,
        },
      };
    }

    const client = ShopifyBuy.buildClient({
      domain: config.shopify.storeDomain,
      storefrontAccessToken: config.shopify.storefrontAccessToken,
    });

    logger.debug('Testing Shopify storefront API connectivity', { domain: config.shopify.storeDomain });
    
    // Test with shop info fetch - lightweight operation
    const shopInfo = await client.shop.fetchInfo();
    const responseTime = timer.end(true);

    logger.debug('Shopify storefront health check successful', {
      shopName: shopInfo.name,
      currencyCode: shopInfo.currencyCode,
      responseTime,
    });
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        configured: true,
        domain: config.shopify.storeDomain,
        shopName: shopInfo.name,
        currencyCode: shopInfo.currencyCode,
      },
    };
  } catch (error) {
    const responseTime = timer.end(false, error instanceof Error ? error.name : 'UnknownError');
    
    logger.error('Shopify storefront health check failed', error instanceof Error ? error : new Error(String(error)), {
      responseTime,
      domain: config.shopify.storeDomain,
    });
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Shopify API connection failed',
      lastCheck: new Date().toISOString(),
      details: {
        configured: config.shopify.isConfigured,
        domain: config.shopify.storeDomain,
      },
    };
  }
}

// Test external API connectivity (legacy Revival API if configured)
async function checkExternalAPIs(logger: ReturnType<typeof createLogger>): Promise<ServiceHealth> {
  const timer = createTimer('external-apis-check', { component: 'health-check' });
  try {
    logger.debug('Starting external APIs health check');
    if (!config.api.revivalBaseUrl || config.api.revivalBaseUrl === '') {
      logger.debug('No external APIs configured');
      timer.end(true);
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        details: {
          configured: false,
          message: 'No external APIs configured',
        },
      };
    }

    logger.debug('Testing external API connectivity', { baseUrl: config.api.revivalBaseUrl });
    
    // Simple connectivity test to Revival API
    const response = await fetch(`${config.api.revivalBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Izerwaren-Frontend-HealthCheck/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = timer.end(true);

    if (!response.ok) {
      logger.warn('External API health check returned non-OK status', {
        status: response.status,
        statusText: response.statusText,
        responseTime,
      });
      
      return {
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        lastCheck: new Date().toISOString(),
        details: {
          configured: true,
          baseUrl: config.api.revivalBaseUrl,
          httpStatus: response.status,
        },
      };
    }

    logger.debug('External API health check successful', { responseTime });
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        configured: true,
        baseUrl: config.api.revivalBaseUrl,
        httpStatus: response.status,
      },
    };
  } catch (error) {
    const responseTime = timer.end(false, error instanceof Error ? error.name : 'UnknownError');
    
    logger.error('External API health check failed', error instanceof Error ? error : new Error(String(error)), {
      responseTime,
      baseUrl: config.api.revivalBaseUrl,
    });
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'External API connection failed',
      lastCheck: new Date().toISOString(),
      details: {
        configured: true,
        baseUrl: config.api.revivalBaseUrl,
      },
    };
  }
}

async function healthCheckHandler(request: Request) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  const logger = createLogger({
    correlationId,
    component: 'health-check',
    operation: 'health-status',
  });
  
  // Add correlation ID to response headers early
  const headers = new Headers({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Correlation-ID': correlationId,
  });

  try {
    logger.info('Starting comprehensive health check');
    
    // Check all services concurrently for faster health checks
    const [backendAPIHealth, shopifyHealth, externalAPIHealth] = await Promise.allSettled([
      checkBackendAPI(logger),
      checkShopifyStorefront(logger),
      checkExternalAPIs(logger),
    ]);

    const services = {
      backendAPI: backendAPIHealth.status === 'fulfilled' 
        ? backendAPIHealth.value 
        : {
            status: 'unhealthy' as const,
            error: 'Health check failed to execute',
            lastCheck: new Date().toISOString(),
          },
      shopify: shopifyHealth.status === 'fulfilled'
        ? shopifyHealth.value
        : {
            status: 'unhealthy' as const,
            error: 'Health check failed to execute',
            lastCheck: new Date().toISOString(),
          },
      externalAPIs: externalAPIHealth.status === 'fulfilled'
        ? externalAPIHealth.value
        : {
            status: 'unhealthy' as const,
            error: 'Health check failed to execute',
            lastCheck: new Date().toISOString(),
          },
    };

    // Calculate overall health status
    const serviceStatuses = Object.values(services).map(s => s.status);
    const healthyCount = serviceStatuses.filter(s => s === 'healthy').length;
    const unhealthyCount = serviceStatuses.filter(s => s === 'unhealthy').length;
    const degradedCount = serviceStatuses.filter(s => s === 'degraded').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Report to monitoring if system is unhealthy
    if (overallStatus === 'unhealthy') {
      const unhealthyServices = Object.entries(services)
        .filter(([_, service]) => service.status === 'unhealthy')
        .map(([name, service]) => ({ name, error: service.error }));

      ErrorMonitoring.reportCritical(
        `System health check failed - ${unhealthyServices.length} service(s) unhealthy`,
        {
          correlationId,
          component: 'health-check',
          operation: 'overall-health-assessment',
          metadata: {
            unhealthyServices,
            serviceStatuses: Object.fromEntries(
              Object.entries(services).map(([name, service]) => [name, service.status])
            ),
            responseTime: Date.now() - startTime,
          },
          severity: 'critical',
        }
      );
    } else if (overallStatus === 'degraded') {
      const degradedServices = Object.entries(services)
        .filter(([_, service]) => service.status === 'degraded')
        .map(([name, service]) => ({ name, error: service.error }));

      ErrorMonitoring.reportWarning(
        `System health degraded - ${degradedServices.length} service(s) degraded`,
        {
          correlationId,
          component: 'health-check',
          operation: 'overall-health-assessment',
          metadata: {
            degradedServices,
            serviceStatuses: Object.fromEntries(
              Object.entries(services).map(([name, service]) => [name, service.status])
            ),
            responseTime: Date.now() - startTime,
          },
          severity: 'medium',
        }
      );
    }

    const overallResponseTime = Date.now() - startTime;
    
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.environment,
      correlationId,
      services,
      metrics: {
        responseTime: overallResponseTime,
        memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        uptime: Math.round(process.uptime()), // seconds
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : undefined,
      },
    };

    // Set appropriate HTTP status
    let httpStatus: number;
    switch (overallStatus) {
      case 'healthy':
        httpStatus = 200;
        break;
      case 'degraded':
        httpStatus = 206; // Partial Content
        break;
      case 'unhealthy':
        httpStatus = 503; // Service Unavailable
        break;
    }

    headers.set('X-Health-Status', overallStatus);
    headers.set('X-Health-Check-Duration', overallResponseTime.toString());

    logger.info('Health check completed', {
      overallStatus,
      responseTime: overallResponseTime,
      serviceStatuses: {
        backendAPI: services.backendAPI.status,
        shopify: services.shopify.status,
        externalAPIs: services.externalAPIs.status,
      },
    });

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers,
    });

  } catch (error) {
    const errorResponseTime = Date.now() - startTime;
    
    logger.error('Health check execution failed', error instanceof Error ? error : new Error(String(error)), {
      responseTime: errorResponseTime,
    });
    
    // Report critical health check failure
    ErrorMonitoring.reportCritical(
      error instanceof Error ? error : new Error('Health check execution failed'),
      {
        correlationId,
        component: 'health-check',
        operation: 'health-check-execution',
        metadata: {
          responseTime: errorResponseTime,
          executionFailure: true,
        },
        severity: 'critical',
      }
    );
    
    // If the health check itself fails, return a minimal unhealthy response
    const failureResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.environment,
      correlationId,
      services: {},
      metrics: {
        responseTime: errorResponseTime,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime: Math.round(process.uptime()),
      },
    };

    headers.set('X-Health-Status', 'unhealthy');
    headers.set('X-Health-Check-Duration', errorResponseTime.toString());

    return NextResponse.json(
      {
        ...failureResponse,
        error: error instanceof Error ? error.message : 'Health check execution failed',
      },
      {
        status: 503,
        headers,
      }
    );
  }
}

// Export with logging middleware
export const GET = withRequestLogging(healthCheckHandler);
