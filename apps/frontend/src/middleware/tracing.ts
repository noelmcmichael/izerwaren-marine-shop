/**
 * Distributed Tracing Middleware
 * Integrates with Google Cloud Trace for request tracking and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { StructuredLogger, PerformanceMonitor, BusinessMetrics } from '@/lib/monitoring';

// Trace context type
interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
}

// Extract trace context from Cloud Trace header
function extractTraceContext(request: NextRequest): TraceContext | null {
  // Google Cloud Trace header format: X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=TRACE_FLAGS
  const traceHeader = request.headers.get('X-Cloud-Trace-Context');
  
  if (traceHeader) {
    const match = traceHeader.match(/^([a-f\d]+)\/(\d+);o=(\d+)$/);
    if (match) {
      return {
        traceId: match[1],
        spanId: match[2],
        traceFlags: match[3],
      };
    }
  }

  // Generate new trace context if not present
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  
  return {
    traceId,
    spanId,
    traceFlags: '1', // Sampled
  };
}

// Generate a new trace ID (32 hex characters)
function generateTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Generate a new span ID (16 decimal digits)
function generateSpanId(): string {
  return Math.floor(Math.random() * 1e16).toString();
}

// Get user information from request
function extractUserInfo(request: NextRequest): { userId?: string; userType?: string } {
  // Extract from authorization header or cookies
  const authorization = request.headers.get('Authorization');
  const userCookie = request.cookies.get('user')?.value;
  
  // This is a simplified extraction - adjust based on your auth implementation
  let userId: string | undefined;
  let userType: string | undefined;
  
  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie);
      userId = userData.id;
      userType = userData.type || userData.role;
    } catch {
      // Invalid JSON in cookie
    }
  }
  
  return { userId, userType };
}

// Determine if request should be sampled for tracing
function shouldSample(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Always sample API routes and important pages
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/products/')) return true;
  if (pathname.startsWith('/catalog')) return true;
  
  // Sample 10% of other requests
  return Math.random() < 0.1;
}

// Create tracing middleware
export function createTracingMiddleware() {
  return async function tracingMiddleware(request: NextRequest) {
    const logger = StructuredLogger.getInstance();
    const startTime = Date.now();
    
    // Extract or generate trace context
    const traceContext = extractTraceContext(request);
    const { userId, userType } = extractUserInfo(request);
    
    // Determine if this request should be traced
    const sampled = shouldSample(request);
    
    // Set trace context in environment for child processes
    if (traceContext && sampled) {
      process.env.CLOUD_TRACE_CONTEXT = `${traceContext.traceId}/${traceContext.spanId};o=${traceContext.traceFlags}`;
    }
    
    const requestTimer = PerformanceMonitor.startTimer('request_duration');
    
    // Log request start
    logger.info('request_started', {
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      user_agent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer'),
      user_id: userId,
      user_type: userType,
      trace_id: traceContext?.traceId,
      span_id: traceContext?.spanId,
      sampled,
    });

    // Track business metrics
    if (request.nextUrl.pathname.startsWith('/products/')) {
      const productId = request.nextUrl.pathname.split('/')[2];
      if (productId) {
        BusinessMetrics.trackProductView(productId, userId);
      }
    }
    
    BusinessMetrics.trackPageView(request.nextUrl.pathname, userId);

    try {
      // Continue with the request
      const response = NextResponse.next();
      
      // Add trace headers to response
      if (traceContext) {
        response.headers.set('X-Trace-Id', traceContext.traceId);
        response.headers.set('X-Span-Id', traceContext.spanId);
      }
      
      // Wait for response and measure duration
      const duration = requestTimer();
      
      // Log request completion
      logger.info('request_completed', {
        method: request.method,
        url: request.url,
        pathname: request.nextUrl.pathname,
        status_code: response.status,
        duration_ms: duration,
        user_id: userId,
        user_type: userType,
        trace_id: traceContext?.traceId,
        span_id: traceContext?.spanId,
      });
      
      // Record performance metrics
      PerformanceMonitor.recordMetric('request_duration_ms', duration);
      PerformanceMonitor.recordMetric(`${request.method.toLowerCase()}_request_count`, 1);
      PerformanceMonitor.recordMetric(`status_${response.status}_count`, 1);
      
      // Track slow requests
      if (duration > 1000) {
        logger.warn('slow_request_detected', {
          method: request.method,
          pathname: request.nextUrl.pathname,
          duration_ms: duration,
          user_id: userId,
          trace_id: traceContext?.traceId,
        });
      }
      
      return response;
      
    } catch (error) {
      const duration = requestTimer();
      
      // Log error
      logger.error('request_failed', error as Error, {
        method: request.method,
        url: request.url,
        pathname: request.nextUrl.pathname,
        duration_ms: duration,
        user_id: userId,
        user_type: userType,
        trace_id: traceContext?.traceId,
        span_id: traceContext?.spanId,
      });
      
      // Record error metrics
      PerformanceMonitor.recordMetric('request_error_count', 1);
      BusinessMetrics.trackError('middleware_error', (error as Error).message, {
        pathname: request.nextUrl.pathname,
        method: request.method,
      });
      
      throw error;
    } finally {
      // Clean up trace context
      delete process.env.CLOUD_TRACE_CONTEXT;
    }
  };
}

// Export performance monitoring utilities for use in API routes
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  operationName: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const timer = PerformanceMonitor.startTimer(operationName);
    const logger = StructuredLogger.getInstance();
    
    logger.debug(`${operationName}_started`);
    
    try {
      const result = fn(...args);
      
      // Handle async operations
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            const duration = timer();
            logger.info(`${operationName}_completed`, { duration_ms: duration });
            return value;
          })
          .catch((error: Error) => {
            const duration = timer();
            logger.error(`${operationName}_failed`, error, { duration_ms: duration });
            throw error;
          });
      }
      
      // Handle sync operations
      const duration = timer();
      logger.info(`${operationName}_completed`, { duration_ms: duration });
      return result;
      
    } catch (error) {
      const duration = timer();
      logger.error(`${operationName}_failed`, error as Error, { duration_ms: duration });
      throw error;
    }
  }) as T;
}

export { TraceContext, extractTraceContext, generateTraceId, generateSpanId };