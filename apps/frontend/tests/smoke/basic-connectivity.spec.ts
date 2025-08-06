import { test, expect } from '@playwright/test';

/**
 * Basic Connectivity Test
 * 
 * Simple test to verify the test framework is working and the application is accessible
 */

test.describe('Basic Connectivity', () => {

  test('Application is accessible', async ({ page }) => {
    console.log('Testing basic connectivity...');
    
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    console.log(`Base URL: ${baseURL}`);
    
    // Navigate to the application
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Verify response is ok
    expect(response).toBeTruthy();
    expect(response!.ok()).toBeTruthy();
    
    // Verify page title contains expected text
    const title = await page.title();
    expect(title).toContain('Izerwaren');
    
    console.log(`✅ Page title: ${title}`);
  });

  test('Health check endpoint is accessible', async ({ page }) => {
    console.log('Testing health check endpoint...');
    
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    const response = await page.request.get(`${baseURL}/api/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData).toHaveProperty('correlationId');
    
    console.log(`✅ Health status: ${healthData.status}`);
    console.log(`✅ Correlation ID: ${healthData.correlationId}`);
  });

});