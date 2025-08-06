import { NextRequest, NextResponse } from 'next/server';
import { environmentValidator } from '../../../../lib/environment-validation';
import { StructuredLogger } from '../../../../lib/monitoring';
import { generateCorrelationId } from '../../../../lib/logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Environment Validation API Endpoint
 * 
 * Provides comprehensive environment validation results for
 * development, staging, and production environments
 */

const logger = StructuredLogger.getInstance();

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    logger.info('Environment validation API request', { 
      method: 'GET', 
      correlationId,
      userAgent: request.headers.get('user-agent'),
    });

    // Perform comprehensive environment validation
    const validationResult = await environmentValidator.validateEnvironment();
    const responseTime = Date.now() - startTime;

    logger.info('Environment validation completed', { 
      correlationId,
      responseTime,
      environment: validationResult.environment,
      overall_status: validationResult.overall,
      checks_total: validationResult.summary.total,
      critical_failures: validationResult.summary.critical_failures,
    });

    // Set appropriate HTTP status based on validation result
    const statusCode = validationResult.overall === 'pass' ? 200 : 
                      validationResult.overall === 'warn' ? 200 : 503;

    return NextResponse.json(
      {
        ...validationResult,
        correlationId,
        responseTime,
      },
      {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Correlation-ID': correlationId,
          'X-Environment-Status': validationResult.overall,
        },
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Environment validation API error', error as Error, { 
      correlationId,
      responseTime,
    });

    return NextResponse.json(
      {
        error: 'Environment validation failed',
        correlationId,
        timestamp: new Date().toISOString(),
        responseTime,
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

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  try {
    const { action } = await request.json();

    if (action === 'quick-check') {
      const quickResult = await environmentValidator.quickValidation();
      
      return NextResponse.json(
        {
          ...quickResult,
          correlationId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: 'Invalid action',
        correlationId,
      },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Environment validation POST error', error as Error, { 
      correlationId,
    });

    return NextResponse.json(
      {
        error: 'Invalid request',
        correlationId,
      },
      { status: 400 }
    );
  }
}