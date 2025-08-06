// Revival API client for fetching accurate product and variant data

import {
  RevivalProduct,
  RevivalVariantData,
  RevivalVariableProduct,
  RevivalTechnicalSpec,
} from './types';
import { config } from '../config';

export class RevivalApiClient {
  private async fetchJson<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${config.api.revivalBaseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Revival API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async getVariantSummary() {
    return this.fetchJson<{
      status: string;
      extraction_progress: {
        products_extracted: number;
        total_products: number;
        progress_percentage: number;
      };
      variant_statistics: {
        products_with_variants: number;
        products_without_variants: number;
        variant_percentage: number;
        projected_total_with_variants: number;
      };
      variant_types: Record<string, number>;
    }>('/variants/summary');
  }

  async getAllProducts(limit: number = 50, offset: number = 0) {
    return this.fetchJson<{
      products: RevivalProduct[];
      pagination: {
        limit: number;
        offset: number;
        total_count: number;
        has_next: boolean;
      };
    }>(`/products?limit=${limit}&offset=${offset}`);
  }

  async getAllProductsFlat(): Promise<RevivalProduct[]> {
    // Fetch all products by paginating through the API
    const allProducts: RevivalProduct[] = [];
    let offset = 0;
    const limit = 100; // Larger batch for efficiency
    let hasNext = true;

    while (hasNext) {
      const response = await this.getAllProducts(limit, offset);
      allProducts.push(...response.products);

      hasNext = response.pagination.has_next;
      offset += limit;

      // Safety check to prevent infinite loops
      if (offset > 10000) {
        console.warn('Breaking pagination loop at 10k products for safety');
        break;
      }
    }

    return allProducts;
  }

  async getVariableProducts(limit: number = 50, offset: number = 0) {
    return this.fetchJson<{
      products: RevivalVariableProduct[];
      pagination: {
        limit: number;
        offset: number;
        total_count: number;
        has_next: boolean;
      };
    }>(`/variants/products?limit=${limit}&offset=${offset}`);
  }

  async getSimpleProducts(limit: number = 50, offset: number = 0) {
    return this.fetchJson<{
      products: RevivalProduct[];
      pagination: {
        limit: number;
        offset: number;
        total_count: number;
        has_next: boolean;
      };
    }>(`/variants/simple-products?limit=${limit}&offset=${offset}`);
  }

  async getProductVariants(sku: string): Promise<RevivalVariantData> {
    return this.fetchJson<RevivalVariantData>(`/products/${sku}/variants`);
  }

  async getTechnicalSpecs(sku: string): Promise<RevivalTechnicalSpec> {
    return this.fetchJson<RevivalTechnicalSpec>(`/ecommerce/technical-specs/${sku}`);
  }

  // Utility methods for bulk operations
  async getAllProductsPaginated(): Promise<RevivalProduct[]> {
    const allProducts: RevivalProduct[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getAllProducts(limit, offset);
      allProducts.push(...response.products);

      if (!response.pagination.has_next) {
        break;
      }

      offset += limit;

      // Small delay to prevent API overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allProducts;
  }

  async getAllVariableProductsPaginated(): Promise<RevivalVariableProduct[]> {
    const allProducts: RevivalVariableProduct[] = [];
    const offset = 0;
    const limit = 63; // We know there are exactly 63

    const response = await this.getVariableProducts(limit, offset);
    allProducts.push(...response.products);

    return allProducts;
  }

  async getAllSimpleProductsPaginated(): Promise<RevivalProduct[]> {
    const allProducts: RevivalProduct[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.getSimpleProducts(limit, offset);
      allProducts.push(...response.products);

      if (!response.pagination.has_next) {
        break;
      }

      offset += limit;

      // Small delay to prevent API overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allProducts;
  }
}

export const revivalApi = new RevivalApiClient();
