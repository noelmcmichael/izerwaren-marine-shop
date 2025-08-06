/**
 * Image utilities for handling product images from different sources
 */

export interface ProductImage {
  id: string;
  imageUrl?: string;    // External URL (fallback)
  localPath?: string;   // Local path (preferred)
  isPrimary: boolean;
  altText?: string;
}

/**
 * Get the best available image URL for a product image
 * Prioritizes local paths over external URLs
 */
export function getImageUrl(image: ProductImage): string {
  // Priority: localPath > imageUrl > fallback
  if (image.localPath) {
    return image.localPath;
  }
  
  if (image.imageUrl) {
    return image.imageUrl;
  }
  
  // Fallback placeholder
  return '/images/placeholder-product.jpg';
}

/**
 * Get the primary image from an array of product images
 */
export function getPrimaryImage(images: ProductImage[]): ProductImage | null {
  if (!images || images.length === 0) {
    return null;
  }
  
  // Find primary image
  const primary = images.find(img => img.isPrimary);
  if (primary) {
    return primary;
  }
  
  // Fallback to first image
  return images[0];
}

/**
 * Get all gallery images (non-primary) from an array of product images
 */
export function getGalleryImages(images: ProductImage[]): ProductImage[] {
  if (!images || images.length === 0) {
    return [];
  }
  
  return images.filter(img => !img.isPrimary);
}

/**
 * Transform API image response to frontend format
 */
export function transformApiImages(apiImages: any[]): ProductImage[] {
  if (!apiImages || !Array.isArray(apiImages)) {
    return [];
  }
  
  return apiImages.map(img => ({
    id: img.id,
    imageUrl: img.imageUrl,
    localPath: img.localPath,
    isPrimary: img.isPrimary || false,
    altText: img.altText || undefined,
  }));
}

/**
 * Check if an image path is a local path
 */
export function isLocalImage(imagePath: string): boolean {
  return imagePath.startsWith('/') || imagePath.startsWith('./');
}

/**
 * Generate alt text for product images
 */
export function generateAltText(productTitle: string, imageIndex: number, isPrimary: boolean): string {
  if (isPrimary) {
    return productTitle;
  }
  return `${productTitle} - View ${imageIndex + 1}`;
}