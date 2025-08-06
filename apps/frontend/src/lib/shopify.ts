import { shopifyApi, ApiVersion, LogSeverity, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { config } from './config';

// Lazy initialization to avoid build-time errors
let shopifyInstance: any = null;
let adminSessionInstance: Session | null = null;

function initializeShopify() {
  // Development mode bypass
  if (config.shopify.devMode) {
    console.log('🚧 Shopify API disabled in development mode');
    return { shopify: null, session: null };
  }

  if (!config.shopify.storeDomain) {
    throw new Error('Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN environment variable');
  }

  if (!config.shopify.adminAccessToken) {
    throw new Error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN environment variable');
  }

  if (shopifyInstance && adminSessionInstance) {
    return { shopify: shopifyInstance, session: adminSessionInstance };
  }

  const shopifyDomain = config.shopify.normalizedDomain;

  // Initialize Shopify API client
  shopifyInstance = shopifyApi({
    apiKey: 'not-needed-for-private-app',
    apiSecretKey: 'not-needed-for-private-app',
    scopes: ['read_products', 'write_products', 'read_customers', 'write_customers'],
    hostName: shopifyDomain,
    apiVersion: ApiVersion.October23,
    isEmbeddedApp: false,
    logger: {
      level: config.isDevelopment ? LogSeverity.Debug : LogSeverity.Warning,
    },
  });

  // Create a session object for API calls
  adminSessionInstance = new Session({
    id: 'admin-session',
    shop: shopifyDomain,
    state: 'admin',
    isOnline: false,
    accessToken: config.shopify.adminAccessToken,
    scope: 'read_products,write_products,read_customers,write_customers',
  });

  return { shopify: shopifyInstance, session: adminSessionInstance };
}

// Lazy-loaded clients
export function getAdminApiClient() {
  const { shopify, session } = initializeShopify();
  return new shopify.clients.Graphql({ session });
}

export function getAdminRestClient() {
  const { shopify, session } = initializeShopify();
  return new shopify.clients.Rest({ session });
}

// Rate limiter for API calls
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async consume(tokensNeeded: number = 1): Promise<void> {
    this.refill();

    if (this.tokens < tokensNeeded) {
      const waitTime = ((tokensNeeded - this.tokens) / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens -= tokensNeeded;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Shopify Admin API rate limiter (1000 requests per minute)
export const adminRateLimiter = new RateLimiter(1000, 1000 / 60);

// Helper types for product operations
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
  weight?: number;
  weightUnit?: string;
}

export interface ShopifyProductImage {
  id: string;
  url: string;
  altText?: string;
}

export interface BulkOperationResult {
  success: boolean;
  operationId?: string;
  errors: Array<{
    field: string[];
    message: string;
  }>;
}

// Shopify Admin GraphQL queries
export const PRODUCT_BULK_QUERY = `
  query {
    products(first: 250) {
      edges {
        node {
          id
          title
          handle
          vendor
          productType
          tags
          descriptionHtml
          status
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                weight
                weightUnit
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const PRODUCT_CREATE_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const BULK_OPERATION_QUERY = `
  query {
    currentBulkOperation {
      id
      status
      errorCode
      createdAt
      completedAt
      objectCount
      fileSize
      url
      partialDataUrl
    }
  }
`;
