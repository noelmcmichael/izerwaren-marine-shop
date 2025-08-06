#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

interface ImageData {
  image_url: string;
  local_path?: string;
  image_order?: number;
  is_primary?: number;
  file_exists?: boolean;
}

interface ProductImageData {
  sku: string;
  primary_image: ImageData;
  gallery_images: ImageData[];
  total_images: number;
}

interface BulkImageExport {
  export_format: string;
  total_products: number;
  products: ProductImageData[];
}

class CompleteImageGalleriesImporter {
  private revivalApiBase = 'http://localhost:8000';

  async importCompleteImageGalleries() {
    console.log('🖼️  Starting Complete Image Galleries Import');
    console.log('=============================================\n');

    console.log('📥 Fetching complete image galleries from Revival API...');

    try {
      const response = await fetch(`${this.revivalApiBase}/images/bulk-export`);
      if (!response.ok) {
        throw new Error(`Revival API responded with status: ${response.status}`);
      }

      const data = (await response.json()) as BulkImageExport;

      console.log(`✅ Retrieved ${data.total_products} products with complete image data`);
      console.log(
        `📊 Processing ${data.products.reduce((sum, p) => sum + p.total_images, 0)} total images\n`
      );

      let successCount = 0;
      let errorCount = 0;
      let imageRecordsCreated = 0;

      for (const productData of data.products) {
        try {
          // Find the product in our database
          const product = await prisma.product.findUnique({
            where: { sku: productData.sku },
          });

          if (!product) {
            console.log(`   ⚠️  Product not found for SKU: ${productData.sku}`);
            errorCount++;
            continue;
          }

          // Clear existing image records for this product (we'll replace them with complete data)
          await prisma.productImage.deleteMany({
            where: { productId: product.id },
          });

          // Import primary image
          if (productData.primary_image) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                imageUrl: productData.primary_image.image_url,
                localPath:
                  productData.primary_image.local_path || productData.primary_image.image_url,
                imageOrder: 1,
                isPrimary: true,
                fileExists: Boolean(productData.primary_image.file_exists ?? true),
              },
            });
            imageRecordsCreated++;
          }

          // Import gallery images
          for (let i = 0; i < productData.gallery_images.length; i++) {
            const galleryImage = productData.gallery_images[i];

            await prisma.productImage.create({
              data: {
                productId: product.id,
                imageUrl: galleryImage.image_url,
                localPath: galleryImage.local_path || galleryImage.image_url,
                imageOrder: (galleryImage.image_order || i) + 2, // Start at 2 since primary is 1
                isPrimary: false,
                fileExists: Boolean(galleryImage.file_exists ?? true),
              },
            });
            imageRecordsCreated++;
          }

          // Update product image count
          await prisma.product.update({
            where: { id: product.id },
            data: {
              imageCount: productData.total_images,
              primaryImagePath:
                productData.primary_image?.local_path || productData.primary_image?.image_url,
            },
          });

          successCount++;

          if (successCount % 50 === 0) {
            console.log(
              `   📊 Progress: ${successCount}/${data.total_products} products processed, ${imageRecordsCreated} images imported`
            );
          }
        } catch (error) {
          console.log(`   ❌ Error importing images for ${productData.sku}: ${error}`);
          errorCount++;
        }
      }

      console.log(`\n✅ Complete Image Galleries Import finished:`);
      console.log(`   ├─ Products processed: ${successCount}`);
      console.log(`   ├─ Errors: ${errorCount}`);
      console.log(`   └─ Total image records created: ${imageRecordsCreated}\n`);

      return { successCount, errorCount, imageRecordsCreated };
    } catch (error) {
      console.error('❌ Failed to fetch image galleries from Revival API:', error);
      throw error;
    }
  }

  async generateImageGalleriesReport() {
    console.log('📊 Image Galleries Report');
    console.log('==========================\n');

    // Get statistics
    const totalProducts = await prisma.product.count();
    const productsWithImages = await prisma.product.count({
      where: {
        images: {
          some: {},
        },
      },
    });

    const totalImageRecords = await prisma.productImage.count();
    const primaryImages = await prisma.productImage.count({
      where: { isPrimary: true },
    });
    const galleryImages = await prisma.productImage.count({
      where: { isPrimary: false },
    });

    console.log('📊 Image Coverage Statistics:');
    console.log(`   ├─ Total Products: ${totalProducts}`);
    console.log(
      `   ├─ Products with Images: ${productsWithImages} (${((productsWithImages / totalProducts) * 100).toFixed(1)}%)`
    );
    console.log(`   ├─ Total Image Records: ${totalImageRecords.toLocaleString()}`);
    console.log(`   ├─ Primary Images: ${primaryImages}`);
    console.log(`   └─ Gallery Images: ${galleryImages.toLocaleString()}\n`);

    // Get some sample products with rich galleries
    const richGalleryProducts = await prisma.product.findMany({
      where: {
        images: {
          some: {},
        },
      },
      include: {
        images: {
          orderBy: { imageOrder: 'asc' },
        },
      },
      orderBy: {
        images: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    console.log('🎨 Sample Products with Rich Image Galleries:');
    richGalleryProducts.forEach((product, i) => {
      const primaryImage = product.images.find(img => img.isPrimary);
      const galleryImages = product.images.filter(img => !img.isPrimary);

      console.log(`   ${i + 1}. ${product.sku} - ${product.title?.substring(0, 40)}...`);
      console.log(`      ├─ Total Images: ${product.images.length}`);
      console.log(`      ├─ Primary Image: ${primaryImage ? '✅' : '❌'}`);
      console.log(`      ├─ Gallery Images: ${galleryImages.length}`);
      console.log(
        `      └─ Image Orders: ${product.images
          .map(img => img.imageOrder || 0)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    });

    if (richGalleryProducts.length === 0) {
      console.log('   No products found with image galleries.');
    }

    // Show database vs Revival API comparison
    const revivalApiStats = await this.getRevivalApiImageStats();
    if (revivalApiStats) {
      console.log('\n📊 Database vs Revival API Comparison:');
      console.log(
        `   ├─ Revival API Total Images: ${revivalApiStats.overview.total_images.toLocaleString()}`
      );
      console.log(`   ├─ Database Image Records: ${totalImageRecords.toLocaleString()}`);
      console.log(
        `   ├─ Coverage: ${((totalImageRecords / revivalApiStats.overview.total_images) * 100).toFixed(1)}%`
      );
      console.log(
        `   └─ Status: ${totalImageRecords >= revivalApiStats.overview.total_images * 0.95 ? '✅ Complete' : '⚠️ Incomplete'}`
      );
    }
  }

  private async getRevivalApiImageStats() {
    try {
      const response = await fetch(`${this.revivalApiBase}/images/statistics`);
      if (response.ok) {
        return (await response.json()) as any;
      }
    } catch (error) {
      console.log('   ⚠️  Could not fetch Revival API statistics');
    }
    return null;
  }

  async validateImageGalleries() {
    console.log('🔍 Validating Image Galleries...');
    console.log('==================================\n');

    // Check for products with inconsistent image counts
    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    let inconsistentCount = 0;
    let missingGalleries = 0;

    for (const product of products) {
      const actualImageCount = product.images.length;
      const declaredImageCount = product.imageCount || 0;

      if (actualImageCount !== declaredImageCount) {
        if (inconsistentCount < 5) {
          // Show first 5 examples
          console.log(
            `   ⚠️  ${product.sku}: Declared ${declaredImageCount} images, found ${actualImageCount}`
          );
        }
        inconsistentCount++;
      }

      if (actualImageCount === 0 && declaredImageCount > 0) {
        missingGalleries++;
      }
    }

    console.log(`\n📊 Validation Results:`);
    console.log(`   ├─ Products checked: ${products.length}`);
    console.log(`   ├─ Inconsistent counts: ${inconsistentCount}`);
    console.log(`   ├─ Missing galleries: ${missingGalleries}`);
    console.log(`   └─ Validation: ${inconsistentCount === 0 ? '✅ Passed' : '⚠️ Issues found'}\n`);

    return {
      products: products.length,
      inconsistent: inconsistentCount,
      missing: missingGalleries,
    };
  }
}

async function main() {
  const importer = new CompleteImageGalleriesImporter();

  console.log('🚀 Complete Image Galleries Import Process');
  console.log('===========================================\n');

  try {
    // Import complete image galleries
    const importResults = await importer.importCompleteImageGalleries();

    // Validate the import
    const validationResults = await importer.validateImageGalleries();

    // Generate comprehensive report
    await importer.generateImageGalleriesReport();

    console.log('\n🎉 Complete Image Galleries Import Finished!');
    console.log(`   ├─ Products processed: ${importResults.successCount}`);
    console.log(
      `   ├─ Image records created: ${importResults.imageRecordsCreated.toLocaleString()}`
    );
    console.log(
      `   ├─ Validation: ${validationResults.inconsistent === 0 ? 'Passed' : 'Issues found'}`
    );
    console.log(
      `   └─ Status: ${importResults.errorCount === 0 ? '✅ Complete Success' : `⚠️ ${importResults.errorCount} errors`}`
    );
  } catch (error) {
    console.error('❌ Image galleries import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
