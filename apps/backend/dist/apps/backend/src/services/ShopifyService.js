"use strict";
/**
 * Shopify Service
 *
 * Service layer for Shopify API interactions including Admin API and Storefront API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyService = void 0;
const shopify_api_1 = require("@shopify/shopify-api");
require("@shopify/shopify-api/adapters/node");
const config_1 = __importDefault(require("../lib/config"));
class ShopifyService {
    constructor() {
        this.isInitialized = false;
        this.initializeShopify();
    }
    initializeShopify() {
        try {
            if (!config_1.default.shopify.isConfigured) {
                console.warn('Shopify credentials not fully configured');
                return;
            }
            // Use configured hostname
            const hostname = config_1.default.isProduction
                ? config_1.default.server.baseUrl.replace('https://', '').replace('http://', '')
                : `${config_1.default.server.host}:${config_1.default.server.port}`;
            this.shopify = (0, shopify_api_1.shopifyApi)({
                apiKey: 'dummy-api-key',
                apiSecretKey: 'dummy-secret-key',
                scopes: ['read_products', 'write_products', 'read_inventory', 'write_inventory'],
                hostName: hostname,
                apiVersion: shopify_api_1.ApiVersion.October23,
                isEmbeddedApp: false,
            });
            this.isInitialized = true;
            console.log('Shopify API initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Shopify API:', error);
            this.isInitialized = false;
        }
    }
    async testConnection() {
        const result = {
            connected: false,
            shop: config_1.default.shopify.normalizedDomain || 'not-configured',
            apiVersion: config_1.default.shopify.apiVersion,
            lastTested: new Date().toISOString(),
        };
        try {
            if (!config_1.default.shopify.isConfigured) {
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
            const response = await fetch(`https://${config_1.default.shopify.normalizedDomain}/admin/api/${config_1.default.shopify.apiVersion}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': config_1.default.shopify.adminAccessToken,
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
            }
            else {
                result.error = 'Invalid response from Shopify API';
            }
        }
        catch (error) {
            console.error('Shopify connection test failed:', error);
            result.error = error instanceof Error ? error.message : 'Unknown error';
        }
        return result;
    }
    async getProductCount() {
        try {
            if (!config_1.default.shopify.isConfigured) {
                throw new Error('Shopify API not configured');
            }
            // Use REST API for product count
            const response = await fetch(`https://${config_1.default.shopify.normalizedDomain}/admin/api/${config_1.default.shopify.apiVersion}/products/count.json`, {
                method: 'GET',
                headers: {
                    'X-Shopify-Access-Token': config_1.default.shopify.adminAccessToken,
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.count || 0;
        }
        catch (error) {
            console.error('Failed to get product count:', error);
            throw error;
        }
    }
    async getProducts(limit = 20, after) {
        try {
            if (!this.isInitialized || !config_1.default.shopify.isConfigured) {
                throw new Error('Shopify API not configured');
            }
            const client = new this.shopify.clients.Graphql({
                session: {
                    shop: config_1.default.shopify.normalizedDomain,
                    accessToken: config_1.default.shopify.adminAccessToken,
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
        }
        catch (error) {
            console.error('Failed to get products from Shopify:', error);
            throw error;
        }
    }
    isConfigured() {
        return this.isInitialized && config_1.default.shopify.isConfigured;
    }
    getConfiguration() {
        return {
            shopDomain: config_1.default.shopify.normalizedDomain || 'not-configured',
            hasAdminToken: !!config_1.default.shopify.adminAccessToken,
            hasWebhookSecret: !!config_1.default.shopify.webhookSecret,
            isInitialized: this.isInitialized,
        };
    }
}
exports.shopifyService = new ShopifyService();
exports.default = ShopifyService;
