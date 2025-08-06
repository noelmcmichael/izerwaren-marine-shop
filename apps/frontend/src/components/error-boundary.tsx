'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMonitoring } from '@/lib/error-monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: {
    component?: string;
    operation?: string;
    metadata?: Record<string, any>;
  };
  onError?: (error: Error, errorInfo: ErrorInfo, correlationId: string) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  correlationId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to monitoring system
    const correlationId = ErrorMonitoring.reportError(error, {
      component: this.props.context?.component || 'ErrorBoundary',
      operation: this.props.context?.operation || 'render',
      metadata: {
        ...this.props.context?.metadata,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      severity: 'high',
    });

    // Update state with correlation ID
    this.setState({ correlationId });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo, correlationId);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
      console.log(`Correlation ID: ${correlationId}`);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          correlationId={this.state.correlationId}
          onRetry={() => this.setState({ hasError: false, error: undefined, correlationId: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  correlationId?: string;
  onRetry: () => void;
}

function ErrorFallback({ error, correlationId, onRetry }: ErrorFallbackProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');

  const handleFeedbackSubmit = () => {
    if (feedback.trim() && correlationId) {
      ErrorMonitoring.collectUserFeedback(correlationId, {
        comments: feedback,
      });
      setFeedbackSubmitted(true);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">
            We've encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
            </details>
          )}

          {correlationId && (
            <p className="text-xs text-gray-500 mb-4">
              Reference ID: {correlationId}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Reload Page
            </button>
          </div>

          {!feedbackSubmitted && correlationId && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Help us improve
              </h4>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What were you trying to do when this error occurred?"
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                rows={3}
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim()}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
              >
                Send Feedback
              </button>
            </div>
          )}

          {feedbackSubmitted && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-green-600">
                Thank you for your feedback! It helps us improve the experience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific error boundaries for different parts of the app
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    context={{ component: 'Page', operation: 'render' }}
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Error</h1>
          <p className="text-gray-600 mb-4">
            This page encountered an error and couldn't load properly.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, componentName }: { 
  children: ReactNode; 
  componentName: string;
}) => (
  <ErrorBoundary
    context={{ component: componentName, operation: 'render' }}
    fallback={
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-sm">
          This component is temporarily unavailable. Please try refreshing the page.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);