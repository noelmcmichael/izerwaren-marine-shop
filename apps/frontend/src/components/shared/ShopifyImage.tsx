'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { config } from '@/lib/config';
import {
  getProductImageUrl,
  getFallbackImageUrl,
  PRODUCT_IMAGE_SIZES,
  type ShopifyImageOptions,
  migrateImageUrl,
} from '../../utils/shopify-images';

interface ShopifyImageProps {
  src: string;
  alt: string;
  size?: keyof typeof PRODUCT_IMAGE_SIZES;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  sizes?: string;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  optimizationOptions?: Omit<ShopifyImageOptions, 'width' | 'height'>;
}

/**
 * Optimized Shopify Image Component
 * 
 * Features:
 * - Automatic Shopify CDN optimization
 * - Responsive image generation
 * - Fallback handling for missing images  
 * - Migration detection for legacy URLs
 * - Next.js Image optimization integration
 */
export function ShopifyImage({
  src,
  alt,
  size = 'card',
  className,
  priority = false,
  fill = false,
  width,
  height,
  quality = 85,
  sizes,
  onError,
  optimizationOptions = {},
}: ShopifyImageProps) {
  const [imageError, setImageError] = useState(false);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);

  // Analyze the source URL
  const migration = migrateImageUrl(src);
  
  // Show migration warning in development
  if (migration.needsMigration && config.isDevelopment && !showMigrationWarning) {
    console.warn('Image needs migration to Shopify CDN:', src);
    setShowMigrationWarning(true);
  }

  // Handle image loading errors
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    if (onError) {
      onError(event);
    }
  }, [onError]);

  // If we have an error or empty src, show fallback
  if (imageError || !src) {
    const fallbackUrl = getFallbackImageUrl(size);
    const fallbackDimensions = PRODUCT_IMAGE_SIZES[size];
    
    return (
      <Image
        src={fallbackUrl}
        alt={alt || 'Product image not available'}
        width={width || fallbackDimensions.width}
        height={height || fallbackDimensions.height}
        className={className}
        priority={priority}
      />
    );
  }

  // For fill mode
  if (fill) {
    const optimizedSrc = migration.isShopify 
      ? getProductImageUrl(src, size, { quality, ...optimizationOptions })
      : src;

    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        quality={quality}
        sizes={sizes || `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
        onError={handleError}
      />
    );
  }

  // For fixed dimensions
  const dimensions = PRODUCT_IMAGE_SIZES[size];
  const finalWidth = width || dimensions.width;
  const finalHeight = height || dimensions.height;

  let optimizedSrc = src;

  if (migration.isShopify) {
    // Generate optimized URL for Shopify images
    optimizedSrc = getProductImageUrl(src, size, { quality, ...optimizationOptions });
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes || `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`}
      onError={handleError}
    />
  );
}

/**
 * Specialized component for product card images
 */
export function ProductCardImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <ShopifyImage
      src={src}
      alt={alt}
      size="card"
      fill
      className={className}
      priority={priority}
      optimizationOptions={{ format: 'webp', crop: 'center' }}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

/**
 * Specialized component for product detail images
 */
export function ProductDetailImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <ShopifyImage
      src={src}
      alt={alt}
      size="detail"
      fill
      className={className}
      priority={priority}
      optimizationOptions={{ format: 'webp', crop: 'center' }}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
    />
  );
}

/**
 * Gallery thumbnail component
 */
export function ProductThumbnailImage({
  src,
  alt,
  className,
  isActive = false,
}: {
  src: string;
  alt: string;
  className?: string;
  isActive?: boolean;
}) {
  return (
    <ShopifyImage
      src={src}
      alt={alt}
      size="thumbnail"
      className={`${className} ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      optimizationOptions={{ format: 'webp', crop: 'center' }}
    />
  );
}

export default ShopifyImage;