/**
 * Direct Shopify Integration Service
 * 
 * Connects directly to Shopify Storefront API to pull live marine hardware data
 * Bypasses backend issues and demonstrates real business value immediately
 */

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  images: Array<{
    url: string;
    altText?: string;
  }>;
  variants: Array<{
    id: string;
    sku?: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    availableForSale: boolean;
  }>;
}

interface ShopifyResponse {
  data: {
    products: {
      edges: Array<{
        node: ShopifyProduct;
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

class ShopifyDirectService {
  private readonly storeDomain: string;
  private readonly storefrontToken: string;

  constructor() {
    this.storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'izerw-marine.myshopify.com';
    this.storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';

    if (!this.storefrontToken) {
      console.warn('⚠️ Shopify Storefront token not configured');
    }
  }

  /**
   * Test connection to Shopify
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const query = `
        query {
          shop {
            name
            description
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);
      
      if (response.errors) {
        return { success: false, error: response.errors[0]?.message || 'GraphQL error' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Fetch products directly from Shopify
   */
  async getProducts(first: number = 20, after?: string): Promise<{
    products: ShopifyProduct[];
    hasNextPage: boolean;
    cursor?: string;
  }> {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              description
              handle
              vendor
              productType
              tags
              images(first: 3) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    sku
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = { first, ...(after && { after }) };
    const response = await this.makeGraphQLRequest(query, variables);

    if (response.errors) {
      throw new Error(`Shopify GraphQL error: ${response.errors[0]?.message}`);
    }

    const products = response.data.products.edges.map((edge: any) => ({
      ...edge.node,
      images: edge.node.images.edges.map((img: any) => img.node),
      variants: edge.node.variants.edges.map((variant: any) => variant.node),
    }));

    return {
      products,
      hasNextPage: response.data.products.pageInfo.hasNextPage,
      cursor: response.data.products.pageInfo.endCursor,
    };
  }

  /**
   * Search products by query
   */
  async searchProducts(searchQuery: string, first: number = 20): Promise<{
    products: ShopifyProduct[];
    hasNextPage: boolean;
  }> {
    const query = `
      query searchProducts($query: String!, $first: Int!) {
        products(query: $query, first: $first) {
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              id
              title
              description
              handle
              vendor
              productType
              tags
              images(first: 3) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    sku
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = { query: searchQuery, first };
    const response = await this.makeGraphQLRequest(query, variables);

    if (response.errors) {
      throw new Error(`Shopify search error: ${response.errors[0]?.message}`);
    }

    const products = response.data.products.edges.map((edge: any) => ({
      ...edge.node,
      images: edge.node.images.edges.map((img: any) => img.node),
      variants: edge.node.variants.edges.map((variant: any) => variant.node),
    }));

    return {
      products,
      hasNextPage: response.data.products.pageInfo.hasNextPage,
    };
  }

  /**
   * Get products by product type (category)
   */
  async getProductsByType(productType: string, first: number = 20): Promise<{
    products: ShopifyProduct[];
    hasNextPage: boolean;
  }> {
    const searchQuery = `product_type:"${productType}"`;
    return this.searchProducts(searchQuery, first);
  }

  /**
   * Get featured products (highest priced items from different categories)
   */
  async getFeaturedProducts(): Promise<ShopifyProduct[]> {
    try {
      // Get a diverse set of products by searching for different marine categories
      const categories = ['locks', 'hinges', 'hardware', 'marine'];
      const featuredProducts: ShopifyProduct[] = [];

      for (const category of categories) {
        try {
          const result = await this.searchProducts(category, 3);
          if (result.products.length > 0) {
            // Take the first product from each category
            featuredProducts.push(result.products[0]);
          }
        } catch (error) {
          console.warn(`Failed to fetch ${category} products:`, error);
        }
      }

      // If we don't have enough featured products, get some general ones
      if (featuredProducts.length < 3) {
        const general = await this.getProducts(6);
        featuredProducts.push(...general.products.slice(0, 3 - featuredProducts.length));
      }

      return featuredProducts.slice(0, 3);
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }
  }

  /**
   * Make GraphQL request to Shopify
   */
  private async makeGraphQLRequest(query: string, variables?: any): Promise<ShopifyResponse> {
    if (!this.storefrontToken) {
      throw new Error('Shopify Storefront access token not configured');
    }

    const response = await fetch(`https://${this.storeDomain}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': this.storefrontToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transform Shopify product to our internal format
   */
  transformProduct(shopifyProduct: ShopifyProduct) {
    const variant = shopifyProduct.variants?.[0];
    const image = shopifyProduct.images?.[0];

    return {
      id: parseInt(shopifyProduct.id.replace('gid://shopify/Product/', ''), 10),
      title: shopifyProduct.title,
      description: shopifyProduct.description || '',
      price: variant ? parseFloat(variant.price.amount) : 0,
      category_name: shopifyProduct.productType || 'Marine Hardware',
      manufacturer: shopifyProduct.vendor || 'Unknown',
      sku: variant?.sku || '',
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date(),
      shopify_handle: shopifyProduct.handle,
      shopify_id: shopifyProduct.id,
      tags: shopifyProduct.tags,
      available_for_sale: variant?.availableForSale || false,
      primary_image: image ? {
        id: 0,
        local_product_id: parseInt(shopifyProduct.id.replace('gid://shopify/Product/', ''), 10),
        asset_type: 'primary' as const,
        storage_tier: 'shopify' as const,
        file_url: image.url,
        mime_type: 'image/jpeg',
        created_at: new Date(),
        updated_at: new Date(),
      } : undefined,
    };
  }
}

// Create singleton instance
export const shopifyDirectService = new ShopifyDirectService();
export default shopifyDirectService;

// Type exports
export type { ShopifyProduct };