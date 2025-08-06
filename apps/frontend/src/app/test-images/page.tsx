'use client';

// Force dynamic rendering for test pages
export const dynamic = 'force-dynamic';

import React from 'react';
import { ShopifyImage, ProductCardImage } from '../../components/shared/ShopifyImage';

// Test data with actual Shopify CDN URLs from our migration  
const testImages = [
  {
    id: 1,
    name: 'Real Shopify CDN Image #1',
    url: 'https://cdn.shopify.com/s/files/1/0699/9330/0015/files/a402bce5-1bfb-434d-af3d-3b61b259d195_0b363301-6e20-4642-8fae-88fc61e66a74.jpg?v=1754134648',
    description: 'Actual migrated product image from database'
  },
  {
    id: 2,
    name: 'Real Shopify CDN Image #2',
    url: 'https://cdn.shopify.com/s/files/1/0699/9330/0015/files/ceb408e5-b453-4678-8be6-4ab25a0710a1.jpg?v=1754100779',
    description: 'Testing optimization and caching'
  },
  {
    id: 3,
    name: 'Fallback Test',
    url: '',
    description: 'Testing fallback for missing images'
  }
];

export default function TestImagesPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Shopify Image Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testImages.map((image) => (
          <div key={image.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">{image.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{image.description}</p>
            
            {/* Test ProductCardImage component */}
            <div className="aspect-square relative bg-gray-100 rounded mb-4">
              <ProductCardImage
                src={image.url}
                alt={image.name}
                className="object-cover rounded"
              />
            </div>
            
            {/* URL info */}
            <div className="text-xs text-gray-500 break-all">
              {image.url}
            </div>
            
            {/* Test different sizes */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Size Tests:</div>
              <div className="flex space-x-2">
                <div className="w-16 h-16 relative bg-gray-100">
                  <ShopifyImage
                    src={image.url}
                    alt={`${image.name} - thumbnail`}
                    size="thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-24 h-24 relative bg-gray-100">
                  <ShopifyImage
                    src={image.url}
                    alt={`${image.name} - card`}
                    size="card"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Performance test */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Performance Test</h2>
        <p className="text-gray-600 mb-4">
          Testing image loading performance with multiple sizes and formats.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-square relative bg-gray-100 rounded">
              <ProductCardImage
                src=""
                alt={`Fallback test ${i + 1}`}
                className="object-cover rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex space-x-4">
        <a 
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ← Back to Home
        </a>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🔄 Reload Test
        </button>
      </div>
    </div>
  );
}