'use client';

import React from 'react';
import { Product, formatPrice, slugify } from '../../lib/types';
import Link from 'next/link';
import { useProductImagesSWR } from '../../services/products';
import { ProductCardImage } from '../shared/ShopifyImage';
import { config } from '@/lib/config';

interface EnhancedProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

/**
 * Enhanced Product Card with Automatic Image Fetching
 * 
 * Features:
 * - Automatic image fetching via SWR
 * - Shopify CDN optimization
 * - Fallback for missing images
 * - Loading states
 * - B2B pricing display
 */
export function EnhancedProductCard({ 
  product, 
  className = '',
  priority = false 
}: EnhancedProductCardProps) {
  const { images, isLoading: imagesLoading } = useProductImagesSWR(product.id);
  
  // Get primary image or first image
  const primaryImage = images.find(img => img.asset_type === 'primary') || images[0];
  
  const productUrl = `/product/${product.id}/${slugify(product.title)}`;

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${className}`}
    >
      <Link href={productUrl}>
        <div className='aspect-square relative bg-gray-100'>
          {imagesLoading ? (
            // Loading skeleton
            <div className='w-full h-full flex items-center justify-center'>
              <div className='animate-pulse bg-gray-200 w-full h-full'></div>
            </div>
          ) : (
            <ProductCardImage
              src={primaryImage?.file_url || ''}
              alt={product.title}
              className='object-cover'
              priority={priority}
            />
          )}
          
          {/* Image count badge */}
          {images.length > 1 && (
            <div className='absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
              +{images.length - 1}
            </div>
          )}
        </div>
      </Link>

      <div className='p-4'>
        {/* Product Header */}
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1'>
            <Link href={productUrl}>
              <h3 className='font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2'>
                {product.title}
              </h3>
            </Link>
            <p className='text-sm text-gray-500 mt-1'>SKU: {product.sku}</p>
          </div>
          <div className='ml-4 text-right'>
            <p className='text-lg font-semibold text-gray-900'>
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
            {product.description}
          </p>
        )}

        {/* Product Meta */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              {product.category_name}
            </span>
            {product.manufacturer && (
              <span className='text-xs text-gray-500'>{product.manufacturer}</span>
            )}
          </div>

          {/* Status Indicator */}
          <div className='flex items-center space-x-1'>
            {product.status === 'active' ? (
              <span className='inline-flex items-center text-xs text-green-600'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-1'></div>
                In Stock
              </span>
            ) : (
              <span className='inline-flex items-center text-xs text-gray-500'>
                <div className='w-2 h-2 bg-gray-400 rounded-full mr-1'></div>
                {product.status === 'draft' ? 'Coming Soon' : 'Unavailable'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-2'>
          <Link
            href={productUrl}
            className='flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors'
          >
            View Details
          </Link>
          <button 
            className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement add to quote functionality
            }}
          >
            Add to Quote
          </button>
        </div>

        {/* Shopify CDN Badge (development only) */}
        {config.isDevelopment && primaryImage && (
          <div className='mt-2 text-xs text-gray-400'>
            {primaryImage.file_url.includes('cdn.shopify.com') ? (
              <span className='text-green-600'>✅ Shopify CDN</span>
            ) : (
              <span className='text-orange-600'>⚠️ Legacy URL</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedProductCard;