#!/usr/bin/env node

/**
 * Interactive environment variable updater
 * Helps configure Firebase and Shopify credentials
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

async function updateFirebaseConfig() {
  console.log('\n🔥 Firebase Configuration');
  console.log('Copy values from Firebase Console → Project Settings\n');

  const config = {};

  // Server-side config (from service account JSON)
  config.FIREBASE_PROJECT_ID = await question('Firebase Project ID: ');
  config.FIREBASE_CLIENT_EMAIL = await question('Firebase Client Email: ');

  console.log('\nFor private key, paste the entire key including -----BEGIN/END----- lines:');
  const privateKey = await question('Firebase Private Key: ');
  config.FIREBASE_PRIVATE_KEY = `"${privateKey.replace(/\n/g, '\\n')}"`;

  // Client-side config (from web app config)
  console.log('\nFrom Firebase web app config object:');
  config.NEXT_PUBLIC_FIREBASE_PROJECT_ID = config.FIREBASE_PROJECT_ID;
  config.NEXT_PUBLIC_FIREBASE_API_KEY = await question('Firebase API Key: ');
  config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = await question(
    'Firebase Messaging Sender ID: '
  );
  config.NEXT_PUBLIC_FIREBASE_APP_ID = await question('Firebase App ID: ');

  return config;
}

async function updateShopifyConfig() {
  console.log('\n🛍️  Shopify Configuration');
  console.log('From your Shopify development store\n');

  const config = {};

  config.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = await question(
    'Shopify Store Domain (e.g., my-store.myshopify.com): '
  );
  config.SHOPIFY_ADMIN_ACCESS_TOKEN = await question('Shopify Admin Access Token: ');
  config.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN = await question(
    'Shopify Storefront Access Token: '
  );
  config.SHOPIFY_WEBHOOK_SECRET =
    (await question('Shopify Webhook Secret (optional, press Enter to skip): ')) || '';

  return config;
}

async function writeEnvFile(config) {
  const envPath = path.join(process.cwd(), '.env');

  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update each config value
  Object.entries(config).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;

      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }
  });

  // Write back to file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Environment file updated successfully!');
}

async function main() {
  console.log('🔧 Izerwaren 2.0 Environment Configuration');
  console.log('This script will help you configure external services.\n');

  const configType = (await question('Configure (f)irebase, (s)hopify, or (b)oth? [b]: ')) || 'b';

  const config = {};

  if (configType === 'f' || configType === 'b') {
    Object.assign(config, await updateFirebaseConfig());
  }

  if (configType === 's' || configType === 'b') {
    Object.assign(config, await updateShopifyConfig());
  }

  await writeEnvFile(config);

  console.log('\n🧪 Testing configuration...');

  rl.close();

  // Test the configuration
  const { spawn } = require('child_process');
  const test = spawn('npm', ['run', 'test:env'], { stdio: 'inherit' });

  test.on('close', code => {
    if (code === 0) {
      console.log('\n🎉 Configuration successful! You can now run:');
      console.log('   npm run dev');
    } else {
      console.log('\n⚠️  Configuration may need adjustment. Check the output above.');
    }
  });
}

main().catch(console.error);
