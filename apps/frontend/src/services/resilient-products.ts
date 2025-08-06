/**
 * Resilient Product Service
 *
 * Attempts to use the real API first, falls back to mock data if unavailable
 * This ensures the site works even when the backend is not deployed
 */

import { MockProductService } from './mock-products';
import { config } from '@/lib/config';



interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price: string;
  retailPrice: string;
  categoryName: string;
  availability: string;
  imageCount: number;
  primaryImagePath?: string;
  images?: Array<{
    imageUrl?: string;
    localPath?: string;
    isPrimary: boolean;
  }>;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ApiStatus {
  isAvailable: boolean;
  lastChecked: number;
  checkInterval: number; // ms
}

class ResilientProductService {
  private apiStatus: ApiStatus = {
    isAvailable: false,
    lastChecked: 0,
    checkInterval: 30000, // Check every 30 seconds
  };

  constructor() {
    // Check API availability on initialization
    this.checkApiAvailability();
  }

  /**
   * Check if the API is available
   */
  private async checkApiAvailability(): Promise<boolean> {
    const now = Date.now();

    // Skip check if we've checked recently
    if (now - this.apiStatus.lastChecked < this.apiStatus.checkInterval) {
      return this.apiStatus.isAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${config.api.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      this.apiStatus.isAvailable = response.ok;
      this.apiStatus.lastChecked = now;

      if (this.apiStatus.isAvailable) {
        // eslint-disable-next-line no-console
        console.log('✅ Backend API is available');
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Backend API returned error, using mock data');
      }

      return this.apiStatus.isAvailable;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️ Backend API unavailable, using mock data:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.apiStatus.isAvailable = false;
      this.apiStatus.lastChecked = now;
      return false;
    }
  }

  /**
   * Fetch products with automatic fallback
   */
  async getProducts(
    page = 1,
    limit = 20,
    search?: string,
    category?: string,
    subcategories?: string
  ): Promise<ProductsResponse> {
    const isApiAvailable = await this.checkApiAvailability();

    if (isApiAvailable) {
      try {
        return await this.fetchFromApi(page, limit, search, category, subcategories);
      } catch (error) {
        console.warn('Failed to fetch from API, falling back to mock data:', error);
        // Mark API as unavailable for the next interval
        this.apiStatus.isAvailable = false;
      }
    }

    // Use mock data
    return await MockProductService.getProducts(page, limit, category, search, subcategories);
  }

  /**
   * Get products by category with special handling
   */
  async getProductsByCategory(category: string, page = 1, limit = 20): Promise<ProductsResponse> {
    const isApiAvailable = await this.checkApiAvailability();

    if (isApiAvailable) {
      try {
        return await this.fetchByCategoryFromApi(category, page, limit);
      } catch (error) {
        console.warn(
          'Failed to fetch category products from API, falling back to mock data:',
          error
        );
        this.apiStatus.isAvailable = false;
      }
    }

    // Use mock data
    return await MockProductService.getProductsByCategory(category, page, limit);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(categories: string[]): Promise<Product[]> {
    const isApiAvailable = await this.checkApiAvailability();

    if (isApiAvailable) {
      try {
        const results = await Promise.all(
          categories.map(async category => {
            try {
              const response = await fetch(
                `${config.api.baseUrl}/products?ownerCategory=${encodeURIComponent(category)}&limit=1`,
                {
                  signal: AbortSignal.timeout(3000),
                }
              );

              if (!response.ok) throw new Error(`HTTP ${response.status}`);

              const data = await response.json();
              return data.data?.[0] || null;
            } catch (error) {
              console.warn(`Failed to fetch featured product for ${category}:`, error);
              return null;
            }
          })
        );

        const validResults = results.filter(Boolean);
        if (validResults.length > 0) {
          return validResults;
        }
      } catch (error) {
        console.warn(
          'Failed to fetch featured products from API, falling back to mock data:',
          error
        );
        this.apiStatus.isAvailable = false;
      }
    }

    // Use mock data
    return await MockProductService.getFeaturedProducts(categories);
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<Product | null> {
    const isApiAvailable = await this.checkApiAvailability();

    if (isApiAvailable) {
      try {
        const response = await fetch(
          `${config.api.baseUrl}/products?sku=${encodeURIComponent(sku)}&limit=1`,
          {
            signal: AbortSignal.timeout(3000),
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data.data?.[0] || null;
      } catch (error) {
        console.warn(`Failed to fetch product ${sku} from API, falling back to mock data:`, error);
        this.apiStatus.isAvailable = false;
      }
    }

    // Use mock data
    return await MockProductService.getProductBySku(sku);
  }

  /**
   * Get current API status
   */
  getApiStatus(): { isAvailable: boolean; lastChecked: Date; usingMockData: boolean } {
    return {
      isAvailable: this.apiStatus.isAvailable,
      lastChecked: new Date(this.apiStatus.lastChecked),
      usingMockData: !this.apiStatus.isAvailable,
    };
  }

  /**
   * Force API status check
   */
  async forceApiCheck(): Promise<boolean> {
    this.apiStatus.lastChecked = 0; // Force recheck
    return await this.checkApiAvailability();
  }

  /**
   * Private method to fetch from real API
   */
  private async fetchFromApi(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    subcategories?: string
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (category && category !== 'ALL') params.append('ownerCategory', category);
    if (subcategories) params.append('subcategories', subcategories);

    const response = await fetch(`${config.api.baseUrl}/products?${params}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Private method to fetch by category from real API
   */
  private async fetchByCategoryFromApi(
    category: string,
    page: number,
    limit: number
  ): Promise<ProductsResponse> {
    let endpoint = '';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category === 'VARIANT_PRODUCTS') {
      endpoint = '/products/variants';
    } else if (category === 'PDF_PRODUCTS') {
      endpoint = '/products/with-pdfs';
    } else {
      endpoint = '/products';
      if (category !== 'ALL') {
        params.append('ownerCategory', category);
      }
    }

    const response = await fetch(`${config.api.baseUrl}${endpoint}?${params}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// Create singleton instance
export const resilientProductService = new ResilientProductService();
export default resilientProductService;

// Type exports
export type { Product, ProductsResponse };
