/**
 * Test Reporter Utility
 * 
 * Integrates with our error monitoring system to provide:
 * - Structured test logging
 * - Error reporting with correlation IDs
 * - Test result tracking
 * - Integration with Sentry for test failures
 */

interface ErrorContext {
  correlationId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class TestReporter {
  private component: string;
  private correlationId: string;

  constructor(component: string, correlationId?: string) {
    this.component = component;
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  generateCorrelationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}`;
  }

  logInfo(message: string, metadata?: Record<string, any>): void {
    const logEntry = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      component: this.component,
      message,
      metadata,
    };

    console.log(`[${logEntry.level}] [${logEntry.correlationId}] ${message}`, 
                metadata ? JSON.stringify(metadata, null, 2) : '');
  }

  logWarning(message: string, metadata?: Record<string, any>): void {
    const logEntry = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      component: this.component,
      message,
      metadata,
    };

    console.warn(`[${logEntry.level}] [${logEntry.correlationId}] ${message}`, 
                 metadata ? JSON.stringify(metadata, null, 2) : '');
  }

  logError(message: string, error?: Error, metadata?: Record<string, any>): void {
    const logEntry = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      component: this.component,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      metadata,
    };

    console.error(`[${logEntry.level}] [${logEntry.correlationId}] ${message}`, 
                  error ? error.stack : '', 
                  metadata ? JSON.stringify(metadata, null, 2) : '');
  }

  async reportError(
    error: Error | string,
    context?: ErrorContext
  ): Promise<string> {
    // In test environment, we'll use a simplified error reporting
    // In production, this would integrate with the actual ErrorMonitoring class
    
    const errorData = {
      correlationId: context?.correlationId || this.correlationId,
      component: context?.component || this.component,
      operation: context?.operation || 'test-operation',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : { message: error },
      metadata: context?.metadata,
      severity: context?.severity || 'medium',
      timestamp: new Date().toISOString(),
      environment: process.env.PLAYWRIGHT_ENV || 'test',
    };

    // Log the error
    this.logError(
      `Test error reported: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error : undefined,
      errorData
    );

    // In a real implementation, this would send to Sentry
    // For now, we'll write to a test error log file
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const errorLogPath = path.join('./test-results', 'test-errors.jsonl');
      const errorLine = JSON.stringify(errorData) + '\n';
      
      await fs.promises.mkdir('./test-results', { recursive: true });
      await fs.promises.appendFile(errorLogPath, errorLine);
      
    } catch (writeError) {
      console.error('Failed to write test error log:', writeError);
    }

    return errorData.correlationId;
  }

  logTestStart(testName: string, metadata?: Record<string, any>): void {
    this.logInfo(`Starting test: ${testName}`, {
      testName,
      ...metadata,
    });
  }

  logTestComplete(testName: string, result: 'passed' | 'failed' | 'skipped', metadata?: Record<string, any>): void {
    const level = result === 'failed' ? 'ERROR' : result === 'skipped' ? 'WARN' : 'INFO';
    
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      component: this.component,
      message: `Test ${result}: ${testName}`,
      testResult: {
        testName,
        result,
        ...metadata,
      },
    };

    if (level === 'ERROR') {
      console.error(`[${logEntry.level}] [${logEntry.correlationId}] ${logEntry.message}`);
    } else if (level === 'WARN') {
      console.warn(`[${logEntry.level}] [${logEntry.correlationId}] ${logEntry.message}`);
    } else {
      console.log(`[${logEntry.level}] [${logEntry.correlationId}] ${logEntry.message}`);
    }
  }

  logStep(stepName: string, metadata?: Record<string, any>): void {
    this.logInfo(`  → ${stepName}`, metadata);
  }

  createStepReporter(stepName: string): TestReporter {
    return new TestReporter(`${this.component}:${stepName}`, this.correlationId);
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  getTestConfig(): any {
    try {
      return process.env.TEST_CONFIG ? JSON.parse(process.env.TEST_CONFIG) : {};
    } catch {
      return {};
    }
  }
}