/**
 * Enhanced SearchResults Component with Highlighting
 * Task 9.4: Algolia Search Integration
 * 
 * Displays search results with highlighting, grid/list views,
 * and integration with existing product components
 */

'use client';

import React, { useState } from 'react';
import { useHits, UseHitsProps, Highlight, Snippet } from 'react-instantsearch';
import { Grid, List, Package, ShoppingCart, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { SearchHit } from '@/lib/algolia-config';

interface SearchResultsProps extends UseHitsProps {
  className?: string;
  defaultView?: 'grid' | 'list';
  showViewToggle?: boolean;
  onProductClick?: (hit: SearchHit) => void;
}

type ViewMode = 'grid' | 'list';

export function SearchResults({
  className = '',
  defaultView = 'grid',
  showViewToggle = true,
  onProductClick,
  ...props
}: SearchResultsProps) {
  const t = useTranslations('search');
  const { hits } = useHits<SearchHit>(props);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Format price with currency
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`;
  };

  // Get product image with fallback
  const getProductImage = (hit: SearchHit) => {
    if (hit.images && hit.images.length > 0) {
      const primaryImage = hit.images.find(img => img.isPrimary) || hit.images[0];
      return primaryImage.imageUrl;
    }
    return null;
  };

  // Handle product click with analytics
  const handleProductClick = (hit: SearchHit) => {
    onProductClick?.(hit);
    
    // Track click analytics
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.info(`[Search Analytics] Product clicked: ${hit.sku}`);
      // In production: analytics.track('search_result_click', { objectID: hit.objectID, sku: hit.sku });
    }
  };

  // Get availability status styling
  const getAvailabilityStyle = (availability: string) => {
    const lower = availability.toLowerCase();
    if (lower.includes('in stock') || lower.includes('available')) {
      return 'bg-green-100 text-green-800';
    } else if (lower.includes('limited') || lower.includes('low')) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {hits.map((hit) => (
        <div
          key={hit.objectID}
          className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 group"
        >
          <Link href={`/product/${hit.sku}`} onClick={() => handleProductClick(hit)}>
            <div className="p-4">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {getProductImage(hit) ? (
                  <Image
                    src={getProductImage(hit)!}
                    alt={hit.title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Package
                  className={`h-12 w-12 text-gray-400 ${getProductImage(hit) ? 'hidden' : ''}`}
                />
              </div>

              {/* Product Title with Highlighting */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={hit.title}>
                <Highlight hit={hit} attribute="title" className="bg-yellow-200" />
              </h3>

              {/* Product Description with Highlighting */}
              {hit.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2" title={hit.description}>
                  <Snippet hit={hit} attribute="description" className="bg-yellow-200" />
                </p>
              )}

              {/* Category Badge */}
              <div className="text-xs text-blue-600 mb-2 font-medium">
                {hit.categoryName}
                {hit.subcategoryName && ` > ${hit.subcategoryName}`}
              </div>

              {/* Price and Availability */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(hit.price)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityStyle(hit.availability)}`}>
                  {hit.availability}
                </span>
              </div>

              {/* SKU and Vendor */}
              <div className="space-y-1 mb-3">
                <div className="text-xs text-gray-500">
                  SKU: <Highlight hit={hit} attribute="sku" className="bg-yellow-200" />
                </div>
                {hit.vendor && (
                  <div className="text-xs text-gray-500">
                    Brand: {hit.vendor}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle add to cart
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Add to cart:', hit.sku);
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {t('addToCart', 'Add to Cart')}
                </button>
                <button
                  className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle quote request
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Request quote:', hit.sku);
                    }
                  }}
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="space-y-4">
      {hits.map((hit) => (
        <div
          key={hit.objectID}
          className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 group"
        >
          <Link href={`/product/${hit.sku}`} onClick={() => handleProductClick(hit)}>
            <div className="p-6 flex gap-6">
              {/* Product Image */}
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {getProductImage(hit) ? (
                  <Image
                    src={getProductImage(hit)!}
                    alt={hit.title}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Package
                  className={`h-8 w-8 text-gray-400 ${getProductImage(hit) ? 'hidden' : ''}`}
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                {/* Title and Category */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    <Highlight hit={hit} attribute="title" className="bg-yellow-200" />
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityStyle(hit.availability)} flex-shrink-0`}>
                    {hit.availability}
                  </span>
                </div>

                {/* Category and Vendor */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="text-blue-600 font-medium">
                    {hit.categoryName}
                    {hit.subcategoryName && ` > ${hit.subcategoryName}`}
                  </span>
                  {hit.vendor && <span>Brand: {hit.vendor}</span>}
                </div>

                {/* Description */}
                {hit.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    <Snippet hit={hit} attribute="description" className="bg-yellow-200" />
                  </p>
                )}

                {/* SKU and Price */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      SKU: <Highlight hit={hit} attribute="sku" className="bg-yellow-200" />
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(hit.price)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm flex items-center"
                      onClick={(e) => {
                        e.preventDefault();
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Add to cart:', hit.sku);
                        }
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t('addToCart', 'Add to Cart')}
                    </button>
                    <button
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm flex items-center"
                      onClick={(e) => {
                        e.preventDefault();
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Request quote:', hit.sku);
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {t('requestQuote', 'Quote')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );

  return (
    <div className={className}>
      {/* View Toggle */}
      {showViewToggle && hits.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {t('viewAs', 'View as')}:
            </span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-4 w-4" />
                {t('gridView', 'Grid')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                {t('listView', 'List')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {hits.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderListView()
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('noResults', 'No results found')}
          </h3>
          <p className="text-gray-600">
            {t('noResultsMessage', 'Try adjusting your search or filters')}
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;