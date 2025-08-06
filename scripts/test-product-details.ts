#!/usr/bin/env tsx

/**
 * Test Product Details Enhancement
 * 
 * Tests the enhanced product detail pages with multiple images, PDFs, and technical specs
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function testProductDetail(sku: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    console.log(`🔍 Testing product: ${sku}`);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/products?sku=${sku}&limit=1`);
    const data = await response.json();
    
    if (!response.ok || !data.data || data.data.length === 0) {
      results.push({
        test: `Product API - ${sku}`,
        status: 'FAIL',
        message: 'Product not found or API error'
      });
      return results;
    }
    
    const product = data.data[0];
    
    // Test 1: Dynamic product loading
    results.push({
      test: 'Dynamic Product Loading',
      status: product.sku === sku ? 'PASS' : 'FAIL',
      message: product.sku === sku 
        ? `Correct product: ${product.title} (${product.sku})`
        : `Wrong product: Expected ${sku}, got ${product.sku}`,
      details: { title: product.title, sku: product.sku }
    });
    
    // Test 2: Multiple images
    const imageCount = product.images?.length || 0;
    results.push({
      test: 'Multiple Images',
      status: imageCount > 1 ? 'PASS' : imageCount === 1 ? 'WARN' : 'FAIL',
      message: `${imageCount} images available`,
      details: { 
        imageCount,
        primaryImage: product.images?.find((img: any) => img.isPrimary)?.imageUrl || 'None'
      }
    });
    
    // Test 3: Technical specifications
    const specCount = product.technicalSpecs?.length || 0;
    results.push({
      test: 'Technical Specifications',
      status: specCount > 0 ? 'PASS' : 'WARN',
      message: `${specCount} technical specifications`,
      details: { 
        specCount,
        categories: [...new Set(product.technicalSpecs?.map((spec: any) => spec.category) || [])]
      }
    });
    
    // Test 4: PDF catalogs
    const pdfCount = product.catalogs?.length || 0;
    results.push({
      test: 'PDF Catalogs',
      status: pdfCount > 0 ? 'PASS' : 'WARN',
      message: `${pdfCount} PDF catalogs available`,
      details: { 
        pdfCount,
        totalSize: product.catalogs?.reduce((sum: number, cat: any) => sum + (cat.fileSize || 0), 0) || 0
      }
    });
    
    // Test 5: Shopify variants (for cart integration)
    const variantCount = product.shopifyVariants?.length || 0;
    results.push({
      test: 'Shopify Variants',
      status: variantCount > 0 ? 'PASS' : 'WARN',
      message: `${variantCount} Shopify variants for cart integration`,
      details: { 
        variantCount,
        hasVariantIds: product.shopifyVariants?.some((v: any) => v.id) || false
      }
    });
    
  } catch (error) {
    results.push({
      test: `Product API - ${sku}`,
      status: 'FAIL',
      message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  
  return results;
}

async function testFrontendAccess(): Promise<TestResult> {
  try {
    const response = await fetch('http://localhost:3000/product/IZW-0944');
    
    return {
      test: 'Frontend Product Page Access',
      status: response.ok ? 'PASS' : 'FAIL',
      message: response.ok 
        ? `Product page accessible (${response.status})`
        : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    return {
      test: 'Frontend Product Page Access',
      status: 'FAIL',
      message: `Cannot reach frontend: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function main() {
  console.log('🧪 Testing Product Details Enhancement\n');
  
  // Test multiple products with different characteristics
  const testProducts = [
    'IZW-0944', // Product with PDF
    'IZW-0948', // Product with multiple images
    'IZW-0950', // Original test product
  ];
  
  let allResults: TestResult[] = [];
  
  for (const sku of testProducts) {
    const results = await testProductDetail(sku);
    allResults = allResults.concat(results);
    console.log(`\n📋 Results for ${sku}:`);
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      console.log(`  ${icon} ${result.test}: ${result.message}`);
      if (result.details) {
        console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
  }
  
  // Test frontend access
  console.log('\n🌐 Testing Frontend Access:');
  const frontendResult = await testFrontendAccess();
  const icon = frontendResult.status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} ${frontendResult.test}: ${frontendResult.message}`);
  allResults.push(frontendResult);
  
  // Summary
  const passCount = allResults.filter(r => r.status === 'PASS').length;
  const warnCount = allResults.filter(r => r.status === 'WARN').length;
  const failCount = allResults.filter(r => r.status === 'FAIL').length;
  
  console.log(`\n📊 Overall Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
  
  if (failCount === 0) {
    console.log('\n🎉 Product details enhancement tests completed successfully!');
    console.log('\n📱 Manual testing URLs:');
    testProducts.forEach(sku => {
      console.log(`   • http://localhost:3000/product/${sku}`);
    });
    console.log('\n✨ Features to test manually:');
    console.log('   • Image gallery navigation');
    console.log('   • Technical specifications toggle');
    console.log('   • PDF view/download buttons');
    console.log('   • Add to cart functionality');
    console.log('   • Cart icon updates');
  } else {
    console.log('\n🔧 Issues found that need attention:');
    allResults.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   • ${result.test}: ${result.message}`);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}