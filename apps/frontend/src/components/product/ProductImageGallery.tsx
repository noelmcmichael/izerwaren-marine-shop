'use client';

import React, { useState } from 'react';
import { MediaAsset } from '../../lib/types';
import { ProductDetailImage, ProductThumbnailImage } from '../shared/ShopifyImage';

interface ProductImageGalleryProps {
  images: MediaAsset[];
  productTitle: string;
  className?: string;
}

/**
 * Product Image Gallery Component
 * 
 * Features:
 * - Primary image display with zoom capability
 * - Thumbnail navigation  
 * - Responsive design for mobile/desktop
 * - Shopify CDN optimization
 * - Fallback for missing images
 */
export function ProductImageGallery({ 
  images, 
  productTitle, 
  className = '' 
}: ProductImageGalleryProps) {
  // Filter and sort images by order
  const sortedImages = images
    .filter(image => image.asset_type === 'primary' || image.asset_type === 'gallery')
    .sort((a, b) => (a.image_order || 0) - (b.image_order || 0));

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Use first image if available, or create a placeholder
  const activeImage = sortedImages[activeImageIndex];
  const hasImages = sortedImages.length > 0;

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
    setIsZoomed(false);
  };

  const handleMainImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    } else if (event.key === 'ArrowRight' && activeImageIndex < sortedImages.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    } else if (event.key === 'Escape') {
      setIsZoomed(false);
    }
  };

  if (!hasImages) {
    // Fallback when no images are available
    return (
      <div className={`product-image-gallery ${className}`}>
        <div className='main-image-container'>
          <div className='aspect-square relative bg-gray-100 rounded-lg flex items-center justify-center'>
            <div className='text-center text-gray-500'>
              <svg className='w-24 h-24 mx-auto mb-4' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-lg font-medium'>No Images Available</p>
              <p className='text-sm'>{productTitle}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-image-gallery ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Image Display */}
      <div className='main-image-container mb-4'>
        <div 
          className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-transform ${
            isZoomed ? 'scale-110' : 'hover:scale-105'
          }`}
          onClick={handleMainImageClick}
        >
          <ProductDetailImage
            src={activeImage.file_url}
            alt={`${productTitle} - Image ${activeImageIndex + 1}`}
            className='object-cover'
            priority={activeImageIndex === 0}
          />
          
          {/* Zoom indicator */}
          <div className='absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' />
            </svg>
          </div>

          {/* Image counter */}
          {sortedImages.length > 1 && (
            <div className='absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm'>
              {activeImageIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>

        {/* Navigation arrows for mobile */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={() => handleThumbnailClick(Math.max(0, activeImageIndex - 1))}
              disabled={activeImageIndex === 0}
              className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30 md:hidden'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
              </svg>
            </button>
            
            <button
              onClick={() => handleThumbnailClick(Math.min(sortedImages.length - 1, activeImageIndex + 1))}
              disabled={activeImageIndex === sortedImages.length - 1}
              className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full disabled:opacity-30 md:hidden'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {sortedImages.length > 1 && (
        <div className='thumbnails-container'>
          <div className='flex space-x-2 overflow-x-auto pb-2'>
            {sortedImages.map((image, index) => (
              <button
                key={`${image.id}-${index}`}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 relative rounded-md overflow-hidden transition-all ${
                  index === activeImageIndex 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:opacity-80'
                }`}
              >
                <ProductThumbnailImage
                  src={image.file_url}
                  alt={`${productTitle} - Thumbnail ${index + 1}`}
                  className='object-cover'
                  isActive={index === activeImageIndex}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Details */}
      <div className='image-info mt-4 text-sm text-gray-600'>
        <div className='flex items-center justify-between'>
          <span>
            {activeImage.asset_type === 'primary' ? 'Primary Image' : 'Gallery Image'}
          </span>
          <span>
            {activeImage.file_size && `${Math.round(activeImage.file_size / 1024)} KB`}
          </span>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center'
          onClick={() => setIsZoomed(false)}
        >
          <div className='max-w-4xl max-h-full p-4'>
            <img
              src={activeImage.file_url}
              alt={`${productTitle} - Zoomed`}
              className='max-w-full max-h-full object-contain'
            />
          </div>
          <button
            onClick={() => setIsZoomed(false)}
            className='absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for product cards and smaller displays
 */
export function CompactProductImageGallery({ 
  images, 
  productTitle, 
  className = '' 
}: ProductImageGalleryProps) {
  const primaryImage = images.find(img => img.asset_type === 'primary') || images[0];
  
  if (!primaryImage) {
    return (
      <div className={`aspect-square relative bg-gray-100 rounded ${className}`}>
        <div className='w-full h-full flex items-center justify-center text-gray-400'>
          <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-square relative bg-gray-100 rounded overflow-hidden ${className}`}>
      <ProductDetailImage
        src={primaryImage.file_url}
        alt={productTitle}
        className='object-cover'
      />
      {images.length > 1 && (
        <div className='absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
          +{images.length - 1}
        </div>
      )}
    </div>
  );
}

export default ProductImageGallery;