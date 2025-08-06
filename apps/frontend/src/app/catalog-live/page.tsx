'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Package, 
  DollarSign, 
  Tag, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { shopifyLiveService } from '@/services/shopify-live';
import { Product } from '@/lib/types';

interface ConnectionStatus {
  isConnected: boolean;
  usingLiveData: boolean;
}

export default function LiveCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    usingLiveData: false
  });
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'ALL',
    'Marine Locks',
    'Hinges', 
    'Hardware',
    'Ajar Hooks',
    'Deck Hardware',
    'Hatch Hardware',
    'Fasteners'
  ];

  useEffect(() => {
    loadProducts();
    checkConnectionStatus();
  }, [currentPage, selectedCategory]);

  const checkConnectionStatus = async () => {
    try {
      const status = shopifyLiveService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔴 Loading live products - page ${currentPage}, category: ${selectedCategory}`);

      const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const response = await shopifyLiveService.getProducts(currentPage, 12, undefined, category);

      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalProducts(response.pagination.total);
      
      // Update connection status
      setConnectionStatus({
        isConnected: true,
        usingLiveData: true
      });

      console.log(`✅ Loaded ${response.data.length} live products`);

    } catch (error) {
      console.error('Failed to load products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
      setConnectionStatus({
        isConnected: false,
        usingLiveData: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    try {
      setSearching(true);
      setError(null);

      console.log(`🔍 Searching live products for: "${searchQuery}"`);

      const searchResults = await shopifyLiveService.searchProducts(searchQuery, 24);
      setProducts(searchResults);
      setCurrentPage(1);
      setTotalPages(1);

      console.log(`✅ Found ${searchResults.length} search results`);

    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-w-16 aspect-h-12 bg-gray-200">
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">
          <Package className="h-12 w-12" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{product.manufacturer}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{product.category_name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold text-green-600">
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          {product.sku && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate">
                {product.sku}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Live Marine Hardware Catalog
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time inventory from izerw-marine.myshopify.com
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border">
              {connectionStatus.isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-semibold text-sm">
                    🔴 LIVE Connected
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 text-sm">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm py-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search marine hardware products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'ALL' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {connectionStatus.usingLiveData ? (
              <span className="text-green-600 font-medium">
                ✅ Showing live results: {products.length} of {totalProducts.toLocaleString()} products
              </span>
            ) : (
              <span>
                Showing {products.length} products
              </span>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading live products from Shopify...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}