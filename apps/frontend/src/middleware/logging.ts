/**
 * Logging Middleware for API Routes
 * 
 * Automatically adds correlation ID tracking and request/response logging
 * to all API routes in the Next.js application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CorrelationIdManager, createLogger, createTimer } from '@/lib/logger';
import { ErrorMonitoring } from '@/lib/error-monitoring';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
}

// Extract correlation ID from request headers or generate new one
function getOrCreateCorrelationId(request: NextRequest): string {
  // Check for existing correlation ID in headers
  const existingId = request.headers.get('x-correlation-id') ||
                    request.headers.get('x-request-id') ||
                    request.headers.get('correlation-id');
  
  if (existingId) {
    return existingId;
  }
  
  // Generate new correlation ID
  return CorrelationIdManager.generate();
}

// Extract request metadata
function extractRequestContext(request: NextRequest): RequestContext {
  const correlationId = getOrCreateCorrelationId(request);
  
  return {
    correlationId,
    requestId: correlationId, // Use correlation ID as request ID for simplicity
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || 'Unknown',
    ip: request.ip || 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'Unknown',
    startTime: Date.now(),
  };
}

// Create enhanced response with logging headers
function createLoggedResponse(
  response: NextResponse,
  context: RequestContext,
  duration: number,
  error?: Error
): NextResponse {
  // Add correlation tracking headers
  response.headers.set('x-correlation-id', context.correlationId);
  response.headers.set('x-request-id', context.requestId);
  response.headers.set('x-response-time', duration.toString());
  
  // Add debugging headers in development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('x-debug-timestamp', new Date().toISOString());
    response.headers.set('x-debug-environment', process.env.NODE_ENV);
  }

  return response;
}

// Main logging middleware function
export function withLogging(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return async function loggedHandler(request: NextRequest): Promise<NextResponse> {
    const requestContext = extractRequestContext(request);
    const logger = createLogger({
      correlationId: requestContext.correlationId,
      component: 'api-middleware',
      operation: 'http-request',
    });
    
    // Set correlation ID for the request context
    CorrelationIdManager.set(requestContext.correlationId);
    
    // Start performance timer
    const timer = createTimer(`${requestContext.method} ${requestContext.url}`, {
      correlationId: requestContext.correlationId,
    });

    try {
      // Log incoming request
      logger.info(`Incoming ${requestContext.method} request`, {
        httpRequest: {
          method: requestContext.method,
          url: requestContext.url,
          userAgent: requestContext.userAgent,
          ip: requestContext.ip,
          headers: Object.fromEntries(
            Array.from(request.headers.entries()).filter(([key]) => 
              !key.toLowerCase().includes('authorization') &&
              !key.toLowerCase().includes('cookie') &&
              !key.toLowerCase().includes('token')
            )
          ),
        },
      });

      // Execute the actual handler
      const response = await handler(request, requestContext);
      
      // Calculate response time
      const duration = timer.end(true);
      
      // Log successful response
      logger.info(`Request completed successfully`, {
        httpResponse: {
          status: response.status,
          duration,
          method: requestContext.method,
          url: requestContext.url,
        },
      });

      return createLoggedResponse(response, requestContext, duration);

    } catch (error) {
      const duration = timer.end(false, error instanceof Error ? error.name : 'UnknownError');
      
      // Log error to structured logging
      logger.error(`Request failed`, error instanceof Error ? error : new Error(String(error)), {
        httpRequest: {
          method: requestContext.method,
          url: requestContext.url,
          duration,
        },
      });

      // Report error to monitoring system
      const correlationId = ErrorMonitoring.reportError(
        error instanceof Error ? error : new Error(String(error)),
        {
          correlationId: requestContext.correlationId,
          component: 'api-middleware',
          operation: `${requestContext.method} ${requestContext.url}`,
          metadata: {
            url: requestContext.url,
            method: requestContext.method,
            userAgent: requestContext.userAgent,
            ip: requestContext.ip,
            duration,
          },
          severity: 'high',
        }
      );

      // Create error response
      const errorResponse = NextResponse.json(
        {
          error: 'Internal Server Error',
          correlationId: requestContext.correlationId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );

      return createLoggedResponse(errorResponse, requestContext, duration, error instanceof Error ? error : undefined);
    } finally {
      // Clear correlation ID context
      CorrelationIdManager.clear();
    }
  };
}

// Simplified wrapper for basic API routes
export function withRequestLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withLogging(async (request: NextRequest, context: RequestContext) => {
    return handler(request);
  });
}

// Helper to get current request context (for use within handlers)
export function getCurrentRequestContext(): { correlationId?: string } {
  return {
    correlationId: CorrelationIdManager.get(),
  };
}