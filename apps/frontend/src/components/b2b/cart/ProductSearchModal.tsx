'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

import { useCart } from '../../../services/cart';
import { CategoryCards } from '../../shared/CategoryCards';
import { config } from '@/lib/config';

interface ProductSearchModalProps {
  onClose: () => void;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: string;
  availability?: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  shopifyVariants: Array<{
    id: string;
    sku?: string;
    inventoryQty?: number;
  }>;
}

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function ProductSearchModal({ onClose }: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addMultipleItems } = useCart();

  

  // Fetch products from backend API
  const fetchProducts = useCallback(
    async (search?: string, ownerCategory?: string | null, subCategory?: string | null) => {
      console.log('🔍 Fetching products:', { search, ownerCategory, subCategory });
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (subCategory) {
          // Sub-category takes priority over owner category
          params.append('subCategory', subCategory);
        } else if (ownerCategory) {
          params.append('ownerCategory', ownerCategory);
        }
        params.append('limit', '20'); // Limit results for performance
        params.append('status', 'active'); // Only show active products

        const url = config.api.baseUrl === '/api' ? `/api/v1/products?${params.toString()}` : `${config.api.baseUrl}/v1/products?${params.toString()}`;
        console.log('🌐 API URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const result = await response.json();
        
        // Transform API response to match frontend interface
        const transformedProducts: Product[] = result.data.map((apiProduct: any) => ({
          id: apiProduct.id,
          title: apiProduct.title,
          description: apiProduct.description,
          sku: apiProduct.sku,
          price: apiProduct.price,
          availability: apiProduct.availability,
          images: apiProduct.images?.map((img: any) => ({
            id: img.id,
            url: img.imageUrl, // Map imageUrl to url
            altText: img.altText,
            isPrimary: img.isPrimary
          })) || [],
          shopifyVariants: apiProduct.shopifyVariants || []
        }));
        
        console.log('✅ Products loaded:', transformedProducts.length, 'products');
        setProducts(transformedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    },
    [config.api.baseUrl]
  );

  // Initial load and search debouncing
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchProducts(searchTerm, selectedCategory, selectedSubCategory);
      },
      searchTerm ? 300 : 0
    ); // 300ms debounce for search, immediate for initial load

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, selectedSubCategory, fetchProducts]);

  // Helper functions
  const getProductPrimaryImage = (product: Product): string | null => {
    const primaryImage = product.images?.find(img => img.isPrimary);
    return primaryImage?.url || product.images?.[0]?.url || null;
  };

  const getProductVariantId = (product: Product): string => {
    const firstVariant = product.shopifyVariants?.[0];
    return firstVariant?.id || `${product.id}-default`;
  };

  const getProductInventory = (product: Product): number => {
    // For B2B marine hardware, check availability status first
    if (product.availability === 'In Stock') {
      return 100; // Mock stock level for in-stock items
    }
    
    // Fall back to variant inventory calculation
    return (
      product.shopifyVariants?.reduce((total, variant) => total + (variant.inventoryQty || 0), 0) ||
      0
    );
  };

  const isProductInStock = (product: Product): boolean => {
    // For B2B marine hardware, allow ordering even when out of stock
    // This is common practice for specialized marine parts with longer lead times
    return true; // Always allow adding to cart
  };

  const filteredProducts = products;

  const handleAddSelected = () => {
    const itemsToAdd = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      return {
        productId: product!.id,
        variantId: getProductVariantId(product!),
        quantity: 1,
      };
    });

    addMultipleItems(itemsToAdd);
    onClose();
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-4 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]'>
        {/* Header */}
        <div className='flex items-center justify-between pb-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900'>Add Products to Cart</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='mt-4 flex gap-6 h-full'>
          {/* Left Panel - Category Navigation */}
          <div className='w-1/2 border-r border-gray-200 pr-6'>
            <h4 className='text-md font-medium text-gray-900 mb-4'>Browse Categories</h4>
            <CategoryCards
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              onCategoryChange={setSelectedCategory}
              onSubCategoryChange={setSelectedSubCategory}
              showProductCounts={true}
              className='h-full'
            />
          </div>

          {/* Right Panel - Search & Products */}
          <div className='w-1/2'>
            {/* Search Bar */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Search Products
              </label>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search products by name or SKU...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
                <svg
                  className='absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                {loading && (
                  <div className='absolute right-3 top-2.5'>
                    <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
                  </div>
                )}
              </div>
              {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}
            </div>

            {/* Filter Summary */}
            {(selectedCategory || selectedSubCategory || searchTerm) && (
              <div className='text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md mb-4'>
                Showing {products.length} products
                {selectedCategory && (
                  <span>
                    {' '}
                    in <span className='font-medium'>{selectedCategory}</span>
                  </span>
                )}
                {selectedSubCategory && (
                  <span>
                    {' '}
                    → <span className='font-medium'>{selectedSubCategory}</span>
                  </span>
                )}
                {searchTerm && (
                  <span>
                    {' '}
                    matching &ldquo;<span className='font-medium'>{searchTerm}</span>&rdquo;
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                    setSearchTerm('');
                  }}
                  className='ml-2 text-blue-600 hover:text-blue-800 underline'
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            <div className='max-h-[60vh] overflow-y-auto'>
              {loading && products.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto'></div>
                  <p className='mt-2 text-sm text-gray-500'>Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className='grid grid-cols-1 gap-3'>
                  {filteredProducts.map(product => {
                    const inStock = isProductInStock(product);
                    const primaryImage = getProductPrimaryImage(product);

                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedProducts.includes(product.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className='flex items-center space-x-4'>
                          {primaryImage ? (
                            <Image
                              src={primaryImage}
                              alt={product.title}
                              width={64}
                              height={64}
                              className='w-16 h-16 object-cover rounded-md border border-gray-200'
                            />
                          ) : (
                            <div className='w-16 h-16 bg-gray-200 rounded-md border border-gray-200 flex items-center justify-center'>
                              <svg
                                className='w-8 h-8 text-gray-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                />
                              </svg>
                            </div>
                          )}

                          <div className='flex-1 min-w-0'>
                            <h4 className='text-sm font-medium text-gray-900 truncate'>
                              {product.title}
                            </h4>
                            <p className='text-sm text-gray-500'>SKU: {product.sku}</p>
                            <p className='text-sm text-gray-500'>
                              {product.availability === 'In Stock' ? (
                                <span className='text-green-600 font-medium'>In Stock</span>
                              ) : (
                                <span className='text-amber-600 font-medium'>Available to Order</span>
                              )}
                            </p>
                          </div>

                          <div className='flex-shrink-0'>
                            <input
                              type='checkbox'
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProduct(product.id)}
                              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>No products found</h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    {searchTerm ? 'Try adjusting your search terms.' : 'No products available.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='mt-6 flex items-center justify-between pt-4 border-t border-gray-200'>
          <div className='text-sm text-gray-600'>
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
            >
              Cancel
            </button>

            <button
              onClick={handleAddSelected}
              disabled={selectedProducts.length === 0}
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Add to Cart ({selectedProducts.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
