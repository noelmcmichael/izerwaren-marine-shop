#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

class FrontendImageFixService {
  async fixImageHandling() {
    console.log('🔧 Fixing Frontend Image Handling');
    console.log('=================================\n');

    try {
      // Step 1: Update Next.js configuration
      console.log('1. Updating Next.js configuration...');
      await this.updateNextConfig();

      // Step 2: Fix product detail page
      console.log('2. Fixing product detail page...');
      await this.fixProductDetailPage();

      // Step 3: Fix catalog page
      console.log('3. Fixing catalog page...');
      await this.fixCatalogPage();

      // Step 4: Create image utility helper
      console.log('4. Creating image utility helper...');
      await this.createImageUtility();

      console.log('\n✅ Frontend image handling fixed successfully!');
      console.log('   Restart the frontend server to see changes.');

    } catch (error) {
      console.error('❌ Failed to fix frontend image handling:', error);
      throw error;
    }
  }

  private async updateNextConfig() {
    const nextConfigPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/next.config.js';
    
    const updatedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/s/files/**',
      },
      {
        protocol: 'https',
        hostname: 'izerwaren.biz',
        port: '',
        pathname: '/Content/images/**',
      },
    ],
  },

  output: 'standalone',
};

module.exports = nextConfig;`;

    await fs.writeFile(nextConfigPath, updatedConfig);
    console.log('   ✅ Next.js config updated to handle multiple image sources');
  }

  private async createImageUtility() {
    const utilityPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/src/lib/image-utils.ts';
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(utilityPath), { recursive: true });

    const utilityCode = `/**
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
  return \`\${productTitle} - View \${imageIndex + 1}\`;
}`;

    await fs.writeFile(utilityPath, utilityCode);
    console.log('   ✅ Image utility helper created');
  }

  private async fixProductDetailPage() {
    const productPagePath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/src/app/product/[sku]/page.tsx';
    const content = await fs.readFile(productPagePath, 'utf-8');

    // Add import for image utilities
    const updatedContent = content
      .replace(
        "import { useCart } from '../../../providers/CartProvider';",
        `import { useCart } from '../../../providers/CartProvider';
import { getImageUrl, getPrimaryImage, getGalleryImages, transformApiImages, generateAltText } from '../../../lib/image-utils';`
      )
      // Fix the image transformation logic
      .replace(
        /images:\s*apiProduct\.images\?\.\map\(\s*\([^}]+\}\)\s*\) \|\| \[\],/s,
        `images: transformApiImages(apiProduct.images || []),`
      )
      // Fix image rendering in the template
      .replace(
        /src={image\.url}/g,
        'src={getImageUrl(image)}'
      )
      .replace(
        /alt={image\.altText \|\| \`Product image \$\{index \+ 1\}\`}/g,
        'alt={image.altText || generateAltText(product.title, index, image.isPrimary)}'
      );

    await fs.writeFile(productPagePath, updatedContent);
    console.log('   ✅ Product detail page updated to use local images');
  }

  private async fixCatalogPage() {
    const catalogPagePath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/src/app/catalog/page.tsx';
    const content = await fs.readFile(catalogPagePath, 'utf-8');

    // Add import for image utilities
    const updatedContent = content
      .replace(
        "import { useCart } from '../../providers/CartProvider';",
        `import { useCart } from '../../providers/CartProvider';
import { getImageUrl, getPrimaryImage, transformApiImages } from '../../lib/image-utils';`
      )
      // Update the Product interface to include localPath
      .replace(
        /images\?\: Array<\{\s*imageUrl: string;\s*isPrimary: boolean;\s*\}>;/,
        `images?: Array<{
    imageUrl?: string;
    localPath?: string;
    isPrimary: boolean;
  }>;`
      )
      // Fix the getProductImage function
      .replace(
        /const getProductImage = \(product: Product\) => \{[^}]+\};/s,
        `const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const transformedImages = transformApiImages(product.images);
      const primaryImage = getPrimaryImage(transformedImages);
      return primaryImage ? getImageUrl(primaryImage) : null;
    }
    return null;
  };`
      );

    await fs.writeFile(catalogPagePath, updatedContent);
    console.log('   ✅ Catalog page updated to use local images');
  }
}

// Run the fix
async function main() {
  const fixer = new FrontendImageFixService();
  await fixer.fixImageHandling();
}

if (require.main === module) {
  main();
}

export { FrontendImageFixService };