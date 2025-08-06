/**
 * Test Page for Task 9.5 Features
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Simple test page to verify the new functionality works.
 */

'use client';

// Force dynamic rendering for test pages
export const dynamic = 'force-dynamic';

import React from 'react';
import { useComparison } from '@/hooks/useComparison';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { ProductSummary } from '@/lib/types';

export default function TestTask95Page() {
  const { products, addProduct, removeProduct, clearComparison } = useComparison();
  const { items, addRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Test product
  const testProduct: ProductSummary = {
    id: 'test-1',
    title: 'Test Marine Hardware',
    sku: 'TEST-001',
    price: '29.99',
    vendor: 'Test Vendor',
    imageUrl: '/images/placeholder.jpg',
  };

  const handleAddToComparison = () => {
    addProduct(testProduct);
  };

  const handleAddToRecentlyViewed = () => {
    addRecentlyViewed(testProduct);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Task 9.5 Test Page
        </h1>

        {/* Comparison Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Product Comparison Test
          </h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={handleAddToComparison}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Test Product to Comparison
              </button>
              
              <button
                onClick={clearComparison}
                className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Comparison
              </button>
            </div>
            
            <div>
              <p className="text-gray-700">
                Products in comparison: <strong>{products.length}</strong>
              </p>
              {products.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {products.map(product => (
                    <li key={product.id} className="text-sm text-gray-600">
                      • {product.title} ({product.sku})
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Recently Viewed Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recently Viewed Test
          </h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={handleAddToRecentlyViewed}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Test Product to Recently Viewed
              </button>
              
              <button
                onClick={clearRecentlyViewed}
                className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Recently Viewed
              </button>
            </div>
            
            <div>
              <p className="text-gray-700">
                Recently viewed items: <strong>{items.length}</strong>
              </p>
              {items.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {items.slice(0, 5).map(item => (
                    <li key={`${item.productId}-${item.viewedAt.getTime()}`} className="text-sm text-gray-600">
                      • {item.title} ({item.sku}) - {item.viewedAt.toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}