/**
 * Shopify CDN Image Utilities
 * 
 * Handles URL transformations and optimizations for Shopify CDN images
 * after migration from local PostgreSQL storage to Shopify CDN.
 */

export interface ShopifyImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'webp' | 'png';
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Determines if a URL is a Shopify CDN URL
 */
export function isShopifyImage(url: string): boolean {
  return url.includes('cdn.shopify.com');
}

/**
 * Transforms a Shopify CDN URL with optimization parameters
 * 
 * Example:
 * Original: https://cdn.shopify.com/s/files/1/0699/9330/0015/files/product-123.jpg?v=1234567
 * Optimized: https://cdn.shopify.com/s/files/1/0699/9330/0015/files/product-123_400x400_crop_center.jpg?v=1234567
 */
export function optimizeShopifyImage(
  url: string, 
  options: ShopifyImageOptions = {}
): string {
  if (!isShopifyImage(url)) {
    // Return original URL if not a Shopify image
    return url;
  }

  const { width, height, quality, format, crop = 'center' } = options;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Extract filename and extension
    const pathParts = pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const filenameParts = filename.split('.');
    const name = filenameParts[0];
    const extension = filenameParts[1] || 'jpg';
    
    // Build transformation string
    let transformations: string[] = [];
    
    if (width && height) {
      transformations.push(`${width}x${height}`);
      transformations.push(`crop_${crop}`);
    } else if (width) {
      transformations.push(`${width}x`);
    } else if (height) {
      transformations.push(`x${height}`);
    }
    
    if (quality && quality < 100) {
      transformations.push(`q_${quality}`);
    }
    
    // Use specified format or keep original
    const finalExtension = format || extension;
    
    // Construct optimized filename
    let optimizedFilename = name;
    if (transformations.length > 0) {
      optimizedFilename += `_${transformations.join('_')}`;
    }
    optimizedFilename += `.${finalExtension}`;
    
    // Rebuild URL
    const newPathParts = [...pathParts];
    newPathParts[newPathParts.length - 1] = optimizedFilename;
    
    const optimizedUrl = new URL(urlObj);
    optimizedUrl.pathname = newPathParts.join('/');
    
    return optimizedUrl.toString();
  } catch (error) {
    console.warn('Failed to optimize Shopify image URL:', error);
    return url;
  }
}

/**
 * Generates multiple sizes for responsive images
 */
export function generateShopifyImageSrcSet(
  url: string,
  sizes: Array<{ width: number; descriptor: string }>
): string {
  if (!isShopifyImage(url)) {
    return url;
  }
  
  return sizes
    .map(({ width, descriptor }) => {
      const optimizedUrl = optimizeShopifyImage(url, { width, quality: 85 });
      return `${optimizedUrl} ${descriptor}`;
    })
    .join(', ');
}

/**
 * Standard image sizes for product images
 */
export const PRODUCT_IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 400, height: 400 },
  detail: { width: 800, height: 800 },
  gallery: { width: 1200, height: 1200 },
  fullsize: { width: 2048, height: 2048 },
} as const;

/**
 * Standard responsive sizes configuration
 */
export const RESPONSIVE_SIZES = [
  { width: 150, descriptor: '150w' },
  { width: 300, descriptor: '300w' },
  { width: 400, descriptor: '400w' },
  { width: 600, descriptor: '600w' },
  { width: 800, descriptor: '800w' },
  { width: 1200, descriptor: '1200w' },
];

/**
 * Gets the appropriate image URL for a specific use case
 */
export function getProductImageUrl(
  url: string,
  size: keyof typeof PRODUCT_IMAGE_SIZES = 'card',
  options: Omit<ShopifyImageOptions, 'width' | 'height'> = {}
): string {
  if (!url) return '';
  
  if (!isShopifyImage(url)) {
    // Return original URL for non-Shopify images (fallback)
    return url;
  }
  
  const dimensions = PRODUCT_IMAGE_SIZES[size];
  return optimizeShopifyImage(url, {
    ...dimensions,
    quality: 85,
    format: 'webp',
    ...options,
  });
}

/**
 * Creates a fallback image URL for missing or broken images
 */
export function getFallbackImageUrl(size: keyof typeof PRODUCT_IMAGE_SIZES = 'card'): string {
  // Return a data URL for a simple placeholder SVG
  const dimensions = PRODUCT_IMAGE_SIZES[size];
  const { width, height } = dimensions;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="16">
        No Image
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Handles image loading errors with fallback
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl?: string
): void {
  const img = event.currentTarget;
  if (fallbackUrl) {
    img.src = fallbackUrl;
  } else {
    img.src = getFallbackImageUrl();
  }
}

/**
 * Migration helper: Converts old local URLs to Shopify CDN URLs
 * This function helps identify and handle images that haven't been migrated yet
 */
export function migrateImageUrl(url: string): {
  url: string;
  isShopify: boolean;
  needsMigration: boolean;
} {
  const isShopify = isShopifyImage(url);
  const needsMigration = !isShopify && !url.startsWith('data:') && !url.startsWith('/');
  
  return {
    url: isShopify ? url : url,
    isShopify,
    needsMigration,
  };
}