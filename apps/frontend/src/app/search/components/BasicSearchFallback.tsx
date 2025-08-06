/**
 * Basic Search Fallback Component
 * Task 9.4: Algolia Search Integration
 * 
 * Provides basic search functionality when Algolia is not configured
 * Falls back to the original API-based search implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { config } from '@/lib/config';

interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price: string;
  categoryName: string;
  availability: string;
  images?: Array<{
    imageUrl: string;
    isPrimary: boolean;
  }>;
}

interface BasicSearchFallbackProps {
  initialQuery?: string;
}

export function BasicSearchFallback({ initialQuery = '' }: BasicSearchFallbackProps) {
  const t = useTranslations('search');
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${config.api.baseUrl}/products?search=${encodeURIComponent(searchQuery)}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.data || []);
      setTotalResults(data.pagination?.total || data.data?.length || 0);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setResults([]);
      setTotalResults(0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const newUrl = `/search?q=${encodeURIComponent(searchInput.trim())}`;
      window.history.pushState({}, '', newUrl);
      searchProducts(searchInput.trim());
    }
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      return primaryImage.imageUrl;
    }
    return null;
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? price : `$${numPrice.toFixed(2)}`;
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchInput(initialQuery);
      searchProducts(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors duration-200">
              {t('navigation.home', 'Home')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">
              {t('stats.searchResults', 'Search Results')}
            </span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder={t('placeholder', 'Search for products...')}
              />
            </div>
          </form>

          {/* Results Summary */}
          {searchInput && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {t('stats.searchResults', 'Search results for')} &quot;{searchInput}&quot;
                {searched && !loading && (
                  <span className="ml-2 text-sm">
                    ({totalResults} {totalResults === 1 ? t('stats.resultSingular', 'result') : t('stats.resultPlural', 'results')})
                  </span>
                )}
              </p>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="h-4 w-4 mr-1 animate-spin" />
                  {t('searching', 'Searching...')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => searchInput && searchProducts(searchInput)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        )}

        {!error && searchInput && searched && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {getProductImage(product) ? (
                      <Image
                        src={getProductImage(product)!}
                        alt={product.title}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover rounded-lg"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package
                      className={`h-12 w-12 text-gray-400 ${getProductImage(product) ? 'hidden' : ''}`}
                    />
                  </div>
                  <h3
                    className="font-semibold text-gray-900 mb-2 line-clamp-2"
                    title={product.title}
                  >
                    {product.title}
                  </h3>
                  <p
                    className="text-gray-600 text-sm mb-2 line-clamp-2"
                    title={product.description}
                  >
                    {product.description}
                  </p>
                  <div className="text-xs text-blue-600 mb-2 font-medium">
                    {product.categoryName}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.availability === 'In Stock'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.availability}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">SKU: {product.sku}</div>
                  <Link
                    href={`/product/${product.sku}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('results.viewDetails', 'View Details')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && searchInput && searched && results.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('results.noResults', 'No results found')}
            </h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any products matching &quot;{searchInput}&quot;. Try a different
              search term or browse our catalog.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Browse All Products
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}

        {!searchInput && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search our catalog</h3>
            <p className="text-gray-600 mb-6">
              Enter a search term above to find products in our catalog of 947+ items.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Browse All Products
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BasicSearchFallback;