/**
 * React Query Configuration
 * 
 * Centralized configuration for data fetching, caching, and synchronization
 * across the B2B frontend application.
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes by default
    staleTime: 1000 * 60 * 5,
    // Keep cached data for 10 minutes
    gcTime: 1000 * 60 * 10,
    // Retry failed requests 3 times
    retry: 3,
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't refetch on window focus for performance
    refetchOnWindowFocus: false,
    // Only refetch on reconnect for critical data
    refetchOnReconnect: 'always',
  },
  mutations: {
    // Retry mutations once
    retry: 1,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query Keys Factory
 * 
 * Centralized query key management for consistency and type safety
 */
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
  },
  
  // Product Images
  productImages: {
    all: ['productImages'] as const,
    lists: () => [...queryKeys.productImages.all, 'list'] as const,
    list: (productId: number) => [...queryKeys.productImages.lists(), { productId }] as const,
    detail: (imageId: number) => [...queryKeys.productImages.all, 'detail', imageId] as const,
  },
  
  // Technical Specifications
  technicalSpecs: {
    all: ['technicalSpecs'] as const,
    list: (productId: number) => [...queryKeys.technicalSpecs.all, 'list', { productId }] as const,
  },
  
  // Customer Account
  customer: {
    all: ['customer'] as const,
    profile: () => [...queryKeys.customer.all, 'profile'] as const,
    orders: () => [...queryKeys.customer.all, 'orders'] as const,
    quotes: () => [...queryKeys.customer.all, 'quotes'] as const,
  },
  
  // Shopify Integration
  shopify: {
    all: ['shopify'] as const,
    product: (shopifyId: string) => [...queryKeys.shopify.all, 'product', shopifyId] as const,
    inventory: (productId: number) => [...queryKeys.shopify.all, 'inventory', productId] as const,
  },
} as const;

/**
 * Default SWR Configuration
 * 
 * For simpler client-side data fetching
 */
export const swrConfig = {
  // Cache for 5 minutes
  dedupingInterval: 1000 * 60 * 5,
  // Revalidate on focus
  revalidateOnFocus: true,
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  // Error retry
  errorRetryCount: 3,
  errorRetryInterval: 5000,
} as const;