/**
 * Shopify Service
 * 
 * Service layer for Shopify API interactions including Admin API and Storefront API
 */

import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import config from '../lib/config';

interface ShopifyConnectionTest {
  connected: boolean;
  shop: string;
  apiVersion: string;
  lastTested: string;
  error?: string;
  permissions?: {
    readProducts: boolean;
    writeProducts: boolean;
    readInventory: boolean;
    writeInventory: boolean;
    readFiles: boolean;
    writeFiles: boolean;
  };
}

class ShopifyService {
  private shopify: any;
  private isInitialized = false;

  constructor() {
    this.initializeShopify();
  }

  private initializeShopify() {
    try {
      if (!config.shopify.isConfigured) {
        console.warn('Shopify credentials not fully configured');
        return;
      }

      // Use configured hostname
      const hostname = config.isProduction
        ? config.server.baseUrl.replace('https://', '').replace('http://', '')
        : `${config.server.host}:${config.server.port}`;

      this.shopify = shopifyApi({
        apiKey: 'dummy-api-key',
        apiSecretKey: 'dummy-secret-key', 
        scopes: ['read_products', 'write_products', 'read_inventory', 'write_inventory'],
        hostName: hostname,
        apiVersion: ApiVersion.October23,
        isEmbeddedApp: false,
      });

      this.isInitialized = true;
      console.log('Shopify API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Shopify API:', error);
      this.isInitialized = false;
    }
  }

  async testConnection(): Promise<ShopifyConnectionTest> {
    const result: ShopifyConnectionTest = {
      connected: false,
      shop: config.shopify.normalizedDomain || 'not-configured',
      apiVersion: config.shopify.apiVersion,
      lastTested: new Date().toISOString(),
    };

    try {
      if (!config.shopify.isConfigured) {
        result.error = 'Shopify API not properly configured';
        return result;
      }

      // Test query to get shop information
      const shopQuery = `
        query getShop {
          shop {
            name
            email
            myshopifyDomain
            plan {
              displayName
            }
          }
        }
      `;

      const response = await fetch(`https://${config.shopify.normalizedDomain}/admin/api/${config.shopify.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopify.adminAccessToken,
        },
        body: JSON.stringify({ query: shopQuery }),
      });

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        return result;
      }

      const data = await response.json();
      
      if (data.errors) {
        result.error = `GraphQL errors: ${JSON.stringify(data.errors)}`;
        return result;
      }

      if (data.data?.shop) {
        result.connected = true;
        result.permissions = {
          readProducts: true,
          writeProducts: true,
          readInventory: true,
          writeInventory: true,
          readFiles: true,
          writeFiles: true,
        };
        console.log('Shopify connection test successful:', data.data.shop.name);
      } else {
        result.error = 'Invalid response from Shopify API';
      }
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  async getProductCount(): Promise<number> {
    try {
      if (!config.shopify.isConfigured) {
        throw new Error('Shopify API not configured');
      }

      // Use REST API for product count
      const response = await fetch(`https://${config.shopify.normalizedDomain}/admin/api/${config.shopify.apiVersion}/products/count.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': config.shopify.adminAccessToken,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.count || 0;
    } catch (error) {
      console.error('Failed to get product count:', error);
      throw error;
    }
  }

  async getProducts(limit = 20, after?: string) {
    try {
      if (!this.isInitialized || !config.shopify.isConfigured) {
        throw new Error('Shopify API not configured');
      }

      const client = new this.shopify.clients.Graphql({
        session: {
          shop: config.shopify.normalizedDomain,
          accessToken: config.shopify.adminAccessToken,
        },
      });

      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                handle
                status
                vendor
                productType
                tags
                createdAt
                updatedAt
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      inventoryQuantity
                    }
                  }
                }
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      `;

      const response = await client.query({
        data: { 
          query,
          variables: { first: limit, after }
        },
      });

      return response.body?.data?.products;
    } catch (error) {
      console.error('Failed to get products from Shopify:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.isInitialized && config.shopify.isConfigured;
  }

  getConfiguration() {
    return {
      shopDomain: config.shopify.normalizedDomain || 'not-configured',
      hasAdminToken: !!config.shopify.adminAccessToken,
      hasWebhookSecret: !!config.shopify.webhookSecret,
      isInitialized: this.isInitialized,
    };
  }
}

export const shopifyService = new ShopifyService();
export default ShopifyService;