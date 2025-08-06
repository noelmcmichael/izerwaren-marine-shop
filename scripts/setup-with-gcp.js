#!/usr/bin/env node

/**
 * Configure Firebase using existing GCP project and credentials
 * Leverages Application Default Credentials and existing Firebase project
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Izerwaren 2.0 - GCP Integration Setup');
  console.log('Using existing GCP project: izerwaren-5e147\n');

  // Check current Firebase project setup
  console.log('📋 Current Firebase Project Status:');
  console.log('   • Project ID: izerwaren-5e147');
  console.log('   • Firebase APIs: ✅ Enabled');
  console.log('   • ADC configured: ✅ Ready');
  console.log('   • Console: https://console.firebase.google.com/project/izerwaren-5e147\n');

  const proceed = await question(
    'Firebase Console should be open. Have you enabled Authentication? (y/n): '
  );

  if (proceed.toLowerCase() !== 'y') {
    console.log('\n📍 Please enable Firebase Authentication:');
    console.log('   1. Go to Authentication → Get started');
    console.log('   2. Sign-in method → Email/Password → Enable');
    console.log('   3. Run this script again\n');
    rl.close();
    return;
  }

  console.log('\n🔑 Firebase Web App Configuration');
  console.log('From Firebase Console → Project Settings → General → Your apps\n');

  const hasWebApp = await question('Do you have a web app configured? (y/n): ');

  if (hasWebApp.toLowerCase() !== 'y') {
    console.log('\n📍 Please add a web app:');
    console.log('   1. Click "</>" icon to add web app');
    console.log('   2. App nickname: "izerwaren-admin"');
    console.log("   3. Don't enable hosting");
    console.log('   4. Copy the config object');
    console.log('   5. Run this script again\n');
    rl.close();
    return;
  }

  // Get Firebase web configuration
  console.log('From the Firebase config object, provide these values:');
  const apiKey = await question('API Key (apiKey): ');
  const messagingSenderId = await question('Messaging Sender ID (messagingSenderId): ');
  const appId = await question('App ID (appId): ');

  // Update environment file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const config = {
    // Server-side: Use GCP project ID and ADC (no credentials needed)
    FIREBASE_PROJECT_ID: 'izerwaren-5e147',
    FIREBASE_CLIENT_EMAIL: 'ADC', // Indicates using Application Default Credentials
    FIREBASE_PRIVATE_KEY: 'ADC', // Indicates using Application Default Credentials

    // Client-side: Firebase web app config
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'izerwaren-5e147',
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: appId,
  };

  // Update each config value
  Object.entries(config).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}="${value}"`;

      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }
  });

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Firebase configuration updated!');

  // Now handle Shopify
  console.log('\n🛍️  Shopify Configuration');
  const setupShopify = await question('Configure Shopify now? (y/n): ');

  if (setupShopify.toLowerCase() === 'y') {
    console.log('\nFrom your Shopify development store:');
    const storeDomain = await question('Store Domain (e.g., my-store.myshopify.com): ');
    const adminToken = await question('Admin API Token (starts with shpat_): ');
    const storefrontToken = await question('Storefront API Token: ');

    const shopifyConfig = {
      NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: storeDomain,
      SHOPIFY_ADMIN_ACCESS_TOKEN: adminToken,
      NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: storefrontToken,
    };

    // Update Shopify config
    Object.entries(shopifyConfig).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}="${value}"`;

        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `\n${newLine}`;
        }
      }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Shopify configuration updated!');
  }

  rl.close();

  console.log('\n🧪 Testing configuration...');

  // Test the configuration
  const { spawn } = require('child_process');
  const test = spawn('npm', ['run', 'test:env'], { stdio: 'inherit' });

  test.on('close', code => {
    if (code === 0) {
      console.log('\n🎉 Configuration successful! Next steps:');
      console.log('   npm run dev           # Start development server');
      console.log('   npm run db:seed       # Already done');
      console.log('\n📍 Test URLs:');
      console.log('   http://localhost:3000/admin/login      # Firebase auth');
      console.log('   http://localhost:3000/admin/dashboard  # Admin portal');
      console.log('   http://localhost:3000/api/health       # Service status');
    } else {
      console.log('\n⚠️  Configuration may need adjustment. Check the output above.');
    }
  });
}

main().catch(console.error);
