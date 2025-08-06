'use client';

import React from 'react';

import { PricingDisplay } from './PricingDisplay';
import { TechnicalSpecsTable } from './TechnicalSpecsTable';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductDisplayProps } from './types';
import { useProductImagesSWR } from '../../services/products';

/**
 * Simple product view for products without variants (direct add-to-cart)
 */
export function SimpleProductView({
  product,
  account,
  onAddToCart,
  onRequestQuote,
}: ProductDisplayProps) {
  // Fetch product images
  const { images, isLoading: imagesLoading } = useProductImagesSWR(Number(product.id));
  
  const handleAddToCart = () => {
    onAddToCart?.();
  };

  const handleRequestQuote = () => {
    onRequestQuote?.();
  };

  return (
    <div className='simple-product-view'>
      {/* Product Header */}
      <div className='product-header mb-6'>
        <div className='flex flex-wrap items-start gap-4 mb-4'>
          <span className='text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded'>
            SKU: {product.sku}
          </span>
          <span className='text-sm bg-green-100 text-green-800 px-2 py-1 rounded'>
            Simple Product
          </span>
        </div>

        <h1 className='text-3xl font-bold text-gray-900 mb-2'>{product.title}</h1>

        {product.description && (
          <div className='text-gray-600 mb-4'>
            <p>{product.description}</p>
          </div>
        )}
      </div>

      {/* Product Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2'>
          {/* Product Image Gallery */}
          <div className='mb-6'>
            {imagesLoading ? (
              <div className='aspect-square bg-gray-200 rounded-lg animate-pulse flex items-center justify-center'>
                <div className='text-gray-400'>Loading images...</div>
              </div>
            ) : (
              <ProductImageGallery 
                images={images} 
                productTitle={product.title}
                className='max-w-lg mx-auto lg:mx-0'
              />
            )}
          </div>

          {/* Technical Specifications */}
          {product.technicalSpecs && product.technicalSpecs.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-xl font-semibold mb-4'>Technical Specifications</h3>
              <TechnicalSpecsTable specifications={product.technicalSpecs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4'>
            {/* Pricing */}
            <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
              <PricingDisplay
                basePrice={product.price}
                retailPrice={product.retailPrice}
                account={account}
                priceModifiers={0}
              />

              {/* Add to Cart Section */}
              <div className='mt-6 space-y-3'>
                <button
                  onClick={handleAddToCart}
                  className='w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleRequestQuote}
                  className='w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors'
                >
                  Request Quote
                </button>
              </div>

              {/* Product Info */}
              <div className='mt-6 text-sm text-gray-600 space-y-2'>
                <div className='flex justify-between'>
                  <span>Product Type:</span>
                  <span>Simple</span>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className='flex justify-between'>
                    <span>Category:</span>
                    <span>{product.tags[0]}</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span>Status:</span>
                  <span className='capitalize'>{product.status}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>Product Information</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Professional marine hardware</li>
                <li>• Ready to ship</li>
                <li>• No configuration required</li>
                <li>• Compatible with standard installations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleProductView;
