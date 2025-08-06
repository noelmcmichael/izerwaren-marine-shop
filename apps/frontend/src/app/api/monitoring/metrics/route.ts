import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor, StructuredLogger, SystemMonitor } from '../../../../lib/monitoring';
import { generateCorrelationId } from '../../../../lib/logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Metrics API Endpoint
 * 
 * Provides real-time metrics data for monitoring dashboards
 */

const logger = StructuredLogger.getInstance();

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  
  // Start performance monitoring
  const endTimer = PerformanceMonitor.startTimer('metrics_api');

  try {
    logger.info('Metrics API request', { 
      method: 'GET', 
      correlationId,
      userAgent: request.headers.get('user-agent'),
    });

    // Get time range from query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = parseTimeRange(searchParams.get('timeRange'));
    const granularity = parseGranularity(searchParams.get('granularity'));

    // Collect all metrics
    const [systemMetrics, performanceMetrics, healthStatus] = await Promise.all([
      collectSystemMetrics(),
      collectPerformanceMetrics(timeRange, granularity),
      fetchHealthStatus(),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      correlationId,
      timeRange,
      granularity,
      metrics: {
        system: systemMetrics,
        performance: performanceMetrics,
        health: healthStatus,
        applicationMetrics: PerformanceMonitor.getMetrics(),
      },
    };

    // Record successful response
    const duration = endTimer();
    PerformanceMonitor.recordMetric('metrics_api_success_count', 1);
    PerformanceMonitor.recordMetric('metrics_api_response_time', duration);

    logger.info('Metrics API response', { 
      correlationId,
      duration,
      metricsCount: Object.keys(response.metrics.applicationMetrics).length,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Correlation-ID': correlationId,
      },
    });

  } catch (error) {
    const duration = endTimer();
    
    logger.error('Metrics API error', error as Error, { 
      correlationId,
      duration,
    });

    PerformanceMonitor.recordMetric('metrics_api_error_count', 1);

    return NextResponse.json(
      {
        error: 'Internal server error',
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
}

async function collectSystemMetrics() {
  return {
    memory: {
      usage: SystemMonitor.getMemoryUsage(),
      unit: 'MB',
    },
    uptime: {
      value: SystemMonitor.getUptime(),
      unit: 'seconds',
    },
    cpu: {
      usage: await SystemMonitor.getCPUUsage(),
      unit: 'percentage',
    },
    timestamp: new Date().toISOString(),
  };
}

async function collectPerformanceMetrics(
  timeRange: { start: Date; end: Date },
  granularity: string
) {
  const metrics = PerformanceMonitor.getMetrics();
  
  // Calculate derived metrics
  const totalRequests = metrics['total_requests'] || 0;
  const errorCount = metrics['error_count'] || 0;
  const totalResponseTime = metrics['total_response_time_ms'] || 0;

  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

  return {
    requests: {
      total: totalRequests,
      successful: totalRequests - errorCount,
      failed: errorCount,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
    },
    responseTime: {
      average: Math.round(avgResponseTime),
      unit: 'ms',
    },
    throughput: {
      requestsPerSecond: calculateThroughput(totalRequests, timeRange),
      unit: 'req/sec',
    },
    timestamp: new Date().toISOString(),
  };
}

async function fetchHealthStatus() {
  try {
    // Make internal request to health endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch health status for metrics', error as Error);
    
    return {
      status: 'unknown',
      error: 'Failed to fetch health status',
      timestamp: new Date().toISOString(),
    };
  }
}

function parseTimeRange(timeRange?: string | null): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (timeRange) {
    case '1h':
      start = new Date(end.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(end.getTime() - 60 * 60 * 1000); // Default to 1 hour
  }

  return { start, end };
}

function parseGranularity(granularity?: string | null): string {
  const validGranularities = ['1m', '5m', '15m', '1h', '6h', '24h'];
  return validGranularities.includes(granularity || '') ? granularity! : '5m';
}

function calculateThroughput(totalRequests: number, timeRange: { start: Date; end: Date }): number {
  const durationMs = timeRange.end.getTime() - timeRange.start.getTime();
  const durationSeconds = durationMs / 1000;
  
  if (durationSeconds === 0) return 0;
  
  return Math.round((totalRequests / durationSeconds) * 100) / 100;
}