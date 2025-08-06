/**
 * Product Comparison Hook
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Manages product comparison state with localStorage persistence
 * and provides actions for adding/removing products from comparison.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductSummary, ComparisonState, ComparisonActions } from '@/lib/types';

const STORAGE_KEY = 'izerwaren_comparison';
const MAX_PRODUCTS = 4;

interface UseComparisonReturn extends ComparisonState, ComparisonActions {}

export function useComparison(): UseComparisonReturn {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load comparison from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed.slice(0, MAX_PRODUCTS));
        }
      }
    } catch (error) {
      console.warn('[useComparison] Failed to load comparison from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever products change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.warn('[useComparison] Failed to save comparison to localStorage:', error);
    }
  }, [products]);

  // Add product to comparison
  const addProduct = useCallback((product: ProductSummary): boolean => {
    if (products.length >= MAX_PRODUCTS) {
      return false; // Cannot add more products
    }

    if (products.some(p => p.id === product.id)) {
      return false; // Product already in comparison
    }

    setProducts(prev => [...prev, product]);
    return true;
  }, [products]);

  // Remove product from comparison
  const removeProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Clear all products from comparison
  const clearComparison = useCallback(() => {
    setProducts([]);
    setIsOpen(false);
  }, []);

  // Toggle comparison visibility
  const toggleComparison = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Check if product is in comparison
  const isProductInComparison = useCallback((productId: string): boolean => {
    return products.some(p => p.id === productId);
  }, [products]);

  return {
    products,
    maxProducts: MAX_PRODUCTS,
    isOpen,
    addProduct,
    removeProduct,
    clearComparison,
    toggleComparison,
    isProductInComparison,
  };
}

// Helper hook for comparison analytics
export function useComparisonAnalytics() {
  const trackComparisonEvent = useCallback((
    action: 'add' | 'remove' | 'clear' | 'view',
    productId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any
  ) => {
    // Integration with existing analytics system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag('event', 'comparison_action', {
        action,
        product_id: productId,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Comparison Analytics]', {
        action,
        productId,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return { trackComparisonEvent };
}