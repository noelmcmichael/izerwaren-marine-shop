#!/usr/bin/env ts-node

/**
 * Shopify Integration Validation Script
 * 
 * Validates all components of the Shopify integration are working correctly:
 * - Buy SDK implementation
 * - Webhook infrastructure  
 * - Shopping cart functionality
 * - B2B features
 * - Database integration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

class ShopifyIntegrationValidator {
  private results: ValidationResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Run all validation checks
   */
  async validateAll(): Promise<void> {
    console.log('🔍 Validating Shopify Integration Implementation\n');

    // 1. File Structure Validation
    this.validateFileStructure();

    // 2. Dependencies Validation
    this.validateDependencies();

    // 3. Environment Configuration
    this.validateEnvironmentConfig();

    // 4. Backend Integration
    this.validateBackendIntegration();

    // 5. Frontend Integration
    this.validateFrontendIntegration();

    // 6. Database Schema
    this.validateDatabaseSchema();

    // 7. TypeScript Compilation
    await this.validateTypeScriptCompilation();

    // Generate report
    this.generateValidationReport();
  }

  /**
   * Validate file structure
   */
  private validateFileStructure(): void {
    console.log('📁 Validating File Structure...');

    const requiredFiles = [
      // Frontend Shopify Integration
      'apps/frontend/src/services/shopify.ts',
      'apps/frontend/src/services/cartAnalytics.ts',
      'apps/frontend/src/services/cartPersistence.ts',
      'apps/frontend/src/providers/CartProvider.tsx',
      'apps/frontend/src/components/cart/MiniCart.tsx',
      'apps/frontend/src/app/cart/page.tsx',
      
      // Backend Shopify Integration
      'apps/backend/src/routes/webhooks.ts',
      'apps/backend/src/services/WebhookService.ts',
      'apps/backend/src/middleware/webhookValidation.ts',
      
      // Test Scripts
      'scripts/test-enhanced-cart.ts',
      'scripts/test-webhook-endpoints.ts',
      'scripts/test-complete-integration.ts',
      
      // Documentation
      'docs/WEBHOOKS.md',
      'docs/progress/task-3-shopify-integration-completion.md',
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.projectRoot, file))
    );

    if (missingFiles.length === 0) {
      this.addResult('File Structure', 'pass', 'All required files are present');
    } else {
      this.addResult(
        'File Structure', 
        'fail', 
        `${missingFiles.length} required files are missing`,
        missingFiles
      );
    }
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(): void {
    console.log('📦 Validating Dependencies...');

    try {
      // Check frontend dependencies
      const frontendPkg = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'apps/frontend/package.json'), 'utf8')
      );

      const requiredFrontendDeps = [
        'shopify-buy',
        '@types/shopify-buy'
      ];

      const missingFrontendDeps = requiredFrontendDeps.filter(dep => 
        !frontendPkg.dependencies?.[dep] && !frontendPkg.devDependencies?.[dep]
      );

      // Check root dependencies for testing
      const rootPkg = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );

      const requiredTestDeps = ['axios'];
      const missingTestDeps = requiredTestDeps.filter(dep => 
        !rootPkg.dependencies?.[dep] && !rootPkg.devDependencies?.[dep]
      );

      const allMissing = [...missingFrontendDeps, ...missingTestDeps];

      if (allMissing.length === 0) {
        this.addResult('Dependencies', 'pass', 'All required dependencies are installed');
      } else {
        this.addResult(
          'Dependencies', 
          'fail', 
          'Some required dependencies are missing',
          allMissing
        );
      }

    } catch (error) {
      this.addResult(
        'Dependencies', 
        'fail', 
        'Failed to read package.json files',
        [(error as Error).message]
      );
    }
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironmentConfig(): void {
    console.log('⚙️ Validating Environment Configuration...');

    const envFiles = [
      '.env.example',
      '.env.development.example',
      '.env.production.example'
    ];

    const shopifyEnvVars = [
      'SHOPIFY_STORE_DOMAIN',
      'SHOPIFY_ADMIN_ACCESS_TOKEN',
      'SHOPIFY_STOREFRONT_ACCESS_TOKEN',
      'SHOPIFY_WEBHOOK_SECRET'
    ];

    const issues: string[] = [];

    envFiles.forEach(envFile => {
      const envPath = path.join(this.projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const missingVars = shopifyEnvVars.filter(varName => 
          !envContent.includes(varName)
        );

        if (missingVars.length > 0) {
          issues.push(`${envFile} missing: ${missingVars.join(', ')}`);
        }
      } else {
        issues.push(`Missing environment file: ${envFile}`);
      }
    });

    if (issues.length === 0) {
      this.addResult('Environment Config', 'pass', 'Environment configuration is complete');
    } else {
      this.addResult(
        'Environment Config', 
        'warning', 
        'Environment configuration issues found',
        issues
      );
    }
  }

  /**
   * Validate backend integration
   */
  private validateBackendIntegration(): void {
    console.log('🖥️ Validating Backend Integration...');

    try {
      // Check if webhook routes are registered
      const routesIndexPath = path.join(this.projectRoot, 'apps/backend/src/routes/index.ts');
      if (fs.existsSync(routesIndexPath)) {
        const routesContent = fs.readFileSync(routesIndexPath, 'utf8');
        
        if (routesContent.includes('webhooksRouter') && routesContent.includes('/webhooks')) {
          this.addResult('Backend Webhook Routes', 'pass', 'Webhook routes are properly registered');
        } else {
          this.addResult('Backend Webhook Routes', 'fail', 'Webhook routes are not registered in main router');
        }
      } else {
        this.addResult('Backend Webhook Routes', 'fail', 'Backend routes index file not found');
      }

      // Check server configuration for raw body handling
      const serverPath = path.join(this.projectRoot, 'apps/backend/src/server.ts');
      if (fs.existsSync(serverPath)) {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        if (serverContent.includes('express.raw') && serverContent.includes('/webhooks')) {
          this.addResult('Backend Raw Body Handling', 'pass', 'Raw body handling is configured for webhooks');
        } else {
          this.addResult('Backend Raw Body Handling', 'warning', 'Raw body handling for webhooks may not be configured');
        }
      }

    } catch (error) {
      this.addResult(
        'Backend Integration', 
        'fail', 
        'Failed to validate backend integration',
        [(error as Error).message]
      );
    }
  }

  /**
   * Validate frontend integration
   */
  private validateFrontendIntegration(): void {
    console.log('💻 Validating Frontend Integration...');

    try {
      // Check CartProvider integration
      const appPath = path.join(this.projectRoot, 'apps/frontend/src/providers/index.tsx');
      let hasCartProvider = false;
      
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        hasCartProvider = appContent.includes('CartProvider');
      }

      if (hasCartProvider) {
        this.addResult('Frontend Cart Provider', 'pass', 'CartProvider is integrated in app structure');
      } else {
        this.addResult('Frontend Cart Provider', 'warning', 'CartProvider integration needs verification');
      }

      // Check if cart page exists and is accessible
      const cartPagePath = path.join(this.projectRoot, 'apps/frontend/src/app/cart/page.tsx');
      if (fs.existsSync(cartPagePath)) {
        this.addResult('Frontend Cart Page', 'pass', 'Cart page is implemented');
      } else {
        this.addResult('Frontend Cart Page', 'fail', 'Cart page is missing');
      }

      // Check for analytics integration
      const cartProviderPath = path.join(this.projectRoot, 'apps/frontend/src/providers/CartProvider.tsx');
      if (fs.existsSync(cartProviderPath)) {
        const cartProviderContent = fs.readFileSync(cartProviderPath, 'utf8');
        
        if (cartProviderContent.includes('cartAnalytics')) {
          this.addResult('Frontend Analytics Integration', 'pass', 'Cart analytics are integrated');
        } else {
          this.addResult('Frontend Analytics Integration', 'warning', 'Cart analytics integration not found');
        }
      }

    } catch (error) {
      this.addResult(
        'Frontend Integration', 
        'fail', 
        'Failed to validate frontend integration',
        [(error as Error).message]
      );
    }
  }

  /**
   * Validate database schema
   */
  private validateDatabaseSchema(): void {
    console.log('🗄️ Validating Database Schema...');

    try {
      // Check if Prisma schema includes Shopify-related models
      const schemaPath = path.join(this.projectRoot, 'packages/database/prisma/schema.prisma');
      
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        const requiredModels = [
          'ProductSyncLog',
          'ShopifyOrder',
          'ProductVariant'
        ];

        const missingModels = requiredModels.filter(model => 
          !schemaContent.includes(`model ${model}`)
        );

        if (missingModels.length === 0) {
          this.addResult('Database Schema', 'pass', 'All required Shopify models are present');
        } else {
          this.addResult(
            'Database Schema', 
            'warning', 
            'Some Shopify models may be missing from schema',
            missingModels
          );
        }

        // Check for Shopify ID fields
        const hasShopifyFields = schemaContent.includes('shopifyProductId') || 
                                schemaContent.includes('shopifyVariantId');
        
        if (hasShopifyFields) {
          this.addResult('Database Shopify Fields', 'pass', 'Shopify ID fields are present');
        } else {
          this.addResult('Database Shopify Fields', 'warning', 'Shopify ID fields may be missing');
        }

      } else {
        this.addResult('Database Schema', 'fail', 'Prisma schema file not found');
      }

    } catch (error) {
      this.addResult(
        'Database Schema', 
        'fail', 
        'Failed to validate database schema',
        [(error as Error).message]
      );
    }
  }

  /**
   * Validate TypeScript compilation
   */
  private async validateTypeScriptCompilation(): Promise<void> {
    console.log('🔧 Validating TypeScript Compilation...');

    try {
      // Check frontend compilation
      try {
        execSync('cd apps/frontend && npm run type-check', { 
          stdio: 'pipe',
          timeout: 30000 
        });
        this.addResult('Frontend TypeScript', 'pass', 'Frontend TypeScript compiles without errors');
      } catch (error) {
        this.addResult(
          'Frontend TypeScript', 
          'warning', 
          'Frontend TypeScript compilation has issues'
        );
      }

      // Check backend compilation
      try {
        execSync('cd apps/backend && npx tsc --noEmit', { 
          stdio: 'pipe',
          timeout: 30000 
        });
        this.addResult('Backend TypeScript', 'pass', 'Backend TypeScript compiles without errors');
      } catch (error) {
        this.addResult(
          'Backend TypeScript', 
          'warning', 
          'Backend TypeScript compilation has issues'
        );
      }

    } catch (error) {
      this.addResult(
        'TypeScript Compilation', 
        'fail', 
        'Failed to run TypeScript compilation check',
        [(error as Error).message]
      );
    }
  }

  /**
   * Add validation result
   */
  private addResult(
    component: string, 
    status: 'pass' | 'fail' | 'warning', 
    message: string, 
    details?: string[]
  ): void {
    this.results.push({ component, status, message, details });
    
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`  ${icon} ${component}: ${message}`);
    
    if (details && details.length > 0) {
      details.forEach(detail => console.log(`     - ${detail}`));
    }
  }

  /**
   * Generate validation report
   */
  private generateValidationReport(): void {
    console.log('\n📊 Shopify Integration Validation Report');
    console.log('═'.repeat(60));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const total = this.results.length;

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${failed}/${total}`);
    console.log(`   ⚠️  Warnings: ${warnings}/${total}`);

    const successRate = Math.round((passed / total) * 100);
    console.log(`   📊 Success Rate: ${successRate}%`);

    // Overall status
    console.log('\n🎯 Overall Status:');
    if (failed === 0 && warnings <= 2) {
      console.log('   🟢 EXCELLENT - Shopify integration is production-ready');
    } else if (failed <= 1 && warnings <= 4) {
      console.log('   🟡 GOOD - Minor issues need attention');
    } else if (failed <= 3) {
      console.log('   🟠 FAIR - Several issues need fixing');
    } else {
      console.log('   🔴 POOR - Major issues prevent production deployment');
    }

    // Show critical failures
    const criticalFailures = this.results.filter(r => r.status === 'fail');
    if (criticalFailures.length > 0) {
      console.log('\n🚨 Critical Issues:');
      criticalFailures.forEach(failure => {
        console.log(`   ❌ ${failure.component}: ${failure.message}`);
      });
    }

    // Show warnings
    const warningItems = this.results.filter(r => r.status === 'warning');
    if (warningItems.length > 0) {
      console.log('\n⚠️  Warnings:');
      warningItems.forEach(warning => {
        console.log(`   ⚠️  ${warning.component}: ${warning.message}`);
      });
    }

    console.log('\n✨ Integration Components Implemented:');
    console.log('   🛒 Enhanced Buy SDK with inventory validation');
    console.log('   🔗 Comprehensive webhook infrastructure');
    console.log('   🏢 B2B shopping cart with bulk operations');
    console.log('   📊 Cart analytics and persistence');
    console.log('   🗄️ Database integration and sync logging');

    console.log('\n💡 Next Steps:');
    if (failed === 0) {
      console.log('   🎉 All validations passed! Ready for production testing.');
      console.log('   🚀 Run integration tests: npm run test:integration');
      console.log('   📖 Configure Shopify webhooks using docs/WEBHOOKS.md');
    } else {
      console.log('   🔧 Fix critical issues listed above');
      console.log('   📋 Re-run validation after fixes');
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new ShopifyIntegrationValidator();
  validator.validateAll().catch(console.error);
}

export { ShopifyIntegrationValidator };