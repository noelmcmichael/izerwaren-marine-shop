/**
 * Recently Viewed Products Hook
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Tracks product views using localStorage with automatic cleanup
 * and provides actions for managing recently viewed history.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductSummary, RecentlyViewedItem, RecentlyViewedState, RecentlyViewedActions } from '@/lib/types';

const STORAGE_KEY = 'izerwaren_recently_viewed';
const MAX_ITEMS = 20;
const CLEANUP_THRESHOLD = 30; // Clean items older than 30 days

interface UseRecentlyViewedReturn extends RecentlyViewedState, RecentlyViewedActions {}

export function useRecentlyViewed(): UseRecentlyViewedReturn {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // Load recently viewed from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentlyViewedItem[] = JSON.parse(stored);
        
        // Convert date strings back to Date objects and filter old items
        const now = new Date();
        const cleanupDate = new Date(now.getTime() - (CLEANUP_THRESHOLD * 24 * 60 * 60 * 1000));
        
        const validItems = parsed
          .map(item => ({
            ...item,
            viewedAt: new Date(item.viewedAt)
          }))
          .filter(item => item.viewedAt > cleanupDate)
          .slice(0, MAX_ITEMS);

        setItems(validItems);
        
        // Save cleaned data back to localStorage
        if (validItems.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
        }
      }
    } catch (error) {
      console.warn('[useRecentlyViewed] Failed to load recently viewed from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('[useRecentlyViewed] Failed to save recently viewed to localStorage:', error);
    }
  }, [items]);

  // Add product to recently viewed
  const addRecentlyViewed = useCallback((product: ProductSummary) => {
    const newItem: RecentlyViewedItem = {
      productId: product.id,
      viewedAt: new Date(),
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      sku: product.sku,
      vendor: product.vendor,
    };

    setItems(prev => {
      // Remove existing entry for the same product
      const filtered = prev.filter(item => item.productId !== product.id);
      
      // Add new item to the beginning and limit total items
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  // Clear all recently viewed items
  const clearRecentlyViewed = useCallback(() => {
    setItems([]);
  }, []);

  // Get recently viewed items (already sorted by most recent)
  const getRecentlyViewed = useCallback((): RecentlyViewedItem[] => {
    return items;
  }, [items]);

  return {
    items,
    maxItems: MAX_ITEMS,
    addRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewed,
  };
}

// Helper hook for recently viewed analytics
export function useRecentlyViewedAnalytics() {
  const trackRecentlyViewedEvent = useCallback((
    action: 'view' | 'click' | 'clear',
    productId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any
  ) => {
    // Integration with existing analytics system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag('event', 'recently_viewed_action', {
        action,
        product_id: productId,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Recently Viewed Analytics]', {
        action,
        productId,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return { trackRecentlyViewedEvent };
}