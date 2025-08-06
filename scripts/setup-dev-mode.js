#!/usr/bin/env node

/**
 * Development Mode Setup - Skip Firebase Auth
 * Configure the app to work without external services for testing
 */

const fs = require('fs');
const path = require('path');

function setupDevMode() {
  console.log('🚀 Setting up Development Mode (No External Services Required)');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Set development mode flags
  const devConfig = {
    // Enable development mode
    NEXT_PUBLIC_ENVIRONMENT: 'development',
    DEV_MODE: 'true',
    SKIP_FIREBASE_AUTH: 'true',

    // Mock Firebase config (won't be used but prevents errors)
    FIREBASE_PROJECT_ID: 'dev-mode',
    FIREBASE_CLIENT_EMAIL: 'dev@example.com',
    FIREBASE_PRIVATE_KEY: 'dev-key',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'dev-mode',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'dev-api-key',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'dev-app-id',

    // Mock Shopify config (for API testing)
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: 'dev-store.myshopify.com',
    SHOPIFY_ADMIN_ACCESS_TOKEN: 'dev-token',
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'dev-storefront-token',
    SHOPIFY_WEBHOOK_SECRET: 'dev-webhook-secret',
  };

  // Update each config value
  Object.entries(devConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}="${value}"`;

    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  });

  fs.writeFileSync(envPath, envContent);

  console.log('✅ Development mode configured!');
  console.log('\n📋 What works in dev mode:');
  console.log('   • Database operations ✅');
  console.log('   • API endpoints ✅');
  console.log('   • Admin interface (auth bypassed) ✅');
  console.log('   • Health checks ✅');
  console.log('\n📋 What requires real services:');
  console.log('   • Firebase authentication ⚠️');
  console.log('   • Shopify product sync ⚠️');
  console.log('\n🎯 Next steps:');
  console.log('   npm run test:env     # Validate configuration');
  console.log('   npm run dev          # Start development server');
  console.log('   Visit: http://localhost:3000/admin/dashboard');
}

setupDevMode();
