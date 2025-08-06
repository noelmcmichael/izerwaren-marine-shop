#!/usr/bin/env tsx

/**
 * Configure Storefront Token
 * 
 * Helper script to safely configure the Shopify Storefront API token
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const ENV_PATH = join(__dirname, '..', '.env');

async function promptForToken(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your Shopify Storefront API access token: ', (token) => {
      rl.close();
      resolve(token.trim());
    });
  });
}

function validateToken(token: string): boolean {
  // Basic validation - Storefront tokens are typically shorter than Admin tokens
  // and don't start with shpat_
  if (!token || token === 'dev-storefront-token') {
    console.log('❌ Invalid token - cannot be empty or placeholder');
    return false;
  }
  
  if (token.startsWith('shpat_')) {
    console.log('⚠️  Warning: This looks like an Admin API token, not a Storefront token');
    console.log('   Storefront tokens are typically shorter and don\'t start with shpat_');
    return false;
  }
  
  if (token.length < 10 || token.length > 100) {
    console.log('⚠️  Warning: Token length seems unusual for a Storefront token');
  }
  
  return true;
}

function updateEnvFile(token: string): void {
  try {
    const envContent = readFileSync(ENV_PATH, 'utf-8');
    
    // Replace the storefront token line
    const updatedContent = envContent.replace(
      /NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="[^"]*"/,
      `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="${token}"`
    );
    
    writeFileSync(ENV_PATH, updatedContent);
    console.log('✅ Environment file updated successfully');
  } catch (error) {
    console.error('❌ Failed to update environment file:', error);
    process.exit(1);
  }
}

async function testToken(token: string): Promise<boolean> {
  console.log('🧪 Testing token with Shopify API...');
  
  try {
    // Test with a simple GraphQL query to the Storefront API
    const query = `
      query {
        shop {
          name
          primaryDomain {
            host
          }
        }
      }
    `;
    
    const response = await fetch(`https://izerw-marine.myshopify.com/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.log('❌ GraphQL errors:', JSON.stringify(data.errors, null, 2));
      return false;
    }
    
    if (data.data?.shop) {
      console.log(`✅ Token valid! Connected to: ${data.data.shop.name}`);
      return true;
    } else {
      console.log('❌ Unexpected response format');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function main() {
  console.log('🔧 Shopify Storefront API Token Configuration\n');
  
  // Check if we're in the right directory
  try {
    readFileSync(ENV_PATH);
  } catch {
    console.error('❌ Cannot find .env file. Make sure you\'re in the project root directory.');
    process.exit(1);
  }
  
  console.log('This script will help you configure your Shopify Storefront API token.');
  console.log('To get a token, follow the guide at docs/shopify-api-setup-guide.md\n');
  
  const token = await promptForToken();
  
  if (!validateToken(token)) {
    console.log('\nPlease get a valid Storefront API token and try again.');
    process.exit(1);
  }
  
  const isValid = await testToken(token);
  
  if (!isValid) {
    console.log('\nToken test failed. Please check the token and try again.');
    process.exit(1);
  }
  
  updateEnvFile(token);
  
  console.log('\n🎉 Configuration complete!');
  console.log('\nNext steps:');
  console.log('1. Restart your development servers');
  console.log('2. Test the shopping cart functionality');
  console.log('3. Verify checkout URL generation');
  
  console.log('\nRestart commands:');
  console.log('npm run backend:dev');
  console.log('npm run frontend:dev');
}

if (require.main === module) {
  main().catch(console.error);
}

export { validateToken, testToken };