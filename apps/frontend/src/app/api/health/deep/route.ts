import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Deep Health Check Endpoint
 * 
 * Comprehensive health check that performs detailed validation of all
 * services, configurations, and dependencies. This endpoint is more
 * thorough than the basic health check but should not be used for
 * high-frequency monitoring due to performance impact.
 */

interface DeepHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  correlationId: string;
  version: string;
  environment: string;
  services: {
    backendAPI: ServiceDeepCheck;
    shopify: ServiceDeepCheck;
    externalAPIs: ServiceDeepCheck;
    configuration: ServiceDeepCheck;
    filesystem: ServiceDeepCheck;
  };
  performance: {
    totalResponseTime: number;
    serviceResponseTimes: Record<string, number>;
    memoryUsage: MemoryUsage;
    cpuUsage?: number;
    networkLatency?: Record<string, number>;
  };
  security: {
    configurationValidation: boolean;
    secretsConfigured: boolean;
    environmentValidation: boolean;
  };
  recommendations?: string[];
}

interface ServiceDeepCheck {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime: number;
  details: Record<string, any>;
  error?: string;
  lastCheck: string;
  recommendations?: string[];
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

function generateCorrelationId(): string {
  return `deep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function deepCheckBackendAPI(): Promise<ServiceDeepCheck> {
  const timer = Date.now();
  try {
    const backendUrl = config.api.revivalBaseUrl;
    
    if (!backendUrl || backendUrl === '') {
      return {
        status: 'healthy',
        responseTime: 0,
        details: {
          configured: false,
          message: 'Backend API not configured - frontend operates in standalone mode',
          mode: 'standalone',
        },
        lastCheck: new Date().toISOString(),
      };
    }

    // Comprehensive backend API checks
    const [healthCheck, pingCheck] = await Promise.allSettled([
      fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Izerwaren-Frontend-DeepCheck/1.0',
        },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${backendUrl}/ping`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      }),
    ]);

    const responseTime = Date.now() - timer;
    const recommendations: string[] = [];

    let healthResponse = null;
    let pingResponse = null;

    if (healthCheck.status === 'fulfilled') {
      healthResponse = healthCheck.value;
    }
    if (pingCheck.status === 'fulfilled') {
      pingResponse = pingCheck.value;
    }

    // Generate recommendations based on results
    if (responseTime > 3000) {
      recommendations.push('Backend API response time is high. Consider optimizing network connectivity or backend performance.');
    }
    
    if (!healthResponse || !healthResponse.ok) {
      recommendations.push('Backend API health check failed. Verify backend service availability.');
    }

    const overallHealthy = healthResponse?.ok && pingResponse?.ok;

    return {
      status: overallHealthy ? 'healthy' : 'degraded',
      responseTime,
      details: {
        configured: true,
        baseUrl: backendUrl,
        healthCheck: healthResponse ? {
          status: healthResponse.status,
          ok: healthResponse.ok,
        } : null,
        pingCheck: pingResponse ? {
          status: pingResponse.status,
          ok: pingResponse.ok,
        } : null,
        mode: 'backend-connected',
      },
      lastCheck: new Date().toISOString(),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - timer,
      error: error instanceof Error ? error.message : 'Backend API deep check failed',
      details: {
        configured: !!config.api.revivalBaseUrl,
        baseUrl: config.api.revivalBaseUrl,
        mode: 'backend-disconnected',
      },
      lastCheck: new Date().toISOString(),
      recommendations: ['Backend API connection failed. Check network connectivity and backend service availability.'],
    };
  }
}

async function deepCheckShopify(): Promise<ServiceDeepCheck> {
  const timer = Date.now();
  try {
    if (!config.shopify.isConfigured) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        error: 'Shopify not configured',
        details: {
          configured: false,
        },
        lastCheck: new Date().toISOString(),
        recommendations: ['Configure Shopify credentials to enable storefront functionality.'],
      };
    }

    const ShopifyBuy = (await import('shopify-buy')).default;
    const client = ShopifyBuy.buildClient({
      domain: config.shopify.storeDomain,
      storefrontAccessToken: config.shopify.storefrontAccessToken,
    });

    // Multiple Shopify API checks
    const [shopInfo, productCount] = await Promise.allSettled([
      client.shop.fetchInfo(),
      client.product.fetchAll().then(products => products.length),
    ]);

    const responseTime = Date.now() - timer;
    const recommendations: string[] = [];

    let productTotal = 0;
    if (productCount.status === 'fulfilled') {
      productTotal = productCount.value;
    }

    // Generate recommendations based on results
    if (responseTime > 2000) {
      recommendations.push('Shopify API response time is high. Consider implementing caching for product data.');
    }
    if (productTotal === 0) {
      recommendations.push('No products found in Shopify store. Verify store setup and product availability.');
    }

    return {
      status: 'healthy',
      responseTime,
      details: {
        configured: true,
        domain: config.shopify.storeDomain,
        shopInfo: shopInfo.status === 'fulfilled' ? {
          name: shopInfo.value.name,
          currencyCode: shopInfo.value.currencyCode,
          domain: shopInfo.value.domain,
        } : null,
        productCount: productTotal,
      },
      lastCheck: new Date().toISOString(),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - timer,
      error: error instanceof Error ? error.message : 'Shopify deep check failed',
      details: {
        configured: config.shopify.isConfigured,
        domain: config.shopify.storeDomain,
      },
      lastCheck: new Date().toISOString(),
      recommendations: ['Shopify API connection failed. Verify credentials and network connectivity.'],
    };
  }
}

async function deepCheckExternalAPIs(): Promise<ServiceDeepCheck> {
  const timer = Date.now();
  try {
    if (!config.api.revivalBaseUrl) {
      return {
        status: 'healthy',
        responseTime: 0,
        details: {
          configured: false,
          message: 'No external APIs configured',
        },
        lastCheck: new Date().toISOString(),
      };
    }

    // Test external API with detailed metrics
    const fetchTimer = Date.now();
    const response = await fetch(`${config.api.revivalBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Izerwaren-Frontend-DeepCheck/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    const networkLatency = Date.now() - fetchTimer;
    const responseTime = Date.now() - timer;
    const recommendations: string[] = [];

    if (networkLatency > 3000) {
      recommendations.push('High network latency to external API. Consider using a CDN or caching layer.');
    }

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      details: {
        configured: true,
        baseUrl: config.api.revivalBaseUrl,
        httpStatus: response.status,
        networkLatency,
        headers: Object.fromEntries(response.headers.entries()),
      },
      lastCheck: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - timer,
      error: error instanceof Error ? error.message : 'External API deep check failed',
      details: {
        configured: true,
        baseUrl: config.api.revivalBaseUrl,
      },
      lastCheck: new Date().toISOString(),
      recommendations: ['External API connection failed. Check network connectivity and API availability.'],
    };
  }
}

async function deepCheckConfiguration(): Promise<ServiceDeepCheck> {
  const timer = Date.now();
  try {
    const validation = config.validation.validateRequired();
    const recommendations: string[] = [];

    // Check for development-specific issues
    if (config.environment === 'development') {
      if (!config.shopify.isConfigured) {
        recommendations.push('Configure Shopify credentials for development testing.');
      }
    }

    // Check for production-specific requirements
    if (config.environment === 'production') {
      if (!config.shopify.isConfigured) {
        recommendations.push('Shopify configuration is required for production.');
      }
      if (config.app.features.debugMode) {
        recommendations.push('Debug mode should be disabled in production.');
      }
    }

    return {
      status: validation.valid ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - timer,
      details: {
        environment: config.environment,
        version: config.app.version,
        features: config.app.features,
        validation: validation,
        services: {
          shopifyConfigured: config.shopify.isConfigured,
          firebaseConfigured: config.firebase.isConfigured,
        },
      },
      lastCheck: new Date().toISOString(),
      error: validation.valid ? undefined : `Missing configuration: ${validation.missing.join(', ')}`,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - timer,
      error: error instanceof Error ? error.message : 'Configuration validation failed',
      details: {},
      lastCheck: new Date().toISOString(),
      recommendations: ['Configuration validation failed. Check environment variables and settings.'],
    };
  }
}

async function deepCheckFilesystem(): Promise<ServiceDeepCheck> {
  const timer = Date.now();
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // Check various filesystem paths
    const checks = await Promise.allSettled([
      fs.access(process.cwd()),
      fs.access(path.join(process.cwd(), 'package.json')),
      fs.access(os.tmpdir()),
    ]);

    const allPassed = checks.every(check => check.status === 'fulfilled');
    const recommendations: string[] = [];

    // Check disk space if possible
    try {
      const stats = await fs.stat(process.cwd());
      // This is a basic check - in production you might want more sophisticated disk space monitoring
    } catch {
      recommendations.push('Unable to check disk space. Monitor disk usage manually.');
    }

    return {
      status: allPassed ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - timer,
      details: {
        workingDirectory: process.cwd(),
        checksPerformed: checks.length,
        checksPassed: checks.filter(c => c.status === 'fulfilled').length,
        tempDirectory: os.tmpdir(),
      },
      lastCheck: new Date().toISOString(),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - timer,
      error: error instanceof Error ? error.message : 'Filesystem check failed',
      details: {
        workingDirectory: process.cwd(),
      },
      lastCheck: new Date().toISOString(),
      recommendations: ['Filesystem access failed. Check file permissions and disk space.'],
    };
  }
}

export async function GET() {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  try {
    // Run all deep checks concurrently
    const serviceTimers: Record<string, number> = {};
    
    const startTimers = () => {
      serviceTimers.backendAPI = Date.now();
      serviceTimers.shopify = Date.now();
      serviceTimers.externalAPIs = Date.now();
      serviceTimers.configuration = Date.now();
      serviceTimers.filesystem = Date.now();
    };

    startTimers();

    const [
      backendAPICheck,
      shopifyCheck,
      externalAPICheck,
      configurationCheck,
      filesystemCheck,
    ] = await Promise.allSettled([
      deepCheckBackendAPI(),
      deepCheckShopify(),
      deepCheckExternalAPIs(),
      deepCheckConfiguration(),
      deepCheckFilesystem(),
    ]);

    // Extract results or create failure responses
    const services = {
      backendAPI: backendAPICheck.status === 'fulfilled' ? backendAPICheck.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: 'Deep check execution failed',
        details: {},
        lastCheck: new Date().toISOString(),
      },
      shopify: shopifyCheck.status === 'fulfilled' ? shopifyCheck.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: 'Deep check execution failed',
        details: {},
        lastCheck: new Date().toISOString(),
      },
      externalAPIs: externalAPICheck.status === 'fulfilled' ? externalAPICheck.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: 'Deep check execution failed',
        details: {},
        lastCheck: new Date().toISOString(),
      },
      configuration: configurationCheck.status === 'fulfilled' ? configurationCheck.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: 'Deep check execution failed',
        details: {},
        lastCheck: new Date().toISOString(),
      },
      filesystem: filesystemCheck.status === 'fulfilled' ? filesystemCheck.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: 'Deep check execution failed',
        details: {},
        lastCheck: new Date().toISOString(),
      },
    };

    // Calculate overall status
    const serviceStatuses = Object.values(services).map(s => s.status);
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

    const totalResponseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();

    // Collect all recommendations
    const allRecommendations = Object.values(services)
      .flatMap(service => service.recommendations || [])
      .filter((rec, index, array) => array.indexOf(rec) === index); // Remove duplicates

    const deepHealthStatus: DeepHealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      correlationId,
      version: config.app.version,
      environment: config.environment,
      services,
      performance: {
        totalResponseTime,
        serviceResponseTimes: Object.fromEntries(
          Object.entries(services).map(([name, service]) => [name, service.responseTime])
        ),
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
        },
      },
      security: {
        configurationValidation: services.configuration.status === 'healthy',
        secretsConfigured: config.shopify.isConfigured,
        environmentValidation: config.environment !== 'unknown',
      },
      recommendations: allRecommendations.length > 0 ? allRecommendations : undefined,
    };

    // Set HTTP status based on overall health
    let httpStatus: number;
    switch (overallStatus) {
      case 'healthy':
        httpStatus = 200;
        break;
      case 'degraded':
        httpStatus = 206;
        break;
      case 'unhealthy':
        httpStatus = 503;
        break;
    }

    return NextResponse.json(deepHealthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Correlation-ID': correlationId,
        'X-Deep-Health-Check-Duration': totalResponseTime.toString(),
        'X-Health-Status': overallStatus,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        correlationId,
        version: config.app.version,
        environment: config.environment,
        error: error instanceof Error ? error.message : 'Deep health check execution failed',
        performance: {
          totalResponseTime: responseTime,
          serviceResponseTimes: {},
          memoryUsage: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: 0,
            external: 0,
            rss: 0,
            arrayBuffers: 0,
          },
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Correlation-ID': correlationId,
          'X-Deep-Health-Check-Duration': responseTime.toString(),
          'X-Health-Status': 'unhealthy',
        },
      }
    );
  }
}