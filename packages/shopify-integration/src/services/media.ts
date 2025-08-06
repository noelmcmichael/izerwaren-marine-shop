import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import type { ShopifyClient } from '../client';
import type { 
  ShopifyImage,
  APICallResult,
  ProcessedImage,
  ImageProcessingOptions
} from '../types/shopify';
import { defaultImageProcessingOptions } from '../types/shopify';

export class MediaService {
  constructor(private client: ShopifyClient) {}

  /**
   * Process and optimize image for Shopify CDN
   */
  async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = defaultImageProcessingOptions
  ): Promise<ProcessedImage> {
    try {
      const inputStats = await fs.stat(inputPath);
      
      // Process image with Sharp
      const sharpInstance = sharp(inputPath);
      
      // Get original metadata (for future use)
      // const metadata = await sharpInstance.metadata();
      
      // Apply processing
      let processed = sharpInstance
        .resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: options.quality,
          progressive: options.progressive
        });

      if (options.stripMetadata) {
        processed = processed.withMetadata({});
      }

      // Save processed image
      const outputInfo = await processed.toFile(outputPath);

      return {
        originalPath: inputPath,
        processedPath: outputPath,
        originalSize: inputStats.size,
        processedSize: outputInfo.size,
        width: outputInfo.width,
        height: outputInfo.height,
        format: outputInfo.format,
      };
    } catch (error) {
      throw new Error(`Failed to process image ${inputPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload image to Shopify product
   */
  async uploadProductImage(
    productId: string,
    imagePath: string,
    position: number = 1,
    altText?: string
  ): Promise<APICallResult<ShopifyImage>> {
    try {
      // Read and encode image as base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      const mutation = `
        mutation productImageCreate($input: ProductImageInput!) {
          productImageCreate(input: $input) {
            image {
              id
              src: url
              altText
              width
              height
              position
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          productId: productId,
          attachment: `data:${mimeType};base64,${base64Image}`,
          altText: altText,
          position: position,
        },
      };

      const response = await this.client.mutation<{
        productImageCreate: {
          image?: ShopifyImage;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(mutation, variables);

      console.log('🔧 DEBUG: Shopify response:', JSON.stringify(response, null, 2));

      if (!response || !response.productImageCreate) {
        return {
          success: false,
          error: 'Invalid response from Shopify API',
        };
      }

      if (response.productImageCreate.userErrors.length > 0) {
        return {
          success: false,
          error: response.productImageCreate.userErrors
            .map(err => err.message)
            .join(', '),
        };
      }

      return {
        success: true,
        data: response.productImageCreate.image!,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Upload multiple images to a product
   */
  async uploadProductImages(
    productId: string,
    imagePaths: string[],
    altTexts?: string[]
  ): Promise<Array<{
    path: string;
    result: APICallResult<ShopifyImage>;
  }>> {
    const results = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const altText = altTexts?.[i];
      const position = i + 1;

      const result = await this.uploadProductImage(
        productId,
        imagePath,
        position,
        altText
      );

      results.push({
        path: imagePath,
        result,
      });

      // Add delay to respect rate limits
      if (i < imagePaths.length - 1) {
        await this.delay(500); // 500ms delay between uploads
      }
    }

    return results;
  }

  /**
   * Delete product image from Shopify
   */
  async deleteProductImage(
    productId: string,
    imageId: string
  ): Promise<APICallResult<boolean>> {
    try {
      const mutation = `
        mutation productImageDelete($input: ProductImageDeleteInput!) {
          productImageDelete(input: $input) {
            deletedImageId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          productId: productId,
          id: imageId,
        },
      };

      const response = await this.client.mutation<{
        productImageDelete: {
          deletedImageId?: string;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(mutation, variables);

      if (response.productImageDelete.userErrors.length > 0) {
        return {
          success: false,
          error: response.productImageDelete.userErrors
            .map(err => err.message)
            .join(', '),
        };
      }

      return {
        success: true,
        data: !!response.productImageDelete.deletedImageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get product images from Shopify
   */
  async getProductImages(productId: string): Promise<APICallResult<ShopifyImage[]>> {
    try {
      const query = `
        query getProductImages($id: ID!) {
          product(id: $id) {
            images(first: 250) {
              edges {
                node {
                  id
                  src: url
                  altText
                  width
                  height
                  position
                }
              }
            }
          }
        }
      `;

      const response = await this.client.query<{
        product: {
          images: {
            edges: Array<{ node: ShopifyImage }>;
          };
        };
      }>(query, { id: productId });

      return {
        success: true,
        data: response.product.images.edges.map(edge => edge.node),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch process images for migration
   */
  async batchProcessImages(
    images: Array<{ localPath: string; outputPath: string }>,
    options: ImageProcessingOptions = defaultImageProcessingOptions,
    maxConcurrency: number = 5
  ): Promise<Array<{
    localPath: string;
    result: ProcessedImage | Error;
  }>> {
    const results = [];
    // const semaphore = new Array(maxConcurrency).fill(null);

    const processImage = async (imageInfo: { localPath: string; outputPath: string }) => {
      try {
        const result = await this.processImage(
          imageInfo.localPath,
          imageInfo.outputPath,
          options
        );
        return { localPath: imageInfo.localPath, result };
      } catch (error) {
        return {
          localPath: imageInfo.localPath,
          result: error as Error,
        };
      }
    };

    // Process images in batches with concurrency control
    for (let i = 0; i < images.length; i += maxConcurrency) {
      const batch = images.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(processImage);
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Validate image file
   */
  async validateImage(imagePath: string): Promise<{
    isValid: boolean;
    errors: string[];
    metadata?: sharp.Metadata;
  }> {
    const errors: string[] = [];

    try {
      // Check if file exists
      await fs.access(imagePath);

      // Get image metadata
      const metadata = await sharp(imagePath).metadata();

      // Validate format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        errors.push(`Unsupported image format: ${metadata.format}`);
      }

      // Validate dimensions
      if (!metadata.width || !metadata.height) {
        errors.push('Unable to determine image dimensions');
      } else {
        if (metadata.width < 1 || metadata.height < 1) {
          errors.push('Image dimensions must be at least 1x1 pixels');
        }
        if (metadata.width > 5760 || metadata.height > 5760) {
          errors.push('Image dimensions cannot exceed 5760x5760 pixels');
        }
      }

      // Validate file size (Shopify limit is 20MB)
      const stats = await fs.stat(imagePath);
      if (stats.size > 20 * 1024 * 1024) {
        errors.push('Image file size cannot exceed 20MB');
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata,
      };
    } catch (error) {
      errors.push(`Unable to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Generate image variants for responsive display
   */
  async generateImageVariants(
    inputPath: string,
    outputDir: string,
    variants: Array<{ suffix: string; width: number; height?: number; quality?: number }>
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const inputStats = await fs.stat(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const extension = path.extname(inputPath);

    for (const variant of variants) {
      const outputPath = path.join(
        outputDir,
        `${baseName}_${variant.suffix}${extension}`
      );

      try {
        const sharpInstance = sharp(inputPath);
        
        let processed = sharpInstance.resize(variant.width, variant.height, {
          fit: 'inside',
          withoutEnlargement: true
        });

        if (variant.quality) {
          processed = processed.jpeg({ quality: variant.quality });
        }

        const outputInfo = await processed.toFile(outputPath);

        results.push({
          originalPath: inputPath,
          processedPath: outputPath,
          originalSize: inputStats.size,
          processedSize: outputInfo.size,
          width: outputInfo.width,
          height: outputInfo.height,
          format: outputInfo.format,
        });
      } catch (error) {
        console.error(`Failed to generate variant ${variant.suffix}:`, error);
      }
    }

    return results;
  }

  /**
   * Clean up temporary processed images
   */
  async cleanupTempImages(imagePaths: string[]): Promise<void> {
    await Promise.all(
      imagePaths.map(async (imagePath) => {
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          console.warn(`Failed to cleanup temp image ${imagePath}:`, error);
        }
      })
    );
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Add delay between API calls
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate image compression ratio
   */
  calculateCompressionRatio(original: ProcessedImage): number {
    return (1 - (original.processedSize / original.originalSize)) * 100;
  }

  /**
   * Get optimal image processing settings based on image size
   */
  getOptimalProcessingOptions(width: number, height: number): ImageProcessingOptions {
    const totalPixels = width * height;
    
    if (totalPixels > 4000000) { // > 4MP
      return {
        ...defaultImageProcessingOptions,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 85,
      };
    } else if (totalPixels > 1000000) { // > 1MP
      return {
        ...defaultImageProcessingOptions,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 90,
      };
    } else {
      return defaultImageProcessingOptions;
    }
  }
}