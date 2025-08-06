import { NextRequest, NextResponse } from 'next/server';
import { StructuredLogger, PerformanceMonitor } from '../../../../lib/monitoring';
import { generateCorrelationId } from '../../../../lib/logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Dashboard Data API Endpoint
 * 
 * Aggregates metrics for dashboard visualization
 */

const logger = StructuredLogger.getInstance();

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const endTimer = PerformanceMonitor.startTimer('dashboard_api');

  try {
    logger.info('Dashboard API request', { 
      method: 'GET', 
      correlationId,
    });

    // Get dashboard configuration
    const dashboard = await generateDashboardData();

    const duration = endTimer();
    PerformanceMonitor.recordMetric('dashboard_api_success_count', 1);

    logger.info('Dashboard API response', { 
      correlationId,
      duration,
      widgetCount: dashboard.widgets.length,
    });

    return NextResponse.json(
      {
        ...dashboard,
        correlationId,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
          'X-Correlation-ID': correlationId,
        },
      }
    );

  } catch (error) {
    const duration = endTimer();
    
    logger.error('Dashboard API error', error as Error, { 
      correlationId,
      duration,
    });

    PerformanceMonitor.recordMetric('dashboard_api_error_count', 1);

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

async function generateDashboardData() {
  const metrics = PerformanceMonitor.getMetrics();
  const now = new Date();

  // Calculate key metrics
  const totalRequests = metrics['total_requests'] || 0;
  const errorCount = metrics['error_count'] || 0;
  const avgResponseTime = metrics['avg_response_time_ms'] || 0;
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

  return {
    title: 'Izerwaren Production Monitoring Dashboard',
    lastUpdated: now.toISOString(),
    widgets: [
      {
        id: 'system-health',
        title: 'System Health',
        type: 'status',
        data: {
          status: errorRate < 1 ? 'healthy' : errorRate < 5 ? 'degraded' : 'unhealthy',
          uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        id: 'response-time',
        title: 'Average Response Time',
        type: 'metric',
        data: {
          value: Math.round(avgResponseTime),
          unit: 'ms',
          trend: getTrend('response_time', avgResponseTime),
          threshold: 1000,
          status: avgResponseTime < 500 ? 'good' : avgResponseTime < 1000 ? 'warning' : 'critical',
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        id: 'error-rate',
        title: 'Error Rate',
        type: 'metric',
        data: {
          value: Math.round(errorRate * 100) / 100,
          unit: '%',
          trend: getTrend('error_rate', errorRate),
          threshold: 1,
          status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical',
        },
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
      {
        id: 'request-volume',
        title: 'Request Volume',
        type: 'metric',
        data: {
          value: totalRequests,
          unit: 'requests',
          trend: getTrend('total_requests', totalRequests),
          period: 'last hour',
        },
        position: { x: 9, y: 0, w: 3, h: 2 },
      },
      {
        id: 'performance-chart',
        title: 'Performance Over Time',
        type: 'chart',
        data: {
          type: 'line',
          datasets: [
            {
              label: 'Response Time (ms)',
              data: generateTimeSeriesData('response_time', 24), // Last 24 hours
            },
            {
              label: 'Request Count',
              data: generateTimeSeriesData('request_count', 24),
            },
          ],
        },
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
      {
        id: 'error-breakdown',
        title: 'Error Breakdown',
        type: 'chart',
        data: {
          type: 'pie',
          datasets: [{
            data: getErrorBreakdown(),
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
          }],
        },
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
      {
        id: 'service-status',
        title: 'External Services',
        type: 'list',
        data: {
          items: [
            {
              name: 'Shopify API',
              status: getServiceStatus('shopify'),
              responseTime: metrics['shopify_response_time_ms'] || 0,
            },
            {
              name: 'Backend API',
              status: getServiceStatus('backend'),
              responseTime: metrics['backend_response_time_ms'] || 0,
            },
            {
              name: 'Sentry',
              status: getServiceStatus('sentry'),
              responseTime: metrics['sentry_response_time_ms'] || 0,
            },
          ],
        },
        position: { x: 0, y: 6, w: 4, h: 3 },
      },
      {
        id: 'business-metrics',
        title: 'Business Metrics',
        type: 'metrics-grid',
        data: {
          metrics: [
            {
              label: 'Page Views',
              value: metrics['page_views'] || 0,
              change: getTrend('page_views', metrics['page_views'] || 0),
            },
            {
              label: 'Product Views',
              value: metrics['product_views'] || 0,
              change: getTrend('product_views', metrics['product_views'] || 0),
            },
            {
              label: 'RFQ Submissions',
              value: metrics['rfq_submissions'] || 0,
              change: getTrend('rfq_submissions', metrics['rfq_submissions'] || 0),
            },
            {
              label: 'Search Queries',
              value: metrics['search_queries'] || 0,
              change: getTrend('search_queries', metrics['search_queries'] || 0),
            },
          ],
        },
        position: { x: 4, y: 6, w: 4, h: 3 },
      },
      {
        id: 'alerts',
        title: 'Recent Alerts',
        type: 'alerts',
        data: {
          alerts: getRecentAlerts(),
        },
        position: { x: 8, y: 6, w: 4, h: 3 },
      },
    ],
    config: {
      refreshInterval: 30000, // 30 seconds
      timezone: 'UTC',
      theme: 'dark',
    },
  };
}

function getTrend(metricName: string, currentValue: number): number {
  // In a real implementation, this would compare with historical data
  // For now, we'll return a placeholder trend
  const historical = PerformanceMonitor.getMetrics()[`${metricName}_previous`] || currentValue;
  return currentValue - historical;
}

function generateTimeSeriesData(metric: string, hours: number): Array<{ timestamp: string; value: number }> {
  // Generate sample time series data
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const value = generateSampleValue(metric, i);
    
    data.push({
      timestamp: timestamp.toISOString(),
      value,
    });
  }
  
  return data;
}

function generateSampleValue(metric: string, hoursAgo: number): number {
  // Generate realistic sample data based on metric type
  const baseValue = metric === 'response_time' ? 300 : 100;
  const randomVariation = Math.random() * 50 - 25;
  const timeVariation = Math.sin((hoursAgo / 24) * Math.PI * 2) * 20;
  
  return Math.max(0, Math.round(baseValue + randomVariation + timeVariation));
}

function getErrorBreakdown(): Array<{ label: string; value: number }> {
  const metrics = PerformanceMonitor.getMetrics();
  
  return [
    { label: '5xx Server Errors', value: metrics['5xx_errors'] || 0 },
    { label: '4xx Client Errors', value: metrics['4xx_errors'] || 0 },
    { label: 'Timeout Errors', value: metrics['timeout_errors'] || 0 },
    { label: 'Network Errors', value: metrics['network_errors'] || 0 },
  ];
}

function getServiceStatus(serviceName: string): 'healthy' | 'degraded' | 'unhealthy' {
  const metrics = PerformanceMonitor.getMetrics();
  const errorRate = metrics[`${serviceName}_error_rate`] || 0;
  
  if (errorRate < 0.01) return 'healthy';
  if (errorRate < 0.05) return 'degraded';
  return 'unhealthy';
}

function getRecentAlerts(): Array<{
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved?: boolean;
}> {
  // In a real implementation, this would fetch from an alerts database
  return [
    {
      id: '1',
      type: 'warning',
      message: 'Response time above 500ms threshold',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'info',
      message: 'Deployment completed successfully',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolved: true,
    },
  ];
}