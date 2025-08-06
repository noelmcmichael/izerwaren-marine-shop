'use client';

// Force dynamic rendering for test pages
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { ErrorBoundary, ComponentErrorBoundary } from '@/components/error-boundary';
import { ErrorMonitoring } from '@/lib/error-monitoring';

// Component that throws an error when button is clicked
function ErrorGeneratorComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error from React component');
  }

  return (
    <div className="p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Error Generator Component</h3>
      <p className="text-gray-600 mb-4">
        This component will throw an error when the button is clicked.
      </p>
      <button
        onClick={() => setShouldError(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Trigger Component Error
      </button>
    </div>
  );
}

// Component to test API errors
function ApiErrorTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testApiError = async (errorType: string) => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch(`/api/test-error?type=${errorType}`);
      const data = await response.json();
      
      if (!response.ok) {
        setResult(`API Error (${response.status}): ${data.error || 'Unknown error'}`);
      } else {
        setResult(`Success: ${data.message}`);
      }
    } catch (error) {
      setResult(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const errorTypes = [
    { type: 'success', label: 'Success Test', className: 'bg-green-600 hover:bg-green-700' },
    { type: 'generic', label: 'Generic Error', className: 'bg-red-600 hover:bg-red-700' },
    { type: 'network', label: 'Network Error', className: 'bg-red-600 hover:bg-red-700' },
    { type: 'validation', label: 'Validation Error', className: 'bg-orange-600 hover:bg-orange-700' },
    { type: 'async', label: 'Async Error', className: 'bg-red-600 hover:bg-red-700' },
    { type: 'warning', label: 'Warning Test', className: 'bg-yellow-600 hover:bg-yellow-700' },
    { type: 'critical', label: 'Critical Test', className: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-2">API Error Tester</h3>
      <p className="text-gray-600 mb-4">
        Test different types of API errors and monitoring integration.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {errorTypes.map(({ type, label, className }) => (
          <button
            key={type}
            onClick={() => testApiError(type)}
            disabled={isLoading}
            className={`${className} disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-blue-600 mb-2">
          Testing API... (check browser console and network tab)
        </div>
      )}

      {result && (
        <div className={`p-3 rounded text-sm ${
          result.startsWith('Success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  );
}

// Component to test client-side error monitoring
function ClientErrorTester() {
  const [result, setResult] = useState<string>('');

  const testClientError = (type: string) => {
    let correlationId: string;

    switch (type) {
      case 'error':
        correlationId = ErrorMonitoring.reportError(
          new Error('Test client-side error'),
          {
            component: 'test-monitoring-page',
            operation: 'client-error-test',
            metadata: { testType: 'error' },
            severity: 'medium',
          }
        );
        setResult(`Error reported with correlation ID: ${correlationId}`);
        break;

      case 'warning':
        correlationId = ErrorMonitoring.reportWarning(
          'Test client-side warning',
          {
            component: 'test-monitoring-page',
            operation: 'client-warning-test',
            metadata: { testType: 'warning' },
          }
        );
        setResult(`Warning reported with correlation ID: ${correlationId}`);
        break;

      case 'critical':
        correlationId = ErrorMonitoring.reportCritical(
          'Test client-side critical error',
          {
            component: 'test-monitoring-page',
            operation: 'client-critical-test',
            metadata: { testType: 'critical' },
          }
        );
        setResult(`Critical error reported with correlation ID: ${correlationId}`);
        break;

      case 'breadcrumb':
        ErrorMonitoring.addBreadcrumb(
          'Test breadcrumb added',
          'test',
          'info',
          { testType: 'breadcrumb', timestamp: new Date().toISOString() }
        );
        setResult('Breadcrumb added to error context');
        break;

      case 'context':
        ErrorMonitoring.setUser({ id: 'test-user-123', email: 'test@example.com' });
        ErrorMonitoring.setContext('testContext', {
          page: 'test-monitoring',
          action: 'context-test',
          timestamp: new Date().toISOString(),
        });
        setResult('User and context information set');
        break;

      default:
        setResult('Unknown test type');
    }
  };

  const testTypes = [
    { type: 'error', label: 'Report Error', className: 'bg-red-600 hover:bg-red-700' },
    { type: 'warning', label: 'Report Warning', className: 'bg-yellow-600 hover:bg-yellow-700' },
    { type: 'critical', label: 'Report Critical', className: 'bg-purple-600 hover:bg-purple-700' },
    { type: 'breadcrumb', label: 'Add Breadcrumb', className: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'context', label: 'Set Context', className: 'bg-gray-600 hover:bg-gray-700' },
  ];

  return (
    <div className="p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Client-Side Error Monitoring</h3>
      <p className="text-gray-600 mb-4">
        Test direct client-side error reporting and context setting.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {testTypes.map(({ type, label, className }) => (
          <button
            key={type}
            onClick={() => testClientError(type)}
            className={`${className} text-white px-3 py-2 rounded text-sm transition-colors`}
          >
            {label}
          </button>
        ))}
      </div>

      {result && (
        <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  );
}

export default function TestMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Monitoring Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Test different error scenarios and monitoring integrations. Check the browser console, 
            network tab, and Sentry dashboard to verify error reporting.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🔍 What to Check:</h2>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Browser console for correlation IDs and error logs</li>
              <li>• Network tab for Sentry requests and health check calls</li>
              <li>• Sentry dashboard for error reports with context</li>
              <li>• Error boundaries catching and displaying React errors</li>
              <li>• API error responses with correlation IDs</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Error Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ApiErrorTester />
          </div>

          {/* Client-Side Error Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ClientErrorTester />
          </div>

          {/* Error Boundary Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Error Boundary Test</h2>
            <p className="text-gray-600 mb-4">
              This component is wrapped in an error boundary that will catch and handle errors gracefully.
            </p>
            
            <ComponentErrorBoundary componentName="ErrorGeneratorComponent">
              <ErrorGeneratorComponent />
            </ComponentErrorBoundary>
          </div>

          {/* Health Check Link */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Health Check Integration</h2>
            <p className="text-gray-600 mb-4">
              Test the health check endpoints that now include error monitoring.
            </p>
            
            <div className="space-x-4">
              <a
                href="/api/health"
                target="_blank"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block transition-colors"
              >
                Test Health Check
              </a>
              <a
                href="/api/health/deep"
                target="_blank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block transition-colors"
              >
                Deep Health Check
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}