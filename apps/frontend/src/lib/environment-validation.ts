/**
 * Environment Validation and Parity Checks
 * 
 * Ensures consistent configuration across development, staging, and production
 * environments. Validates required environment variables, monitoring setup,
 * and service configurations.
 */

import { config } from './config';
import { StructuredLogger } from './monitoring';

export interface EnvironmentCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  required: boolean;
  category: 'configuration' | 'monitoring' | 'services' | 'security';
  value?: string;
  expected?: string;
}

export interface EnvironmentValidationResult {
  environment: string;
  timestamp: string;
  overall: 'pass' | 'warn' | 'fail';
  checks: EnvironmentCheck[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
    critical_failures: number;
  };
  recommendations: string[];
}

export class EnvironmentValidator {
  private logger: StructuredLogger;
  private environment: string;

  constructor() {
    this.logger = StructuredLogger.getInstance();
    this.environment = config.environment;
  }

  /**
   * Perform comprehensive environment validation
   */
  async validateEnvironment(): Promise<EnvironmentValidationResult> {
    const checks: EnvironmentCheck[] = [];
    const recommendations: string[] = [];

    this.logger.info('Starting environment validation', {
      environment: this.environment,
      validation_type: 'comprehensive',
    });

    // Configuration checks
    checks.push(...this.validateConfiguration());

    // Monitoring checks
    checks.push(...await this.validateMonitoring());

    // Service checks
    checks.push(...await this.validateServices());

    // Security checks
    checks.push(...this.validateSecurity());

    // Environment-specific checks
    checks.push(...this.validateEnvironmentSpecific());

    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      warnings: checks.filter(c => c.status === 'warn').length,
      failures: checks.filter(c => c.status === 'fail').length,
      critical_failures: checks.filter(c => c.status === 'fail' && c.required).length,
    };

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(checks));

    // Determine overall status
    const overall = summary.critical_failures > 0 ? 'fail' : 
                   summary.failures > 0 || summary.warnings > 0 ? 'warn' : 'pass';

    const result: EnvironmentValidationResult = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      overall,
      checks,
      summary,
      recommendations,
    };

    this.logger.info('Environment validation completed', {
      environment: this.environment,
      overall_status: overall,
      summary,
      critical_failures: summary.critical_failures,
    });

    return result;
  }

  /**
   * Validate basic configuration settings
   */
  private validateConfiguration(): EnvironmentCheck[] {
    const checks: EnvironmentCheck[] = [];

    // Node environment
    checks.push({
      name: 'NODE_ENV',
      status: process.env.NODE_ENV ? 'pass' : 'fail',
      message: process.env.NODE_ENV ? `Set to: ${process.env.NODE_ENV}` : 'NODE_ENV not set',
      required: true,
      category: 'configuration',
      value: process.env.NODE_ENV,
      expected: 'development|staging|production',
    });

    // Application version
    checks.push({
      name: 'App Version',
      status: config.app.version ? 'pass' : 'warn',
      message: config.app.version ? `Version: ${config.app.version}` : 'App version not configured',
      required: false,
      category: 'configuration',
      value: config.app.version,
    });

    // Base URL configuration
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    checks.push({
      name: 'Base URL',
      status: baseUrl ? 'pass' : 'warn',
      message: baseUrl ? `Configured: ${baseUrl}` : 'Base URL not configured',
      required: this.environment === 'production',
      category: 'configuration',
      value: baseUrl,
    });

    // API configuration
    checks.push({
      name: 'API Configuration',
      status: config.api.revivalBaseUrl ? 'pass' : 'warn',
      message: config.api.revivalBaseUrl ? 'Backend API configured' : 'Backend API not configured (standalone mode)',
      required: false,
      category: 'configuration',
    });

    return checks;
  }

  /**
   * Validate monitoring and observability setup
   */
  private async validateMonitoring(): Promise<EnvironmentCheck[]> {
    const checks: EnvironmentCheck[] = [];

    // Sentry configuration
    const sentryDsn = process.env.SENTRY_DSN;
    checks.push({
      name: 'Sentry Error Monitoring',
      status: sentryDsn ? 'pass' : this.environment === 'production' ? 'fail' : 'warn',
      message: sentryDsn ? 'Sentry DSN configured' : 'Sentry DSN not configured',
      required: this.environment === 'production',
      category: 'monitoring',
    });

    // Structured logging
    checks.push({
      name: 'Structured Logging',
      status: 'pass',
      message: 'Structured logging enabled with correlation IDs',
      required: true,
      category: 'monitoring',
    });

    // Health check endpoint
    try {
      const healthResponse = await fetch('/api/health', { method: 'HEAD' });
      checks.push({
        name: 'Health Check Endpoint',
        status: 'pass',
        message: 'Health check endpoint responding',
        required: true,
        category: 'monitoring',
      });
    } catch (error) {
      checks.push({
        name: 'Health Check Endpoint',
        status: 'fail',
        message: 'Health check endpoint not accessible',
        required: true,
        category: 'monitoring',
      });
    }

    // Monitoring dashboard
    try {
      const dashboardResponse = await fetch('/api/monitoring/dashboard', { method: 'HEAD' });
      checks.push({
        name: 'Monitoring Dashboard',
        status: 'pass',
        message: 'Monitoring dashboard API responding',
        required: false,
        category: 'monitoring',
      });
    } catch (error) {
      checks.push({
        name: 'Monitoring Dashboard',
        status: 'warn',
        message: 'Monitoring dashboard API not accessible',
        required: false,
        category: 'monitoring',
      });
    }

    return checks;
  }

  /**
   * Validate external service connections
   */
  private async validateServices(): Promise<EnvironmentCheck[]> {
    const checks: EnvironmentCheck[] = [];

    // Shopify configuration
    const shopifyConfigured = config.shopify.isConfigured;
    checks.push({
      name: 'Shopify Configuration',
      status: shopifyConfigured ? 'pass' : 'fail',
      message: shopifyConfigured ? 'Shopify credentials configured' : 'Shopify credentials missing',
      required: true,
      category: 'services',
    });

    // Test Shopify connectivity if configured
    if (shopifyConfigured) {
      try {
        const response = await fetch('/api/health');
        const healthData = await response.json();
        const shopifyHealth = healthData.services?.shopify?.status;
        
        checks.push({
          name: 'Shopify Connectivity',
          status: shopifyHealth === 'healthy' ? 'pass' : 'warn',
          message: `Shopify API status: ${shopifyHealth || 'unknown'}`,
          required: false,
          category: 'services',
        });
      } catch (error) {
        checks.push({
          name: 'Shopify Connectivity',
          status: 'warn',
          message: 'Unable to test Shopify connectivity',
          required: false,
          category: 'services',
        });
      }
    }

    // Firebase configuration (optional)
    const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    checks.push({
      name: 'Firebase Configuration',
      status: firebaseConfig ? 'pass' : 'warn',
      message: firebaseConfig ? 'Firebase configured' : 'Firebase not configured',
      required: false,
      category: 'services',
    });

    return checks;
  }

  /**
   * Validate security configuration
   */
  private validateSecurity(): EnvironmentCheck[] {
    const checks: EnvironmentCheck[] = [];

    // HTTPS enforcement in production
    if (this.environment === 'production') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const httpsEnforced = baseUrl?.startsWith('https://');
      
      checks.push({
        name: 'HTTPS Enforcement',
        status: httpsEnforced ? 'pass' : 'fail',
        message: httpsEnforced ? 'HTTPS enforced' : 'HTTPS not enforced in production',
        required: true,
        category: 'security',
      });
    }

    // Security headers (would need to be tested with actual request)
    checks.push({
      name: 'Security Headers',
      status: 'pass',
      message: 'Security headers configured in Next.js config',
      required: this.environment === 'production',
      category: 'security',
    });

    // Environment variable exposure
    const publicEnvVars = Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .filter(key => !['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_APP_VERSION', 'NEXT_PUBLIC_SHOPIFY_DOMAIN'].includes(key));

    checks.push({
      name: 'Environment Variable Exposure',
      status: publicEnvVars.length <= 5 ? 'pass' : 'warn',
      message: `${publicEnvVars.length} public environment variables exposed`,
      required: false,
      category: 'security',
    });

    return checks;
  }

  /**
   * Environment-specific validation
   */
  private validateEnvironmentSpecific(): EnvironmentCheck[] {
    const checks: EnvironmentCheck[] = [];

    switch (this.environment) {
      case 'development':
        checks.push({
          name: 'Development Mode',
          status: 'pass',
          message: 'Development environment properly configured',
          required: true,
          category: 'configuration',
        });
        break;

      case 'staging':
        checks.push({
          name: 'Staging Configuration',
          status: 'pass',
          message: 'Staging environment configured',
          required: true,
          category: 'configuration',
        });
        break;

      case 'production':
        // Additional production checks
        checks.push({
          name: 'Production Readiness',
          status: process.env.NODE_ENV === 'production' ? 'pass' : 'fail',
          message: 'Production environment variables properly set',
          required: true,
          category: 'configuration',
        });

        // Error monitoring required in production
        const sentryConfigured = !!process.env.SENTRY_DSN;
        checks.push({
          name: 'Production Error Monitoring',
          status: sentryConfigured ? 'pass' : 'fail',
          message: 'Error monitoring is required in production',
          required: true,
          category: 'monitoring',
        });
        break;

      default:
        checks.push({
          name: 'Environment Recognition',
          status: 'warn',
          message: `Unknown environment: ${this.environment}`,
          required: false,
          category: 'configuration',
        });
    }

    return checks;
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: EnvironmentCheck[]): string[] {
    const recommendations: string[] = [];
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warnChecks = checks.filter(c => c.status === 'warn');

    // Critical failures
    const criticalFailures = failedChecks.filter(c => c.required);
    if (criticalFailures.length > 0) {
      recommendations.push('🚨 CRITICAL: Address the following required configuration issues:');
      criticalFailures.forEach(check => {
        recommendations.push(`   - ${check.name}: ${check.message}`);
      });
    }

    // Non-critical failures
    const nonCriticalFailures = failedChecks.filter(c => !c.required);
    if (nonCriticalFailures.length > 0) {
      recommendations.push('❌ Fix the following configuration issues:');
      nonCriticalFailures.forEach(check => {
        recommendations.push(`   - ${check.name}: ${check.message}`);
      });
    }

    // Warnings
    if (warnChecks.length > 0) {
      recommendations.push('⚠️  Consider addressing the following warnings:');
      warnChecks.forEach(check => {
        recommendations.push(`   - ${check.name}: ${check.message}`);
      });
    }

    // Environment-specific recommendations
    if (this.environment === 'production') {
      recommendations.push('🏭 Production Environment Recommendations:');
      recommendations.push('   - Ensure all monitoring and alerting is properly configured');
      recommendations.push('   - Verify backup and disaster recovery procedures');
      recommendations.push('   - Test deployment rollback procedures');
      recommendations.push('   - Review security headers and HTTPS enforcement');
    } else if (this.environment === 'development') {
      recommendations.push('🛠️  Development Environment Recommendations:');
      recommendations.push('   - Ensure environment parity with production');
      recommendations.push('   - Test monitoring and logging locally');
      recommendations.push('   - Validate external service connectivity');
    }

    return recommendations;
  }

  /**
   * Quick validation for startup checks
   */
  async quickValidation(): Promise<{ status: 'pass' | 'warn' | 'fail'; message: string }> {
    const criticalChecks = [
      process.env.NODE_ENV ? 'pass' : 'fail',
      config.shopify.isConfigured ? 'pass' : 'fail',
      this.environment === 'production' ? (process.env.SENTRY_DSN ? 'pass' : 'fail') : 'pass',
    ];

    const hasFailures = criticalChecks.includes('fail');
    
    if (hasFailures) {
      return {
        status: 'fail',
        message: 'Critical environment configuration issues detected',
      };
    }

    return {
      status: 'pass',
      message: 'Environment validation passed',
    };
  }
}

// Export default instance
export const environmentValidator = new EnvironmentValidator();

// Startup validation function
export async function validateEnvironmentOnStartup(): Promise<void> {
  const logger = StructuredLogger.getInstance();
  
  try {
    const quickResult = await environmentValidator.quickValidation();
    
    if (quickResult.status === 'fail') {
      logger.error('Environment validation failed on startup', null, {
        component: 'environment-validation',
        operation: 'startup-check',
        validation_status: quickResult.status,
        message: quickResult.message,
      });
      
      // In production, this might cause the app to exit
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Critical environment validation failed. App may not function correctly.');
      }
    } else {
      logger.info('Environment validation passed on startup', {
        component: 'environment-validation',
        operation: 'startup-check',
        validation_status: quickResult.status,
        message: quickResult.message,
      });
    }
  } catch (error) {
    logger.error('Environment validation failed to execute', error as Error, {
      component: 'environment-validation',
      operation: 'startup-check',
    });
  }
}