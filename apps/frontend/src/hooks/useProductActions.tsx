/**
 * Product Actions Hook
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Provides unified actions for cart, quote, and comparison operations
 * with toast notifications and error handling.
 */

'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToastActions } from '@/components/shared/Toast';
import { ProductSummary, ProductActionResult, ProductActions } from '@/lib/types';
import { useComparison } from './useComparison';

interface UseProductActionsReturn extends ProductActions {
  isLoading: boolean;
}

export function useProductActions(): UseProductActionsReturn {
  const t = useTranslations('catalog');
  const { success, error } = useToastActions();
  const { addProduct: addToComparisonState, removeProduct: removeFromComparisonState, isProductInComparison } = useComparison();

  // Mock loading state - would be managed by actual API calls
  const isLoading = false;

  // Add product to cart
  const addToCart = useCallback(async (product: ProductSummary, quantity = 1): Promise<ProductActionResult> => {
    try {
      // Simulate API call - replace with actual cart service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock implementation - replace with actual cart integration
      const successResult = Math.random() > 0.1; // 90% success rate for demo

      if (successResult) {
        success(t('addToCartSuccess'), `${product.title} added to cart`);
        
        return {
          success: true,
          message: t('addToCartSuccess'),
          actionType: 'cart',
          data: { productId: product.id, quantity }
        };
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (err) {
      error(t('addToCartFailed'), 'Please try again');
      
      return {
        success: false,
        message: t('addToCartFailed'),
        actionType: 'cart',
        data: { error: err instanceof Error ? err.message : 'Unknown error' }
      };
    }
  }, [t, success, error]);

  // Request quote for product
  const requestQuote = useCallback(async (product: ProductSummary, quantity = 1): Promise<ProductActionResult> => {
    try {
      // Simulate API call - replace with actual quote service
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Mock implementation - replace with actual quote integration
      const successResult = Math.random() > 0.05; // 95% success rate for demo

      if (successResult) {
        success('Quote request submitted', `Quote requested for ${product.title}`);
        
        return {
          success: true,
          message: 'Quote request submitted successfully',
          actionType: 'quote',
          data: { productId: product.id, quantity }
        };
      } else {
        throw new Error('Failed to request quote');
      }
    } catch (err) {
      error('Failed to request quote', 'Please try again later');
      
      return {
        success: false,
        message: 'Failed to request quote',
        actionType: 'quote',
        data: { error: err instanceof Error ? err.message : 'Unknown error' }
      };
    }
  }, [success, error]);

  // Add product to comparison
  const addToComparison = useCallback((product: ProductSummary): ProductActionResult => {
    const successResult = addToComparisonState(product);

    if (successResult) {
      success('Added to comparison', `${product.title} is now in comparison`);
      
      return {
        success: true,
        message: 'Added to comparison',
        actionType: 'comparison',
        data: { productId: product.id }
      };
    } else {
      const isAlreadyInComparison = isProductInComparison(product.id);
      const message = isAlreadyInComparison 
        ? 'Product already in comparison' 
        : 'Comparison limit reached (4 products max)';
      
      error(message, isAlreadyInComparison ? 'Product is already selected' : 'Remove a product to add this one');
      
      return {
        success: false,
        message,
        actionType: 'comparison',
        data: { productId: product.id, reason: isAlreadyInComparison ? 'duplicate' : 'limit' }
      };
    }
  }, [addToComparisonState, isProductInComparison, success, error]);

  // Remove product from comparison
  const removeFromComparison = useCallback((productId: string): ProductActionResult => {
    removeFromComparisonState(productId);
    
    success('Removed from comparison', 'Product removed from comparison');
    
    return {
      success: true,
      message: 'Removed from comparison',
      actionType: 'comparison',
      data: { productId }
    };
  }, [removeFromComparisonState, success]);

  return {
    addToCart,
    requestQuote,
    addToComparison,
    removeFromComparison,
    isLoading,
  };
}

