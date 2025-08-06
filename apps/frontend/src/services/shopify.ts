import { config } from '../lib/config';
/**
 * Shopify Storefront API Service
 * 
 * Client-side service for interacting with Shopify Storefront API
 * Handles product fetching, cart management, and checkout
 */

import ShopifyBuy from 'shopify-buy';

// Environment variables
// Using centralized config for Shopify domain
// Using centralized config for Shopify token

interface ShopifyConfig {
  isConfigured: boolean;
  domain: string;
  hasToken: boolean;
}

interface CartItem {
  variantId: string;
  quantity: number;
  productTitle: string;
  variantTitle: string;
  price: string;
  sku: string;
  image?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  totalQuantity: number;
  checkoutUrl: string;
}

interface InventoryInfo {
  available: number;
  policy: 'DENY' | 'CONTINUE' | 'UNKNOWN';
  tracked: boolean;
}

interface AddToCartOptions {
  validateInventory?: boolean;
  maxQuantity?: number;
}

class ShopifyService {
  private client: ShopifyBuy.Client | null = null;
  private cart: ShopifyBuy.Cart | null = null;
  private isInitialized = false;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeClient();
    }
  }

  private initializeClient() {
    try {
      if (!config.shopify.storeDomain || !config.shopify.storefrontAccessToken) {
        console.warn('Shopify Storefront API credentials not configured');
        return;
      }

      if (config.shopify.storefrontAccessToken === 'dev-storefront-token') {
        console.warn('Using placeholder Storefront API token - checkout will not work');
        return;
      }

      this.client = ShopifyBuy.buildClient({
        domain: config.shopify.storeDomain,
        storefrontAccessToken: config.shopify.storefrontAccessToken,
      });

      this.isInitialized = true;
      // Shopify Storefront API client initialized successfully
    } catch (error) {
      console.error('Failed to initialize Shopify client:', error);
      this.isInitialized = false;
    }
  }

  getConfiguration(): ShopifyConfig {
    // Return safe config during SSR
    if (typeof window === 'undefined') {
      return {
        isConfigured: false,
        domain: 'ssr-mode',
        hasToken: false,
      };
    }
    
    return {
      isConfigured: this.isInitialized,
      domain: config.shopify.storeDomain || 'not-configured',
      hasToken: !!config.shopify.storefrontAccessToken && config.shopify.storefrontAccessToken !== 'dev-storefront-token',
    };
  }

  async getProducts(limit = 20): Promise<ShopifyBuy.Product[]> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const products = await this.client.product.fetchAll(limit);
      return products;
    } catch (error) {
      console.error('Failed to fetch products from Shopify:', error);
      throw error;
    }
  }

  async getProduct(handle: string): Promise<ShopifyBuy.Product | null> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const product = await this.client.product.fetchByHandle(handle);
      return product;
    } catch (error) {
      console.error(`Failed to fetch product ${handle}:`, error);
      return null;
    }
  }

  async getProductBySku(sku: string): Promise<ShopifyBuy.Product | null> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      // We'll need to search for product by SKU in the variant
      const products = await this.client.product.fetchAll(250);
      
      for (const product of products) {
        for (const variant of product.variants) {
          if (variant.sku === sku) {
            return product;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch product with SKU ${sku}:`, error);
      return null;
    }
  }

  async getVariantInventory(variantId: string): Promise<InventoryInfo> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      // Note: Storefront API has limited inventory access
      // We'll return basic info based on variant availability
      const products = await this.client.product.fetchAll(250);
      
      for (const product of products) {
        for (const variant of product.variants) {
          if (variant.id === variantId) {
            return {
              available: variant.available ? 999 : 0, // Storefront API doesn't give exact count
              policy: variant.availableForSale ? 'CONTINUE' : 'DENY',
              tracked: true,
            };
          }
        }
      }
      
      return {
        available: 0,
        policy: 'DENY',
        tracked: false,
      };
    } catch (error) {
      console.error(`Failed to check inventory for variant ${variantId}:`, error);
      return {
        available: 0,
        policy: 'UNKNOWN',
        tracked: false,
      };
    }
  }

  async findVariantBySku(sku: string): Promise<ShopifyBuy.ProductVariant | null> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const products = await this.client.product.fetchAll(250);
      
      for (const product of products) {
        for (const variant of product.variants) {
          if (variant.sku === sku) {
            return variant;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to find variant with SKU ${sku}:`, error);
      return null;
    }
  }

  async createCart(): Promise<ShopifyBuy.Cart> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      this.cart = await this.client.checkout.create();
      this.saveCartToStorage(this.cart.id);
      return this.cart;
    } catch (error) {
      console.error('Failed to create cart:', error);
      throw error;
    }
  }

  async getCart(): Promise<Cart | null> {
    // Return null during SSR
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!this.cart) {
      await this.loadCartFromStorage();
    }

    if (!this.cart) {
      return null;
    }

    return this.formatCart(this.cart);
  }

  async addToCart(variantId: string, quantity = 1, options: AddToCartOptions = {}): Promise<Cart> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    // Validate inventory if requested
    if (options.validateInventory) {
      const inventory = await this.getVariantInventory(variantId);
      
      if (inventory.policy === 'DENY') {
        throw new Error('This item is currently out of stock');
      }
      
      if (inventory.tracked && inventory.available < quantity) {
        throw new Error(`Only ${inventory.available} items available`);
      }
    }

    // Respect max quantity limit
    if (options.maxQuantity && quantity > options.maxQuantity) {
      throw new Error(`Maximum quantity is ${options.maxQuantity}`);
    }

    if (!this.cart) {
      await this.createCart();
    }

    if (!this.cart) {
      throw new Error('Failed to create cart');
    }

    try {
      const lineItemsToAdd = [{
        variantId,
        quantity,
      }];

      this.cart = await this.client.checkout.addLineItems(this.cart.id, lineItemsToAdd);
      this.saveCartToStorage(this.cart.id);
      return this.formatCart(this.cart);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          throw new Error('This item is currently unavailable');
        }
        if (error.message.includes('inventory')) {
          throw new Error('Insufficient inventory for this item');
        }
      }
      
      throw error;
    }
  }

  async addToCartBySku(sku: string, quantity = 1, options: AddToCartOptions = {}): Promise<Cart> {
    const variant = await this.findVariantBySku(sku);
    if (!variant) {
      throw new Error(`Product with SKU ${sku} not found`);
    }
    
    return this.addToCart(variant.id, quantity, options);
  }

  async updateCartItem(lineItemId: string, quantity: number): Promise<Cart> {
    if (!this.client || !this.cart) {
      throw new Error('Shopify client or cart not available');
    }

    try {
      const lineItemsToUpdate = [{
        id: lineItemId,
        quantity,
      }];

      this.cart = await this.client.checkout.updateLineItems(this.cart.id, lineItemsToUpdate);
      return this.formatCart(this.cart);
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  }

  async removeFromCart(lineItemId: string): Promise<Cart> {
    if (!this.client || !this.cart) {
      throw new Error('Shopify client or cart not available');
    }

    try {
      this.cart = await this.client.checkout.removeLineItems(this.cart.id, [lineItemId]);
      return this.formatCart(this.cart);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  }

  getCheckoutUrl(): string | null {
    return this.cart?.webUrl || null;
  }

  private formatCart(checkout: ShopifyBuy.Cart): Cart {
    return {
      id: checkout.id,
      items: checkout.lineItems.map((item: any) => ({
        variantId: item.variant.id,
        quantity: item.quantity,
        productTitle: item.title,
        variantTitle: item.variant.title,
        price: item.variant.price.amount,
        sku: item.variant.sku,
        image: item.variant.image?.src,
      })),
      subtotal: checkout.subtotalPrice.amount,
      totalQuantity: checkout.lineItems.reduce((total: number, item: any) => total + item.quantity, 0),
      checkoutUrl: checkout.webUrl,
    };
  }

  private saveCartToStorage(cartId: string) {
    try {
      const cartData = {
        id: cartId,
        timestamp: Date.now(),
        version: '1.0',
      };
      localStorage.setItem('shopify_cart_id', cartId);
      localStorage.setItem('shopify_cart_data', JSON.stringify(cartData));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }

  private async loadCartFromStorage() {
    if (!this.client) return;

    try {
      const cartId = localStorage.getItem('shopify_cart_id');
      const cartDataStr = localStorage.getItem('shopify_cart_data');
      
      if (cartId && cartDataStr) {
        const cartData = JSON.parse(cartDataStr);
        
        // Check if cart is too old (24 hours)
        const isExpired = Date.now() - cartData.timestamp > 24 * 60 * 60 * 1000;
        
        if (isExpired) {
          console.log('Cart expired, clearing storage');
          this.clearCartStorage();
          return;
        }
        
        // Try to fetch the cart
        this.cart = await this.client.checkout.fetch(cartId);
        
        // Verify cart is still valid (not completed)
        if (this.cart.completedAt) {
          console.log('Cart was completed, clearing storage');
          this.clearCartStorage();
          this.cart = null;
        }
      }
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error);
      this.clearCartStorage();
    }
  }

  private clearCartStorage() {
    try {
      localStorage.removeItem('shopify_cart_id');
      localStorage.removeItem('shopify_cart_data');
    } catch (error) {
      console.warn('Failed to clear cart storage:', error);
    }
  }

  async recoverCart(): Promise<Cart | null> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      await this.loadCartFromStorage();
      return this.cart ? this.formatCart(this.cart) : null;
    } catch (error) {
      console.error('Failed to recover cart:', error);
      return null;
    }
  }

  clearCart() {
    this.cart = null;
    this.clearCartStorage();
  }
}

// Create singleton instance
export const shopifyService = new ShopifyService();
export default shopifyService;

// Type exports
export type { Cart, CartItem, ShopifyConfig, InventoryInfo, AddToCartOptions };