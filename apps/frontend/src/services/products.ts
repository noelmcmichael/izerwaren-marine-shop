/**
 * Product Data Services
 * 
 * API service layer for fetching product data from both local PostgreSQL
 * and Shopify APIs. Handles the hybrid architecture where:
 * - Shopify: Products, variants, inventory, checkout
 * - PostgreSQL: Technical specs, B2B pricing, media assets
 */

import { useQuery } from '@tanstack/react-query';
import useSWR from 'swr';
import { Product, MediaAsset, TechnicalSpecification } from '../lib/types';
import { queryKeys } from '../lib/react-query';
import { config } from '../lib/config';

/**
 * Product API Functions
 */
export const productApi = {
  // Get all products with pagination
  getProducts: async (page = 1, limit = 20, filters?: string): Promise<{
    products: Product[];
    total: number;
    pages: number;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters && { filters }),
    });
    
    const response = await fetch(`${config.api.baseUrl}/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Get single product details
  getProduct: async (id: number): Promise<Product> => {
    const response = await fetch(`${config.api.baseUrl}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  // Get product images
  getProductImages: async (productId: number): Promise<MediaAsset[]> => {
    const response = await fetch(`${config.api.baseUrl}/products/${productId}/images`);
    if (!response.ok) throw new Error('Failed to fetch product images');
    return response.json();
  },

  // Get technical specifications
  getTechnicalSpecs: async (productId: number): Promise<TechnicalSpecification[]> => {
    const response = await fetch(`${config.api.baseUrl}/products/${productId}/specs`);
    if (!response.ok) throw new Error('Failed to fetch technical specifications');
    return response.json();
  },

  // Search products
  searchProducts: async (query: string, filters?: Record<string, string>): Promise<{
    products: Product[];
    total: number;
  }> => {
    const params = new URLSearchParams({
      q: query,
      ...filters,
    });
    
    const response = await fetch(`${config.api.baseUrl}/products/search?${params}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },
};

/**
 * React Query Hooks
 */

// Get products list with React Query
export function useProducts(page = 1, limit = 20, filters?: string) {
  return useQuery({
    queryKey: queryKeys.products.list(filters || ''),
    queryFn: () => productApi.getProducts(page, limit, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single product with React Query
export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  });
}

// Get product images with React Query
export function useProductImages(productId: number) {
  return useQuery({
    queryKey: queryKeys.productImages.list(productId),
    queryFn: () => productApi.getProductImages(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes (images don't change often)
  });
}

// Get technical specifications with React Query
export function useTechnicalSpecs(productId: number) {
  return useQuery({
    queryKey: queryKeys.technicalSpecs.list(productId),
    queryFn: () => productApi.getTechnicalSpecs(productId),
    enabled: !!productId,
  });
}

/**
 * SWR Hooks (for simpler use cases)
 */

// Get product images with SWR
export function useProductImagesSWR(productId: number) {
  const { data, error, isLoading } = useSWR(
    productId ? `/products/${productId}/images` : null,
    (url: string) => fetch(`${config.api.baseUrl}${url}`).then(res => res.json())
  );

  return {
    images: data as MediaAsset[] || [],
    isLoading,
    error,
  };
}

// Get product details with SWR (for real-time updates)
export function useProductSWR(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/products/${id}` : null,
    (url: string) => fetch(`${config.api.baseUrl}${url}`).then(res => res.json())
  );

  return {
    product: data as Product,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Combined Product Data Hook
 * 
 * Fetches product + images + specs in one convenient hook
 */
export function useProductWithDetails(id: number) {
  const productQuery = useProduct(id);
  const imagesQuery = useProductImages(id);
  const specsQuery = useTechnicalSpecs(id);

  return {
    product: productQuery.data,
    images: imagesQuery.data || [],
    technicalSpecs: specsQuery.data || [],
    isLoading: productQuery.isLoading || imagesQuery.isLoading || specsQuery.isLoading,
    error: productQuery.error || imagesQuery.error || specsQuery.error,
    refetch: () => {
      productQuery.refetch();
      imagesQuery.refetch();
      specsQuery.refetch();
    },
  };
}

/**
 * Shopify Integration Hooks (for future implementation)
 */

// Get real-time inventory from Shopify
export function useShopifyInventory(productId: number) {
  return useQuery({
    queryKey: queryKeys.shopify.inventory(productId),
    queryFn: async () => {
      // This will integrate with Shopify Storefront API
      const response = await fetch(`${config.api.baseUrl}/shopify/products/${productId}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
    enabled: !!productId,
    staleTime: 1000 * 30, // 30 seconds (inventory changes frequently)
  });
}

/**
 * Utility functions
 */

// Prefetch product data for better UX
export function prefetchProduct(id: number) {
  queryKeys.products.detail(id);
  // Could be used on hover or navigation prediction
}

// Invalidate product cache after updates
export function invalidateProductCache(id?: number) {
  if (id) {
    // Invalidate specific product
    // queryClient.invalidateQueries(queryKeys.products.detail(id));
  } else {
    // Invalidate all products
    // queryClient.invalidateQueries(queryKeys.products.all);
  }
}