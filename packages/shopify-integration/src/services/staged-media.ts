import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import type { ShopifyClient } from '../client';

export interface StagedUploadResult {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  error?: string;
}

export class StagedMediaService {
  constructor(private client: ShopifyClient) {}

  /**
   * Upload image using Shopify's staged upload process
   */
  async uploadProductImage(
    productId: string,
    imagePath: string,
    altText?: string
  ): Promise<StagedUploadResult> {
    try {
      // Step 1: Read and validate image
      const imageBuffer = await fs.readFile(imagePath);
      const filename = path.basename(imagePath);
      const metadata = await sharp(imagePath).metadata();
      
      if (!metadata.format) {
        throw new Error('Invalid image format');
      }

      // Step 2: Create staged upload
      const stagedUploadResponse = await this.createStagedUpload(filename, imageBuffer.length);
      
      if (!stagedUploadResponse.success || !stagedUploadResponse.stagedTarget) {
        throw new Error(stagedUploadResponse.error || 'Failed to create staged upload');
      }

      // Step 3: Upload file to staged URL
      await this.uploadToStagedUrl(stagedUploadResponse.stagedTarget, imageBuffer, filename);

      // Step 4: Create product media from staged upload
      const mediaResult = await this.createProductMediaFromStaged(
        productId,
        stagedUploadResponse.stagedTarget.resourceUrl,
        altText
      );

      return mediaResult;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Step 1: Create staged upload URL
   */
  private async createStagedUpload(filename: string, fileSize: number): Promise<{
    success: boolean;
    stagedTarget?: any;
    error?: string;
  }> {
    try {
      const mutation = `
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: [{
          resource: "IMAGE",
          filename: filename,
          mimeType: this.getMimeType(filename),
          fileSize: fileSize.toString(),
          httpMethod: "POST"  // Explicitly specify POST method
        }]
      };

      console.log(`📤 Creating staged upload for ${filename} (${fileSize} bytes)`);

      const response = await this.client.mutation<{
        stagedUploadsCreate: {
          stagedTargets: any[];
          userErrors: Array<{ field: string; message: string }>;
        };
      }>(mutation, variables);

      if (response.stagedUploadsCreate.userErrors.length > 0) {
        const errorMsg = response.stagedUploadsCreate.userErrors
          .map(err => err.message)
          .join(', ');
        console.error(`❌ Staged upload creation failed: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }

      const stagedTarget = response.stagedUploadsCreate.stagedTargets[0];
      if (!stagedTarget) {
        console.error('❌ No staged target received from Shopify');
        return {
          success: false,
          error: 'No staged target received',
        };
      }

      const provider = stagedTarget.url.includes('googleapis.com') ? 'Google Cloud' : 'AWS S3';
      console.log(`✅ Staged upload created (${provider}): ${stagedTarget.url.substring(0, 50)}...`);

      return {
        success: true,
        stagedTarget,
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create staged upload';
      console.error(`❌ Staged upload creation error: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Step 2: Upload file to staged URL
   */
  private async uploadToStagedUrl(stagedTarget: any, imageBuffer: Buffer, filename: string): Promise<void> {
    try {
      const isGoogleCloud = stagedTarget.url.includes('googleapis.com');
      console.log(`📤 Uploading ${filename} to ${isGoogleCloud ? 'Google Cloud' : 'AWS S3'}...`);
      
      // Log parameters for debugging
      console.log('🔧 Upload parameters:', stagedTarget.parameters.map((p: any) => `${p.name}=${p.value.substring(0, 20)}...`));
      
      // Create form data for upload
      const formData = new FormData();
      
      // Add parameters from staged upload first (order matters for GCS)
      stagedTarget.parameters.forEach((param: any) => {
        formData.append(param.name, param.value);
      });
      
      // Add file last with proper filename
      const blob = new Blob([imageBuffer], { type: this.getMimeType(filename) });
      formData.append('file', blob, filename);
      
      // Determine headers based on provider (AWS vs Google Cloud)
      const headers: Record<string, string> = {};
      
      // For Google Cloud Storage, don't add Content-Length or Content-Type
      // The browser/fetch will set these automatically
      if (!isGoogleCloud) {
        // Only for AWS S3 uploads
        headers['Content-Length'] = (imageBuffer.length + 5000).toString();
        console.log('🔧 Added Content-Length header for AWS S3');
      } else {
        console.log('🔧 Using default headers for Google Cloud Storage');
      }
      
      // Upload to staged URL
      console.log(`📡 Making POST request to: ${stagedTarget.url.substring(0, 50)}...`);
      const uploadResponse = await fetch(stagedTarget.url, {
        method: 'POST',
        body: formData,
        headers
      });
      
      console.log(`📡 Upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);
      
      if (!uploadResponse.ok) {
        const responseText = await uploadResponse.text();
        console.error(`❌ Upload failed with response: ${responseText}`);
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${responseText}`);
      }
      
      // Try to get response body for debugging
      const responseText = await uploadResponse.text();
      if (responseText) {
        console.log(`📄 Upload response body: ${responseText.substring(0, 200)}...`);
      }
      
      console.log(`✅ Successfully uploaded ${filename} to staged URL`);
      
    } catch (error) {
      console.error(`❌ Staged upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Staged upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 3: Create product media from staged upload using productUpdate mutation
   */
  private async createProductMediaFromStaged(
    productId: string,
    resourceUrl: string,
    altText?: string
  ): Promise<StagedUploadResult> {
    try {
      const mutation = `
        mutation productUpdate($product: ProductUpdateInput!, $media: [CreateMediaInput!]!) {
          productUpdate(product: $product, media: $media) {
            product {
              id
              media(first: 10) {
                nodes {
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const variables = {
        product: {
          id: productId
        },
        media: [{
          originalSource: resourceUrl,
          alt: altText || 'Product Image',
          mediaContentType: 'IMAGE'
        }]
      };

      console.log(`📝 Adding product media to product ${productId}`);
      console.log(`📎 Resource URL: ${resourceUrl.substring(0, 80)}...`);

      const response = await this.client.mutation<{
        productUpdate: {
          product: {
            id: string;
            media: {
              nodes: Array<{
                id: string;
                image: {
                  url: string;
                  altText: string;
                  width?: number;
                  height?: number;
                };
              }>;
            };
          };
          userErrors: Array<{ field: string; message: string }>;
        };
      }>(mutation, variables);

      if (!response || !response.productUpdate) {
        console.error('❌ Invalid GraphQL response structure:', response);
        return {
          success: false,
          error: 'Invalid response from Shopify GraphQL API',
        };
      }

      if (response.productUpdate.userErrors.length > 0) {
        const errorMsg = response.productUpdate.userErrors
          .map(err => `${err.field}: ${err.message}`)
          .join(', ');
        console.error(`❌ Product update failed: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Find the newly added media (should be the last one)
      const mediaNodes = response.productUpdate.product.media.nodes;
      if (mediaNodes.length === 0) {
        console.error('❌ No media found in updated product');
        return {
          success: false,
          error: 'No media added to product',
        };
      }

      // Get the most recently added media
      const newMedia = mediaNodes[mediaNodes.length - 1];
      
      console.log(`✅ Product media added: ${newMedia.id}`);
      
      // Handle async image processing - image might be null initially
      if (newMedia.image && newMedia.image.url) {
        console.log(`🖼️ Shopify CDN URL: ${newMedia.image.url}`);
        return {
          success: true,
          imageId: newMedia.id,
          imageUrl: newMedia.image.url,
        };
      } else {
        console.log(`⏳ Image is being processed asynchronously by Shopify`);
        // Try to fetch the URL after a brief delay
        const delayedUrl = await this.fetchImageUrlAfterProcessing(newMedia.id, 3);
        return {
          success: true,
          imageId: newMedia.id,
          imageUrl: delayedUrl,
        };
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create product media';
      console.error(`❌ Product media creation error: ${errorMsg}`);
      console.error('Full error:', error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Fetch image URL after Shopify finishes processing (optimized for parallel processing)
   */
  private async fetchImageUrlAfterProcessing(mediaId: string, maxRetries: number = 2): Promise<string | undefined> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Shorter delays for parallel processing - most images process quickly
        const delay = attempt === 1 ? 500 : 1500; // 500ms, then 1.5s
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const query = `
          query getMedia($id: ID!) {
            media: node(id: $id) {
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
          }
        `;
        
        const response = await this.client.query<{
          media: {
            id: string;
            image: {
              url: string;
              altText: string;
            } | null;
          };
        }>(query, { id: mediaId });
        
        if (response?.media?.image?.url) {
          return response.media.image.url;
        }
        
      } catch (error) {
        // Reduce logging noise in parallel processing
        if (attempt === maxRetries) {
          console.warn(`⚠️ Failed to fetch URL after ${maxRetries} attempts: ${mediaId}`);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Batch upload multiple images for a product
   */
  async uploadProductImages(
    productId: string,
    imagePaths: string[],
    altTexts?: string[]
  ): Promise<Array<{
    path: string;
    result: StagedUploadResult;
  }>> {
    const results = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const altText = altTexts?.[i];

      const result = await this.uploadProductImage(productId, imagePath, altText);

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
   * Validate image file before upload
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
}