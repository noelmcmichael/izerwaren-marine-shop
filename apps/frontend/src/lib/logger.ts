/**
 * Structured Logging Service with Correlation ID Support
 * 
 * Provides enterprise-grade logging with correlation ID tracking,
 * structured metadata, and GCP Cloud Logging integration.
 */

import { config } from './config';

// Types for structured logging
export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  component?: string;
  service?: string;
  version?: string;
  environment?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface LogError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  details?: any;
}

export interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  operation: string;
  success: boolean;
  errorType?: string;
}

// Simple logger interface for Next.js compatibility
interface Logger {
  debug(entry: any): void;
  info(entry: any): void;
  warn(entry: any): void;
  error(entry: any): void;
  fatal(entry: any): void;
}

// Create simple console-based logger that works with Next.js
const createSimpleLogger = (): Logger => {
  const formatEntry = (level: string, entry: any) => {
    if (config.isDevelopment) {
      // Pretty format for development
      const timestamp = new Date().toISOString();
      const correlationId = entry.correlationId || 'unknown';
      const message = entry.message || '';
      
      console.log(`[${timestamp}] [${level.toUpperCase()}] [${correlationId}] ${message}`);
      
      if (entry.data || entry.error || entry.httpRequest || entry.httpResponse) {
        console.log('  Details:', JSON.stringify({
          ...(entry.data && { data: entry.data }),
          ...(entry.error && { error: entry.error }),
          ...(entry.httpRequest && { httpRequest: entry.httpRequest }),
          ...(entry.httpResponse && { httpResponse: entry.httpResponse }),
        }, null, 2));
      }
    } else {
      // Structured JSON for production
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: 'izerwaren-frontend',
        version: config.app.version,
        environment: config.environment,
        ...entry,
      }));
    }
  };

  return {
    debug: (entry: any) => formatEntry('debug', entry),
    info: (entry: any) => formatEntry('info', entry),
    warn: (entry: any) => formatEntry('warn', entry),
    error: (entry: any) => formatEntry('error', entry),
    fatal: (entry: any) => formatEntry('fatal', entry),
  };
};

// Global logger instance
const logger = createSimpleLogger();

// Correlation ID management
export class CorrelationIdManager {
  private static current: string | undefined;

  static generate(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${config.app.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${random}`;
  }

  static set(correlationId: string): void {
    this.current = correlationId;
  }

  static get(): string | undefined {
    return this.current;
  }

  static clear(): void {
    this.current = undefined;
  }

  static getOrGenerate(): string {
    if (!this.current) {
      this.current = this.generate();
    }
    return this.current;
  }
}

// Enhanced logger class with correlation ID support
export class StructuredLogger {
  private baseContext: LogContext;

  constructor(context: LogContext = {}) {
    this.baseContext = {
      service: 'izerwaren-frontend',
      version: config.app.version,
      environment: config.environment,
      ...context,
    };
  }

  private createLogEntry(level: string, message: string, data?: any, context?: LogContext): any {
    const correlationId = context?.correlationId || 
                         CorrelationIdManager.get() || 
                         CorrelationIdManager.generate();

    const logEntry = {
      ...this.baseContext,
      ...context,
      correlationId,
      message,
      timestamp: new Date().toISOString(),
      level,
    };

    if (data) {
      if (data instanceof Error) {
        logEntry.error = this.serializeError(data);
      } else {
        logEntry.data = data;
      }
    }

    return logEntry;
  }

  private serializeError(error: Error): LogError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any).code && { code: (error as any).code },
      ...(error as any).statusCode && { statusCode: (error as any).statusCode },
      ...(error as any).details && { details: (error as any).details },
    };
  }

  debug(message: string, data?: any, context?: LogContext): void {
    const entry = this.createLogEntry('debug', message, data, context);
    logger.debug(entry);
  }

  info(message: string, data?: any, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, data, context);
    logger.info(entry);
  }

  warn(message: string, data?: any, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, data, context);
    logger.warn(entry);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, error, context);
    logger.error(entry);
  }

  fatal(message: string, error?: Error | any, context?: LogContext): void {
    const entry = this.createLogEntry('fatal', message, error, context);
    logger.fatal(entry);
  }

  // Performance logging
  performance(metrics: PerformanceMetrics, context?: LogContext): void {
    const entry = this.createLogEntry('info', `Performance: ${metrics.operation}`, {
      metrics: {
        operation: metrics.operation,
        duration: metrics.duration,
        startTime: metrics.startTime,
        endTime: metrics.endTime,
        success: metrics.success,
        errorType: metrics.errorType,
      },
      performanceLog: true,
    }, context);
    
    logger.info(entry);
  }

  // API request/response logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      httpRequest: {
        method,
        url,
        timestamp: new Date().toISOString(),
      },
    }, {
      ...context,
      operation: 'api-request',
      component: 'http-client',
    });
  }

  apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const success = status >= 200 && status < 400;
    
    this.info(`API Response: ${method} ${url} ${status}`, {
      httpResponse: {
        method,
        url,
        status,
        duration,
        success,
        timestamp: new Date().toISOString(),
      },
    }, {
      ...context,
      operation: 'api-response',
      component: 'http-client',
    });
  }

  // User action logging
  userAction(action: string, userId?: string, data?: any, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      userAction: {
        action,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        data,
      },
    }, {
      ...context,
      operation: 'user-action',
      component: 'frontend',
      userId,
    });
  }

  // Security event logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: any, context?: LogContext): void {
    const logLevel = severity === 'critical' ? 'fatal' : 
                    severity === 'high' ? 'error' : 
                    severity === 'medium' ? 'warn' : 'info';

    const entry = this.createLogEntry(logLevel, `Security Event: ${event}`, {
      securityEvent: {
        event,
        severity,
        timestamp: new Date().toISOString(),
        data,
      },
    }, {
      ...context,
      operation: 'security-event',
      component: 'security',
    });

    logger[logLevel](entry);
  }

  // Business metric logging
  businessMetric(metric: string, value: number, unit?: string, context?: LogContext): void {
    this.info(`Business Metric: ${metric}`, {
      businessMetric: {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString(),
      },
    }, {
      ...context,
      operation: 'business-metric',
      component: 'analytics',
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): StructuredLogger {
    return new StructuredLogger({
      ...this.baseContext,
      ...additionalContext,
    });
  }
}

// Performance timer utility
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private logger: StructuredLogger;
  private context?: LogContext;

  constructor(operation: string, logger: StructuredLogger, context?: LogContext) {
    this.operation = operation;
    this.logger = logger;
    this.context = context;
    this.startTime = Date.now();
    
    this.logger.debug(`Starting operation: ${operation}`, {
      operation,
      startTime: this.startTime,
    }, context);
  }

  end(success: boolean = true, errorType?: string): number {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const metrics: PerformanceMetrics = {
      operation: this.operation,
      duration,
      startTime: this.startTime,
      endTime,
      success,
      errorType,
    };

    this.logger.performance(metrics, this.context);
    
    return duration;
  }
}

// Default logger instance
export const log = new StructuredLogger();

// Convenience functions
export const withCorrelationId = <T>(correlationId: string, fn: () => T): T => {
  const previous = CorrelationIdManager.get();
  CorrelationIdManager.set(correlationId);
  
  try {
    return fn();
  } finally {
    if (previous) {
      CorrelationIdManager.set(previous);
    } else {
      CorrelationIdManager.clear();
    }
  }
};

export const createTimer = (operation: string, context?: LogContext): PerformanceTimer => {
  return new PerformanceTimer(operation, log, context);
};

export const createLogger = (context: LogContext): StructuredLogger => {
  return new StructuredLogger(context);
};

export const generateCorrelationId = (): string => {
  return CorrelationIdManager.generate();
};

// Export for testing
export { logger as rawLogger };