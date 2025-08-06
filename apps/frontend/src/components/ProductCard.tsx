/**
 * Enhanced Product Card Component
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Product card with comparison controls, cart actions, and
 * automatic recently viewed tracking on view/click.
 */

'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Scale, FileText, Eye, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProductSummary, formatPrice } from '@/lib/types';
import { useProductActions } from '@/hooks/useProductActions';
import { useComparison } from '@/hooks/useComparison';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface ProductCardProps {
  product: ProductSummary;
  className?: string;
  layout?: 'grid' | 'list';
  showComparisonControls?: boolean;
  showQuickActions?: boolean;
  trackViewing?: boolean;
}

export function ProductCard({
  product,
  className = '',
  layout = 'grid',
  showComparisonControls = true,
  showQuickActions = true,
  trackViewing = true,
}: ProductCardProps) {
  const t = useTranslations('catalog');
  const tComparison = useTranslations('comparison');
  const { addToCart, requestQuote, addToComparison, removeFromComparison, isLoading } = useProductActions();
  const { isProductInComparison } = useComparison();
  const { addRecentlyViewed } = useRecentlyViewed();

  const isInComparison = isProductInComparison(product.id);

  // Track product view when component mounts (if enabled)
  useEffect(() => {
    if (trackViewing) {
      // Small delay to avoid tracking rapid scrolling
      const timer = setTimeout(() => {
        addRecentlyViewed(product);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [product.id, trackViewing, addRecentlyViewed, product]);

  // Handle product actions
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1);
  };

  const handleRequestQuote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await requestQuote(product, 1);
  };

  const handleComparisonToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInComparison) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  const handleProductClick = () => {
    // Track as recently viewed when clicked
    if (trackViewing) {
      addRecentlyViewed(product);
    }
  };

  // Get primary image
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl || product.imageUrl;

  if (layout === 'list') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        <Link href={`/products/${product.id}`} onClick={handleProductClick}>
          <div className="p-4 flex items-center space-x-4">
            {/* Image */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {product.title}
              </h3>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  SKU: {product.sku}
                </p>
                {product.vendor && (
                  <p className="text-sm text-gray-600">
                    {product.vendor}
                  </p>
                )}
                {product.availability && (
                  <p className="text-sm text-gray-600">
                    {product.availability}
                  </p>
                )}
              </div>

              {product.description && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex-shrink-0 text-right space-y-3">
              {product.price && (
                <p className="text-xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </p>
              )}

              {showQuickActions && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('addToCart')}</span>
                  </button>

                  <button
                    onClick={handleRequestQuote}
                    disabled={isLoading}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Quote</span>
                  </button>
                </div>
              )}

              {showComparisonControls && (
                <button
                  onClick={handleComparisonToggle}
                  className={`w-full px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1 ${
                    isInComparison
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>
                    {isInComparison ? tComparison('removeFromComparison') : tComparison('addToComparison')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group ${className}`}>
      <Link href={`/products/${product.id}`} onClick={handleProductClick}>
        {/* Image */}
        <div className="relative">
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                width={300}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Comparison Badge */}
          {showComparisonControls && isInComparison && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              In Comparison
            </div>
          )}

          {/* Quick Action Overlay */}
          {showQuickActions && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                title={t('addToCart')}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleRequestQuote}
                disabled={isLoading}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Request Quote"
              >
                <FileText className="w-5 h-5" />
              </button>
              
              <Link href={`/products/${product.id}`}>
                <div className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Eye className="w-5 h-5" />
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-2">
            {product.title}
          </h3>
          
          <div className="space-y-1 mb-3">
            <p className="text-sm text-gray-600">
              SKU: {product.sku}
            </p>
            {product.vendor && (
              <p className="text-sm text-gray-600">
                {product.vendor}
              </p>
            )}
            {product.availability && (
              <p className="text-sm text-gray-600">
                {product.availability}
              </p>
            )}
          </div>

          {product.price && (
            <p className="text-lg font-bold text-green-600 mb-3">
              {formatPrice(product.price)}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {showQuickActions && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('addToCart')}</span>
                </button>

                <button
                  onClick={handleRequestQuote}
                  disabled={isLoading}
                  className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Quote</span>
                </button>
              </div>
            )}

            {showComparisonControls && (
              <button
                onClick={handleComparisonToggle}
                className={`w-full px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1 ${
                  isInComparison
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span className="text-xs">
                  {isInComparison ? 'Remove' : 'Compare'}
                </span>
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;