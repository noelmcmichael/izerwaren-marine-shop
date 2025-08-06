/**
 * Recently Viewed Products Carousel Component
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Displays recently viewed products in a horizontal carousel
 * with responsive design and integration with product actions.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, ShoppingCart, RotateCcw, Scale } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useProductActions } from '@/hooks/useProductActions';
import { ProductSummary, formatPrice } from '@/lib/types';

interface RecentlyViewedProps {
  className?: string;
  maxItems?: number;
  showTitle?: boolean;
  showClearButton?: boolean;
}

export function RecentlyViewed({ 
  className = '', 
  maxItems = 10,
  showTitle = true,
  showClearButton = true
}: RecentlyViewedProps) {
  const t = useTranslations('recentlyViewed');
  const tCatalog = useTranslations('catalog');
  const { items, clearRecentlyViewed } = useRecentlyViewed();
  const { addToCart, addToComparison, isLoading } = useProductActions();
  const [currentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Limit items for display
  const displayItems = items.slice(0, maxItems);

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Initialize scroll position check
  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [displayItems]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Convert recently viewed item to product summary for actions
  const toProductSummary = (item: typeof items[0]): ProductSummary => ({
    id: item.productId,
    title: item.title,
    sku: item.sku,
    price: item.price,
    imageUrl: item.imageUrl,
    vendor: item.vendor,
  });

  // Handle product actions
  const handleAddToCart = async (item: typeof items[0]) => {
    await addToCart(toProductSummary(item), 1);
  };

  const handleAddToComparison = (item: typeof items[0]) => {
    addToComparison(toProductSummary(item));
  };

  // Don't render if not mounted or no items
  if (!mounted || !displayItems.length) {
    return null;
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('title')}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {displayItems.length > 0 && showClearButton && (
              <button
                onClick={clearRecentlyViewed}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors text-sm px-3 py-2 rounded-md border border-gray-300 hover:border-red-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('clearHistory')}</span>
              </button>
            )}
            
            <Link
              href="/search"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('viewAll')}
            </Link>
          </div>
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            aria-label={t('carousel.previous')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            aria-label={t('carousel.next')}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayItems.map((item) => (
            <RecentlyViewedCard
              key={`${item.productId}-${item.viewedAt.getTime()}`}
              item={item}
              onAddToCart={() => handleAddToCart(item)}
              onAddToComparison={() => handleAddToComparison(item)}
              isLoading={isLoading}
              t={t}
              tCatalog={tCatalog}
            />
          ))}
        </div>
      </div>

      {/* Mobile Scroll Indicator */}
      <div className="lg:hidden mt-4 text-center">
        <div className="flex justify-center space-x-1">
          {Array.from({ length: Math.ceil(displayItems.length / 2) }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === Math.floor(currentIndex / 2) ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          {t('privacy.notice')}
        </p>
      </div>
    </div>
  );
}

// Individual Recently Viewed Card Component
interface RecentlyViewedCardProps {
  item: {
    productId: string;
    viewedAt: Date;
    title: string;
    imageUrl?: string;
    price?: string;
    sku: string;
    vendor?: string;
  };
  onAddToCart: () => void;
  onAddToComparison: () => void;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tCatalog: any;
}

function RecentlyViewedCard({
  item,
  onAddToCart,
  onAddToComparison,
  isLoading,
  t,
  tCatalog
}: RecentlyViewedCardProps) {
  // Format time since viewed
  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="relative">
        <Link 
          href={`/products/${item.productId}`}
          className="block"
          aria-label={t('carousel.viewProduct')}
        >
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={256}
                height={192}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </Link>

        {/* View Time Badge */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatTimeSince(item.viewedAt)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link 
          href={`/products/${item.productId}`}
          className="block hover:text-blue-600 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
            {item.title}
          </h3>
        </Link>

        <div className="space-y-1 mb-3">
          <p className="text-xs text-gray-600">
            SKU: {item.sku}
          </p>
          {item.vendor && (
            <p className="text-xs text-gray-600">
              {item.vendor}
            </p>
          )}
          {item.price && (
            <p className="text-sm font-semibold text-green-600">
              {formatPrice(item.price)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onAddToCart}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            <ShoppingCart className="w-3 h-3" />
            <span>{tCatalog('addToCart')}</span>
          </button>
          
          <button
            onClick={onAddToComparison}
            className="w-full bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
          >
            <Scale className="w-3 h-3" />
            <span>Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecentlyViewed;