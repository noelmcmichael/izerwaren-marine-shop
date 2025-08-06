/**
 * Comprehensive Startup Validation System
 * 
 * Provides enhanced validation with format checking, dependency validation,
 * and clear error reporting with resolution steps.
 */

import { config } from './config';
import { secrets } from './secrets';

/**
 * Validation Result Types
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  category: 'environment' | 'secrets' | 'format' | 'dependency';
  field: string;
  message: string;
  resolution: string;
  critical: boolean;
}

export interface ValidationWarning {
  category: 'configuration' | 'performance' | 'security';
  field: string;
  message: string;
  recommendation: string;
}

export interface ValidationSummary {
  totalChecks: number;
  passed: number;
  errors: number;
  warnings: number;
  environment: string;
  timestamp: string;
}

/**
 * Validation Configuration Schema
 */
interface ValidationSchema {
  [key: string]: {
    required: boolean;
    format?: RegExp | ((value: string) => boolean);
    dependencies?: string[];
    description: string;
    resolution: string;
    environmentSpecific?: {
      production?: boolean;
      development?: boolean;
    };
  };
}

/**
 * Comprehensive Validation Schema
 */
const validationSchema: ValidationSchema = {
  // Server Configuration
  PORT: {
    required: true,
    format: (value: string) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    description: 'Server port number',
    resolution: 'Set PORT to a valid integer between 1 and 65535 (e.g., PORT=3001)',
  },
  
  NODE_ENV: {
    required: true,
    format: /^(development|production|test)$/,
    description: 'Node.js environment',
    resolution: 'Set NODE_ENV to "development", "production", or "test"',
  },

  // Database Configuration (Production Only)
  DB_HOST: {
    required: false,
    format: /^[a-zA-Z0-9.-]+$/,
    description: 'Database host',
    resolution: 'Set DB_HOST to a valid hostname or IP address (e.g., DB_HOST=localhost)',
    environmentSpecific: { production: true },
  },
  
  DB_NAME: {
    required: false,
    format: /^[a-zA-Z0-9_-]+$/,
    description: 'Database name',
    resolution: 'Set DB_NAME to a valid database name (e.g., DB_NAME=izerwaren)',
    environmentSpecific: { production: true },
  },
  
  DB_USER: {
    required: false,
    format: /^[a-zA-Z0-9_-]+$/,
    description: 'Database username',
    resolution: 'Set DB_USER to a valid database username',
    environmentSpecific: { production: true },
  },

  // Shopify Configuration (Production Only)
  SHOPIFY_SHOP_DOMAIN: {
    required: false,
    format: /^[a-zA-Z0-9-]+\.myshopify\.com$/,
    description: 'Shopify shop domain',
    resolution: 'Set SHOPIFY_SHOP_DOMAIN to your shop domain (e.g., your-shop.myshopify.com)',
    environmentSpecific: { production: true },
    dependencies: ['SHOPIFY_ADMIN_ACCESS_TOKEN'],
  },
  
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: {
    required: false,
    format: /^[a-zA-Z0-9_-]{32,}$/,
    description: 'Shopify Storefront API access token',
    resolution: 'Generate a Storefront API access token in your Shopify admin',
    environmentSpecific: { production: true },
  },

  // Firebase Configuration
  FIREBASE_PROJECT_ID: {
    required: false,
    format: /^[a-z0-9-]+$/,
    description: 'Firebase project ID',
    resolution: 'Set FIREBASE_PROJECT_ID to your Firebase project ID',
  },
  
  FIREBASE_CLIENT_EMAIL: {
    required: false,
    format: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Firebase service account client email',
    resolution: 'Set FIREBASE_CLIENT_EMAIL to the client_email from your service account JSON',
  },

  // Google Cloud Configuration
  GOOGLE_CLOUD_PROJECT: {
    required: false,
    format: /^[a-z0-9-]+$/,
    description: 'Google Cloud project ID',
    resolution: 'Set GOOGLE_CLOUD_PROJECT to your GCP project ID for Secret Manager',
  },

  // Security Configuration
  JWT_SECRET: {
    required: false,
    format: (value: string) => value.length >= 32,
    description: 'JWT signing secret',
    resolution: 'Set JWT_SECRET to a strong random string (minimum 32 characters)',
    environmentSpecific: { production: true },
  },
};

/**
 * Main Validation Class
 */
class StartupValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private totalChecks = 0;

  /**
   * Run comprehensive validation
   */
  async validate(): Promise<ValidationResult> {
    this.errors = [];
    this.warnings = [];
    this.totalChecks = 0;

    console.log('🔍 Starting comprehensive startup validation...');

    // Phase 1: Environment variable validation
    await this.validateEnvironmentVariables();
    
    // Phase 2: Secret validation
    await this.validateSecrets();
    
    // Phase 3: Format validation
    await this.validateFormats();
    
    // Phase 4: Dependency validation
    await this.validateDependencies();
    
    // Phase 5: Environment-specific validation
    await this.validateEnvironmentSpecific();

    const summary: ValidationSummary = {
      totalChecks: this.totalChecks,
      passed: this.totalChecks - this.errors.length - this.warnings.length,
      errors: this.errors.length,
      warnings: this.warnings.length,
      environment: config.environment,
      timestamp: new Date().toISOString(),
    };

    const result: ValidationResult = {
      valid: this.errors.filter(e => e.critical).length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary,
    };

    this.logValidationResults(result);
    return result;
  }

  /**
   * Validate environment variables existence
   */
  private async validateEnvironmentVariables(): Promise<void> {
    console.log('🔧 Validating environment variables...');
    
    for (const [key, schema] of Object.entries(validationSchema)) {
      this.totalChecks++;
      const value = process.env[key];
      
      // Check if required variable is missing
      if (schema.required && !value) {
        this.addError('environment', key, `Required environment variable ${key} is missing`, schema.resolution, true);
        continue;
      }
      
      // Check environment-specific requirements
      if (schema.environmentSpecific) {
        const envRequired = schema.environmentSpecific[config.environment as keyof typeof schema.environmentSpecific];
        if (envRequired && !value) {
          this.addError('environment', key, `${key} is required in ${config.environment} environment`, schema.resolution, true);
        }
      }
    }
  }

  /**
   * Validate secrets availability
   */
  private async validateSecrets(): Promise<void> {
    console.log('🔑 Validating secrets...');
    
    try {
      const secretValidation = await secrets.validate();
      this.totalChecks += 5; // Number of secrets we check
      
      secretValidation.missing.forEach(missing => {
        this.addError('secrets', missing, `Secret not available: ${missing}`, 'Configure in Google Cloud Secret Manager or environment variables', config.isProduction);
      });
      
      secretValidation.warnings.forEach(warning => {
        this.addWarning('configuration', warning, `Optional secret not configured: ${warning}`, 'Consider configuring for enhanced security');
      });
      
    } catch (error) {
      this.addError('secrets', 'SECRET_MANAGER', `Failed to validate secrets: ${error}`, 'Check Secret Manager permissions and network connectivity', true);
    }
  }

  /**
   * Validate configuration formats
   */
  private async validateFormats(): Promise<void> {
    console.log('📋 Validating configuration formats...');
    
    for (const [key, schema] of Object.entries(validationSchema)) {
      const value = process.env[key];
      
      if (value && schema.format) {
        this.totalChecks++;
        
        let isValid = false;
        if (schema.format instanceof RegExp) {
          isValid = schema.format.test(value);
        } else if (typeof schema.format === 'function') {
          isValid = schema.format(value);
        }
        
        if (!isValid) {
          this.addError('format', key, `${key} has invalid format: ${value}`, schema.resolution, false);
        }
      }
    }
  }

  /**
   * Validate configuration dependencies
   */
  private async validateDependencies(): Promise<void> {
    console.log('🔗 Validating configuration dependencies...');
    
    for (const [key, schema] of Object.entries(validationSchema)) {
      if (schema.dependencies && process.env[key]) {
        this.totalChecks++;
        
        const missingDeps = schema.dependencies.filter(dep => !process.env[dep]);
        if (missingDeps.length > 0) {
          this.addError('dependency', key, `${key} requires dependencies: ${missingDeps.join(', ')}`, 
            `Configure the following environment variables: ${missingDeps.join(', ')}`, false);
        }
      }
    }
  }

  /**
   * Validate environment-specific requirements
   */
  private async validateEnvironmentSpecific(): Promise<void> {
    console.log('🌍 Validating environment-specific requirements...');
    
    if (config.isProduction) {
      this.totalChecks++;
      
      // Production-specific validations
      if (config.security.jwtSecret === 'dev-secret-change-in-production') {
        this.addError('environment', 'JWT_SECRET', 'Using development JWT secret in production', 
          'Generate a strong JWT secret and set JWT_SECRET environment variable', true);
      }
      
      // Database requirement in production
      if (!config.database.isConfigured) {
        this.addWarning('configuration', 'DATABASE', 'Database not configured in production', 
          'Configure database connection for production deployment');
      }
      
      // Shopify requirement in production
      if (!config.shopify.isConfigured) {
        this.addWarning('configuration', 'SHOPIFY', 'Shopify not configured in production', 
          'Configure Shopify API credentials for production');
      }
    }
  }

  /**
   * Add validation error
   */
  private addError(category: ValidationError['category'], field: string, message: string, resolution: string, critical: boolean): void {
    this.errors.push({
      category,
      field,
      message,
      resolution,
      critical,
    });
  }

  /**
   * Add validation warning
   */
  private addWarning(category: ValidationWarning['category'], field: string, message: string, recommendation: string): void {
    this.warnings.push({
      category,
      field,
      message,
      recommendation,
    });
  }

  /**
   * Log validation results
   */
  private logValidationResults(result: ValidationResult): void {
    const { summary, errors, warnings } = result;
    
    console.log(`\\n📊 Validation Summary (${summary.environment}):`);
    console.log(`   Total Checks: ${summary.totalChecks}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Errors: ${summary.errors}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    
    // Log critical errors
    const criticalErrors = errors.filter(e => e.critical);
    if (criticalErrors.length > 0) {
      console.log('\\n🚨 Critical Errors (will prevent startup):');
      criticalErrors.forEach(error => {
        console.log(`   ❌ [${error.category.toUpperCase()}] ${error.field}: ${error.message}`);
        console.log(`      💡 Resolution: ${error.resolution}`);
      });
    }
    
    // Log non-critical errors
    const nonCriticalErrors = errors.filter(e => !e.critical);
    if (nonCriticalErrors.length > 0) {
      console.log('\\n⚠️  Non-Critical Errors:');
      nonCriticalErrors.forEach(error => {
        console.log(`   ❌ [${error.category.toUpperCase()}] ${error.field}: ${error.message}`);
        console.log(`      💡 Resolution: ${error.resolution}`);
      });
    }
    
    // Log warnings
    if (warnings.length > 0) {
      console.log('\\n💡 Warnings & Recommendations:');
      warnings.forEach(warning => {
        console.log(`   ⚠️  [${warning.category.toUpperCase()}] ${warning.field}: ${warning.message}`);
        console.log(`      💡 Recommendation: ${warning.recommendation}`);
      });
    }
    
    if (result.valid) {
      console.log('\\n✅ Startup validation completed successfully!');
    } else {
      console.log('\\n❌ Startup validation failed - see errors above');
      if (config.isProduction) {
        console.log('🚨 Production environment - application will not start with critical errors');
      } else {
        console.log('🔧 Development environment - application may continue with warnings');
      }
    }
  }
}

/**
 * Export singleton validator instance
 */
export const startupValidator = new StartupValidator();

/**
 * Quick validation for health checks
 */
export async function quickValidation(): Promise<{ 
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: number;
  environment: string;
}> {
  try {
    const result = await startupValidator.validate();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const criticalErrors = result.errors.filter(e => e.critical).length;
    
    if (criticalErrors > 0) {
      status = 'unhealthy';
    } else if (result.errors.length > 0 || result.warnings.length > 0) {
      status = 'degraded';
    }
    
    return {
      status,
      issues: result.errors.length + result.warnings.length,
      environment: config.environment,
    };
  } catch (validationError) {
    console.error('Validation error:', validationError);
    return {
      status: 'unhealthy',
      issues: 1,
      environment: config.environment,
    };
  }
}

// Export interfaces are already declared above, no need for separate type exports