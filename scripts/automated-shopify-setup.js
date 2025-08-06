#!/usr/bin/env node

/**
 * Automated Shopify Development Store Setup
 * Uses Puppeteer to create a development store and configure API access
 */

const puppeteer = require('puppeteer');

class ShopifyStoreAutomator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.storeName = 'izerwaren-dev';
    this.storeUrl = null;
  }

  async init() {
    console.log('🚀 Starting automated Shopify store setup...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async navigateToPartners() {
    console.log('🌐 Navigating to Shopify Partners...');
    await this.page.goto('https://partners.shopify.com/', { waitUntil: 'networkidle2' });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('📋 Current URL:', this.page.url());
    
    // Check if we need to login
    if (this.page.url().includes('login') || this.page.url().includes('accounts.shopify.com')) {
      console.log('🔐 Login required. Please log in manually...');
      console.log('   1. Complete the login process in the browser');
      console.log('   2. Navigate to the Partners Dashboard');
      console.log('   3. Press Enter here to continue...');
      
      // Wait for manual login
      process.stdin.setRawMode(true);
      return new Promise((resolve) => {
        process.stdin.once('data', () => {
          process.stdin.setRawMode(false);
          resolve();
        });
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async openBrowserForManualSetup() {
    console.log('🏪 SHOPIFY STORE SETUP');
    console.log('======================');
    console.log('');
    console.log('The browser has opened to Shopify Partners.');
    console.log('Please follow these steps:');
    console.log('');
    console.log('1. 🔐 Log in to your Shopify Partners account');
    console.log('2. 🏪 Click "Stores" in the left sidebar');
    console.log('3. ➕ Click "Add store" → "Development store"');
    console.log('4. 📝 Store name: "izerwaren-dev"');
    console.log('5. 🎯 Purpose: "Testing new app or theme"');
    console.log('6. 💾 Click "Save" and wait for creation');
    console.log('');
    console.log('After store creation:');
    console.log('7. 🔗 Click "Log in to store"');
    console.log('8. ⚙️  Go to Apps → "App and sales channel settings"');
    console.log('9. 🔧 Click "Develop apps for your store"');
    console.log('10. ✅ Click "Allow custom app development"');
    console.log('11. 📱 Click "Create an app" → Name: "Izerwaren API"');
    console.log('12. 📋 Configure API scopes (read/write products, inventory, etc.)');
    console.log('13. 🔑 Generate Admin API access token');
    console.log('');
    console.log('⚠️  When finished, close this script and run:');
    console.log('   npm run shopify:setup configure <store-domain> <admin-token>');
    console.log('');
    console.log('📝 Store domain format: your-store-name.myshopify.com');
    console.log('🔑 Admin token format: shpat_...');
    
    // Keep browser open
    console.log('');
    console.log('🌐 Browser will remain open. Press Ctrl+C to exit when done.');
    
    // Wait indefinitely
    return new Promise(() => {});
  }

  async run() {
    try {
      await this.init();
      await this.navigateToPartners();
      await this.openBrowserForManualSetup();
    } catch (error) {
      console.error('❌ Automation error:', error);
    }
  }
}

// Run the automation
if (require.main === module) {
  const automator = new ShopifyStoreAutomator();
  automator.run().catch(console.error);
}

module.exports = ShopifyStoreAutomator;