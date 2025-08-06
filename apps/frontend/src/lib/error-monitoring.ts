import * as Sentry from '@sentry/nextjs';
import { StructuredLogger } from './logger';

// Handle potential missing functions in newer Sentry versions
const safeSentry = {
  ...Sentry,
  captureUserFeedback: Sentry.captureUserFeedback || (() => console.warn('captureUserFeedback not available')),
  startTransaction: Sentry.startTransaction || ((_config: any) => {
    console.warn('startTransaction not available');
    return {
      setStatus: () => {},
      finish: () => {},
    };
  }),
};

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserFeedback {
  name?: string;
  email?: string;
  comments: string;
}

export class ErrorMonitoring {
  private static logger = new StructuredLogger('ErrorMonitoring');

  /**
   * Report an error to Sentry with context enrichment
   */
  static reportError(error: Error | string, context?: ErrorContext): string {
    const correlationId = context?.correlationId || `error-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Log to our structured logging system first
    this.logger.error('Error reported to monitoring', {
      correlationId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : { message: error },
      context,
    });

    // Set Sentry context
    Sentry.withScope((scope) => {
      // Add correlation ID as tag and context
      scope.setTag('correlationId', correlationId);
      scope.setContext('correlation', { id: correlationId });

      // Add component context
      if (context?.component) {
        scope.setTag('component', context.component);
        scope.setContext('component', { name: context.component });
      }

      // Add operation context
      if (context?.operation) {
        scope.setTag('operation', context.operation);
        scope.setContext('operation', { name: context.operation });
      }

      // Set severity level
      if (context?.severity) {
        scope.setLevel(this.mapSeverityToSentryLevel(context.severity));
        scope.setTag('severity', context.severity);
      }

      // Add user context
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      // Add metadata as additional context
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }

      // Add environment context
      scope.setContext('environment', {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
      });

      // Capture the error
      try {
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(error, 'error');
        }
      } catch (sentryError) {
        console.warn('Failed to capture error in Sentry:', sentryError);
      }
    });

    return correlationId;
  }

  /**
   * Report a warning-level issue
   */
  static reportWarning(message: string, context?: ErrorContext): string {
    return this.reportError(message, { ...context, severity: 'medium' });
  }

  /**
   * Report critical error that requires immediate attention
   */
  static reportCritical(error: Error | string, context?: ErrorContext): string {
    return this.reportError(error, { ...context, severity: 'critical' });
  }

  /**
   * Add breadcrumb for debugging context
   */
  static addBreadcrumb(
    message: string,
    category: string = 'default',
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    data?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set user context for error reporting
   */
  static setUser(user: { id?: string; email?: string; username?: string }): void {
    Sentry.setUser(user);
  }

  /**
   * Set additional context
   */
  static setContext(key: string, value: Record<string, any>): void {
    Sentry.setContext(key, value);
  }

  /**
   * Collect user feedback for an error
   */
  static collectUserFeedback(eventId: string, feedback: UserFeedback): void {
    try {
      safeSentry.captureUserFeedback({
        event_id: eventId,
        name: feedback.name || 'Anonymous',
        email: feedback.email || 'noemail@example.com',
        comments: feedback.comments,
      });
    } catch (error) {
      console.warn('Failed to capture user feedback:', error);
    }

    this.logger.info('User feedback collected', {
      eventId,
      feedback: {
        name: feedback.name || 'Anonymous',
        hasEmail: !!feedback.email,
        comments: feedback.comments,
      },
    });
  }

  /**
   * Start a performance transaction
   */
  static startTransaction(name: string, operation: string): any {
    try {
      return safeSentry.startTransaction({
        name,
        op: operation,
      });
    } catch (error) {
      console.warn('Failed to start transaction:', error);
      return {
        setStatus: () => {},
        finish: () => {},
      };
    }
  }

  /**
   * Wrap async function with error monitoring
   */
  static async withErrorMonitoring<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    const transaction = this.startTransaction(operation, 'function');
    
    try {
      this.addBreadcrumb(`Starting ${operation}`, 'operation', 'info');
      const result = await fn();
      this.addBreadcrumb(`Completed ${operation}`, 'operation', 'info');
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      this.addBreadcrumb(`Failed ${operation}`, 'operation', 'error', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      transaction.setStatus('internal_error');
      
      const correlationId = this.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { ...context, operation }
      );
      
      // Re-throw with correlation ID
      if (error instanceof Error) {
        (error as any).correlationId = correlationId;
      }
      
      throw error;
    } finally {
      transaction.finish();
    }
  }

  /**
   * Map our severity levels to Sentry severity levels
   */
  private static mapSeverityToSentryLevel(severity: string): Sentry.SeverityLevel {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'fatal';
      default:
        return 'error';
    }
  }

  /**
   * Flush Sentry queue (useful for serverless environments)
   */
  static async flush(timeout: number = 5000): Promise<boolean> {
    return Sentry.flush(timeout);
  }

  /**
   * Close Sentry client
   */
  static close(timeout: number = 5000): Promise<boolean> {
    return Sentry.close(timeout);
  }
}

// Export convenience functions
export const reportError = ErrorMonitoring.reportError.bind(ErrorMonitoring);
export const reportWarning = ErrorMonitoring.reportWarning.bind(ErrorMonitoring);
export const reportCritical = ErrorMonitoring.reportCritical.bind(ErrorMonitoring);
export const addBreadcrumb = ErrorMonitoring.addBreadcrumb.bind(ErrorMonitoring);
export const withErrorMonitoring = ErrorMonitoring.withErrorMonitoring.bind(ErrorMonitoring);