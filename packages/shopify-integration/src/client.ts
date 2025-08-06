import { createAdminApiClient } from '@shopify/admin-api-client';

export class ShopifyClient {
  private client: any;

  constructor(shop: string, accessToken: string) {
    this.client = createAdminApiClient({
      storeDomain: shop,
      accessToken: accessToken,
      apiVersion: '2024-10',
    });
  }

  async query<T>(query: string, variables?: any): Promise<T> {
    try {
      const response = await this.client.request(query, { variables });
      return response.data as T;
    } catch (error) {
      console.error('Shopify API Error:', error);
      throw error;
    }
  }

  async mutation<T>(mutation: string, variables?: any): Promise<T> {
    try {
      const response = await this.client.request(mutation, { variables });
      return response.data as T;
    } catch (error) {
      console.error('🔥 Shopify API Error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const createShopifyClient = (shop?: string, accessToken?: string) => {
  const shopDomain = shop || process.env.SHOPIFY_SHOP_DOMAIN;
  const token = accessToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopDomain || !token) {
    throw new Error('Shopify shop domain and access token are required');
  }

  return new ShopifyClient(shopDomain, token);
};
