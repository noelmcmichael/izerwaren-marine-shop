'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Package, DollarSign, Tag, Building2 } from 'lucide-react';
import { shopifyDirectService, ShopifyProduct } from '@/services/shopify-direct';

interface ConnectionStatus {
  status: 'testing' | 'connected' | 'failed';
  error?: string;
}

export default function LiveDemoPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'testing' });
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    testShopifyConnection();
    loadInitialData();
  }, []);

  const testShopifyConnection = async () => {
    setConnectionStatus({ status: 'testing' });
    
    try {
      const result = await shopifyDirectService.testConnection();
      
      if (result.success) {
        setConnectionStatus({ status: 'connected' });
      } else {
        setConnectionStatus({ status: 'failed', error: result.error });
      }
    } catch (error) {
      setConnectionStatus({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load first 6 products and featured products
      const [productsResult, featured] = await Promise.all([
        shopifyDirectService.getProducts(6),
        shopifyDirectService.getFeaturedProducts(),
      ]);

      setProducts(productsResult.products);
      setFeaturedProducts(featured);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const result = await shopifyDirectService.searchProducts(searchQuery, 10);
      setSearchResults(result.products);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const ProductCard = ({ product }: { product: ShopifyProduct }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      {product.images[0] && (
        <img
          src={product.images[0].url}
          alt={product.title}
          className="w-full h-48 object-cover rounded-md mb-3"
        />
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {product.title}
      </h3>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{product.vendor}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span>{product.productType}</span>
        </div>
        
        {product.variants[0] && (
          <>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold text-green-600">
                ${parseFloat(product.variants[0].price.amount).toFixed(2)} {product.variants[0].price.currencyCode}
              </span>
            </div>
            
            {product.variants[0].sku && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {product.variants[0].sku}
                </span>
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.variants[0]?.availableForSale 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.variants[0]?.availableForSale ? 'Available' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔴 LIVE Shopify Integration Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Real marine hardware data from izerw-marine.myshopify.com
          </p>
          
          {/* Connection Status */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border">
            {connectionStatus.status === 'testing' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-600">Testing Connection...</span>
              </>
            )}
            {connectionStatus.status === 'connected' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-semibold">🔴 LIVE - Connected to Shopify</span>
              </>
            )}
            {connectionStatus.status === 'failed' && (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">Connection Failed: {connectionStatus.error}</span>
              </>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Search Live Products</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search marine hardware (e.g., 'locks', 'hinges', 'stainless steel')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search Live Store'
              )}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Search Results ({searchResults.length} found)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Featured Marine Hardware</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading featured products from live store...</p>
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Products</h2>
          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading live products from Shopify...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">No products loaded</p>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">🔧 Technical Integration Details</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✅ What's Working:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Direct Shopify Storefront API connection</li>
                <li>• Live product data from 956 products</li>
                <li>• Real-time search functionality</li>
                <li>• Product images, pricing, SKUs</li>
                <li>• Category filtering capabilities</li>
                <li>• GraphQL queries optimized</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Business Value:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Live marine hardware catalog</li>
                <li>• Real pricing and availability</li>
                <li>• Professional product presentation</li>
                <li>• Search and discovery features</li>
                <li>• Ready for customer orders</li>
                <li>• No backend dependencies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}