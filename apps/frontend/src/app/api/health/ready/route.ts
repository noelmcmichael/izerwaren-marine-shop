import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { withRequestLogging } from '@/middleware/logging';
import { createLogger } from '@/lib/logger';

/**
 * Kubernetes Readiness Probe Endpoint
 * 
 * This endpoint determines if the service is ready to receive traffic.
 * It checks if all critical dependencies are available and responsive.
 * Returns 200 OK if ready, 503 Service Unavailable if not ready.
 */

interface ReadinessCheck {
  ready: boolean;
  timestamp: string;
  checks: {
    configuration: boolean;
    database?: boolean;
    externalServices?: boolean;
  };
  correlationId: string;
}

function generateCorrelationId(): string {
  return `ready-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function checkConfiguration(): Promise<boolean> {
  try {
    const validation = config.validation.validateRequired();
    return validation.valid;
  } catch {
    return false;
  }
}

async function checkBackendAPIReadiness(): Promise<boolean> {
  try {
    const backendUrl = config.api.revivalBaseUrl;
    
    // If no backend API configured, consider this OK for standalone frontend
    if (!backendUrl || backendUrl === '') {
      return true;
    }

    // Quick readiness check to backend
    const response = await fetch(`${backendUrl}/health`, {
      method: 'HEAD', // Lightweight request
      signal: AbortSignal.timeout(3000),
    });
    
    return response.ok;
  } catch {
    // If backend API is configured but not reachable, frontend can still serve static content
    return true;
  }
}

async function checkCriticalServices(): Promise<boolean> {
  try {
    // Only check critical services that are required for basic operation
    if (!config.shopify.isConfigured) {
      return false;
    }

    // Quick test without external call - just validate configuration
    return !!(config.shopify.storeDomain && config.shopify.storefrontAccessToken);
  } catch {
    return false;
  }
}

async function readinessCheckHandler() {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  const logger = createLogger({
    correlationId,
    component: 'readiness-check',
    operation: 'readiness-status',
  });

  try {
    logger.info('Starting readiness check');
    
    // Run critical readiness checks
    const [configReady, backendReady, servicesReady] = await Promise.allSettled([
      checkConfiguration(),
      checkBackendAPIReadiness(),
      checkCriticalServices(),
    ]);

    const checks = {
      configuration: configReady.status === 'fulfilled' ? configReady.value : false,
      backendAPI: backendReady.status === 'fulfilled' ? backendReady.value : false,
      externalServices: servicesReady.status === 'fulfilled' ? servicesReady.value : false,
    };

    // Service is ready if all critical checks pass
    const ready = checks.configuration && checks.backendAPI && checks.externalServices;

    const readinessStatus: ReadinessCheck = {
      ready,
      timestamp: new Date().toISOString(),
      checks,
      correlationId,
    };

    const responseTime = Date.now() - startTime;

    logger.info('Readiness check completed', {
      ready,
      responseTime,
      checks,
    });

    return NextResponse.json(readinessStatus, {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Correlation-ID': correlationId,
        'X-Readiness-Check-Duration': responseTime.toString(),
        'X-Ready': ready.toString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Readiness check execution failed', error instanceof Error ? error : new Error(String(error)), {
      responseTime,
    });
    
    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {
          configuration: false,
          backendAPI: false,
          externalServices: false,
        },
        correlationId,
        error: error instanceof Error ? error.message : 'Readiness check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Correlation-ID': correlationId,
          'X-Readiness-Check-Duration': responseTime.toString(),
          'X-Ready': 'false',
        },
      }
    );
  }
}

// Export with logging middleware
export const GET = withRequestLogging(readinessCheckHandler);