import { NextRequest, NextResponse } from 'next/server';
import { withRequestLogging } from '@/middleware/logging';
import { ErrorMonitoring } from '@/lib/error-monitoring';

async function handler(request: NextRequest) {
  const url = new URL(request.url);
  const errorType = url.searchParams.get('type') || 'generic';

  // Add breadcrumb for debugging
  ErrorMonitoring.addBreadcrumb('Test error endpoint called', 'test', 'info', {
    errorType,
    timestamp: new Date().toISOString(),
  });

  switch (errorType) {
    case 'generic':
      throw new Error('This is a test error for monitoring verification');
    
    case 'network':
      const networkError = new Error('Failed to connect to external service');
      (networkError as any).code = 'ECONNREFUSED';
      throw networkError;
    
    case 'validation':
      const validationError = new Error('Invalid request parameters');
      (validationError as any).statusCode = 400;
      throw validationError;
    
    case 'async':
      return ErrorMonitoring.withErrorMonitoring(
        'async-operation',
        async () => {
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error('Async operation failed');
        },
        {
          component: 'test-error-api',
          operation: 'async-test',
          metadata: { testType: 'async' },
        }
      );
    
    case 'warning':
      ErrorMonitoring.reportWarning('This is a test warning', {
        component: 'test-error-api',
        operation: 'warning-test',
        metadata: { testType: 'warning' },
      });
      
      return NextResponse.json({
        message: 'Warning reported successfully',
        timestamp: new Date().toISOString(),
      });
    
    case 'critical':
      ErrorMonitoring.reportCritical('This is a test critical error', {
        component: 'test-error-api',
        operation: 'critical-test',
        metadata: { testType: 'critical' },
      });
      
      return NextResponse.json({
        message: 'Critical error reported successfully',
        timestamp: new Date().toISOString(),
      });
    
    case 'success':
      ErrorMonitoring.addBreadcrumb('Successful test completed', 'test', 'info');
      
      return NextResponse.json({
        message: 'Test completed successfully',
        timestamp: new Date().toISOString(),
        availableTypes: [
          'generic',
          'network', 
          'validation',
          'async',
          'warning',
          'critical',
          'success'
        ],
      });
    
    default:
      throw new Error(`Unknown error type: ${errorType}`);
  }
}

export const GET = withRequestLogging(handler);
export const POST = withRequestLogging(handler);