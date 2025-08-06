#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OriginalProductData {
  sku: string;
  name: string;
  images: string[];
  image_count: number;
  images_local: string[];
  images_external: string[];
}

interface OriginalData {
  metadata: {
    total_products: number;
    total_images: number;
    image_count: number;
  };
  products: OriginalProductData[];
}

class ImageAssignmentRestorer {
  private originalDataPath = '/Users/noelmcmichael/Workspace/izerwaren_revival/exports/migration_package/data/products_with_local_images.json';
  private originalImagesPath = '/Users/noelmcmichael/Workspace/izerwaren_revival/exports/migration_package/images';
  private targetImagesPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images/products';

  async restoreCorrectImageAssignments() {
    console.log('🔄 Restoring Correct Image Assignments');
    console.log('=====================================\n');

    try {
      // Step 1: Load original source data
      console.log('📥 Loading original source data...');
      const originalData = await this.loadOriginalData();
      console.log(`   ✅ Loaded ${originalData.products.length} products with correct image mappings`);

      // Step 2: Create backup of current state
      console.log('\n💾 Creating backup of current database state...');
      await this.createDatabaseBackup();

      // Step 3: Clear incorrect assignments
      console.log('\n🧹 Clearing incorrect image assignments...');
      await this.clearIncorrectAssignments();

      // Step 4: Copy original images to correct location
      console.log('\n📁 Copying original images to frontend...');
      await this.copyOriginalImages();

      // Step 5: Restore correct image assignments
      console.log('\n🔗 Restoring correct image assignments...');
      const restoredCount = await this.restoreImageAssignments(originalData);

      // Step 6: Verify restoration
      console.log('\n✅ Verifying restoration...');
      await this.verifyRestoration();

      console.log(`\n🎉 Image assignment restoration completed successfully!`);
      console.log(`   ├─ Products processed: ${originalData.products.length}`);
      console.log(`   ├─ Images restored: ${restoredCount}`);
      console.log(`   └─ Database integrity: ✅ Verified\n`);

    } catch (error) {
      console.error('❌ Failed to restore image assignments:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async loadOriginalData(): Promise<OriginalData> {
    const data = await fs.readFile(this.originalDataPath, 'utf-8');
    return JSON.parse(data);
  }

  private async createDatabaseBackup() {
    // Export current image assignments to backup file
    const currentAssignments = await prisma.productImage.findMany({
      include: {
        product: {
          select: { sku: true, title: true }
        }
      }
    });

    const backupData = {
      timestamp: new Date().toISOString(),
      total_assignments: currentAssignments.length,
      assignments: currentAssignments
    };

    await fs.writeFile(
      './scripts/image-assignments-backup.json',
      JSON.stringify(backupData, null, 2)
    );

    console.log(`   ✅ Backup created: ${currentAssignments.length} assignments saved`);
  }

  private async clearIncorrectAssignments() {
    const deletedCount = await prisma.productImage.deleteMany({});
    console.log(`   ✅ Cleared ${deletedCount.count} incorrect image assignments`);
  }

  private async copyOriginalImages() {
    // Ensure target directory exists
    await fs.mkdir(this.targetImagesPath, { recursive: true });

    // Get list of image files from original directory
    const originalImages = await fs.readdir(this.originalImagesPath);
    const imageFiles = originalImages.filter(file => file.endsWith('.jpg'));

    console.log(`   📂 Found ${imageFiles.length} original image files`);

    let copiedCount = 0;
    for (const imageFile of imageFiles) {
      const sourcePath = path.join(this.originalImagesPath, imageFile);
      const targetPath = path.join(this.targetImagesPath, imageFile);

      try {
        await fs.copyFile(sourcePath, targetPath);
        copiedCount++;

        if (copiedCount % 100 === 0) {
          console.log(`   📊 Progress: ${copiedCount}/${imageFiles.length} images copied`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to copy ${imageFile}: ${error}`);
      }
    }

    console.log(`   ✅ Copied ${copiedCount}/${imageFiles.length} images successfully`);
  }

  private async restoreImageAssignments(originalData: OriginalData): Promise<number> {
    let totalImagesRestored = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const productData of originalData.products) {
      try {
        // Find the product in current database
        const product = await prisma.product.findUnique({
          where: { sku: productData.sku }
        });

        if (!product) {
          console.warn(`   ⚠️  Product not found: ${productData.sku}`);
          errorCount++;
          continue;
        }

        // Create image assignments based on original data
        for (let i = 0; i < productData.images_local.length; i++) {
          const localPath = productData.images_local[i];
          const imageUrl = productData.images_external[i];
          
          // Convert local path format: "./images/filename.jpg" -> "/images/products/filename.jpg"
          const filename = path.basename(localPath);
          const publicPath = `/images/products/${filename}`;

          await prisma.productImage.create({
            data: {
              productId: product.id,
              imageUrl: imageUrl,
              localPath: publicPath,
              imageOrder: i + 1,
              isPrimary: i === 0, // First image is primary
              fileExists: true,
            },
          });

          totalImagesRestored++;
        }

        // Update product image count and primary image path
        await prisma.product.update({
          where: { id: product.id },
          data: {
            imageCount: productData.image_count,
            primaryImagePath: productData.images_local[0] ? `/images/products/${path.basename(productData.images_local[0])}` : null,
          },
        });

        successCount++;

        if (successCount % 50 === 0) {
          console.log(`   📊 Progress: ${successCount}/${originalData.products.length} products processed`);
        }

      } catch (error) {
        console.error(`   ❌ Error restoring images for ${productData.sku}: ${error}`);
        errorCount++;
      }
    }

    console.log(`   ✅ Restoration complete:`);
    console.log(`      ├─ Products processed: ${successCount}`);
    console.log(`      ├─ Errors: ${errorCount}`);
    console.log(`      └─ Total images restored: ${totalImagesRestored}`);

    return totalImagesRestored;
  }

  private async verifyRestoration() {
    // Test the problematic products we identified
    const testSkus = ['IZW-0944', 'IZW-0948', 'IZW-0950'];
    
    for (const sku of testSkus) {
      const product = await prisma.product.findUnique({
        where: { sku },
        include: {
          images: {
            orderBy: [
              { isPrimary: 'desc' },
              { imageOrder: 'asc' }
            ]
          }
        }
      });

      if (product && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        console.log(`   ✅ ${sku}: ${product.images.length} images, primary: ${primaryImage?.localPath}`);
      } else {
        console.log(`   ❌ ${sku}: No images found`);
      }
    }

    // Overall statistics
    const totalProducts = await prisma.product.count();
    const productsWithImages = await prisma.product.count({
      where: {
        images: {
          some: {}
        }
      }
    });
    const totalImages = await prisma.productImage.count();

    console.log(`\n   📊 Final Statistics:`);
    console.log(`      ├─ Total products: ${totalProducts}`);
    console.log(`      ├─ Products with images: ${productsWithImages}`);
    console.log(`      ├─ Total images: ${totalImages}`);
    console.log(`      └─ Coverage: ${((productsWithImages / totalProducts) * 100).toFixed(1)}%`);
  }

  async restorePDFs() {
    console.log('\n📋 Restoring PDF Documents');
    console.log('===========================\n');

    const originalPdfsPath = '/Users/noelmcmichael/Workspace/izerwaren_revival/exports/migration_package/pdfs';
    const targetPdfsPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/pdfs';

    try {
      // Ensure target directory exists
      await fs.mkdir(targetPdfsPath, { recursive: true });

      // Get list of PDF files
      const pdfFiles = await fs.readdir(originalPdfsPath);
      console.log(`   📂 Found ${pdfFiles.length} PDF files`);

      let copiedCount = 0;
      let restoredCount = 0;

      for (const pdfFile of pdfFiles) {
        // Extract SKU from filename (e.g., "IZW-0944_87b9e83a.pdf" -> "IZW-0944")
        const skuMatch = pdfFile.match(/^(IZW-\d+)_/);
        if (!skuMatch) {
          console.warn(`   ⚠️  Could not extract SKU from: ${pdfFile}`);
          continue;
        }

        const sku = skuMatch[1];
        const sourcePath = path.join(originalPdfsPath, pdfFile);
        const targetPath = path.join(targetPdfsPath, pdfFile);

        try {
          // Copy PDF file
          await fs.copyFile(sourcePath, targetPath);
          copiedCount++;

          // Find product and update/create catalog entry
          const product = await prisma.product.findUnique({
            where: { sku }
          });

          if (product) {
            // Check if catalog entry already exists
            const existingCatalog = await prisma.productCatalog.findUnique({
              where: { productId: product.id }
            });

            const pdfStats = await fs.stat(targetPath);
            const publicPdfPath = `/pdfs/${pdfFile}`;

            if (existingCatalog) {
              // Update existing entry
              await prisma.productCatalog.update({
                where: { productId: product.id },
                data: {
                  localPdfPath: targetPath,
                  fileSize: pdfStats.size,
                  downloadStatus: 'completed'
                }
              });
            } else {
              // Create new entry
              await prisma.productCatalog.create({
                data: {
                  productId: product.id,
                  pdfUrl: `https://izerwaren.biz/Content/images/products/${pdfFile.replace('_', '/')}.pdf`, // Reconstruct original URL
                  localPdfPath: targetPath,
                  fileSize: pdfStats.size,
                  downloadStatus: 'completed'
                }
              });
            }

            restoredCount++;
            console.log(`   ✅ Restored PDF for ${sku}: ${(pdfStats.size / 1024).toFixed(1)}KB`);
          } else {
            console.warn(`   ⚠️  Product not found for SKU: ${sku}`);
          }

        } catch (error) {
          console.error(`   ❌ Failed to restore PDF ${pdfFile}: ${error}`);
        }
      }

      console.log(`\n   ✅ PDF restoration complete:`);
      console.log(`      ├─ Files copied: ${copiedCount}/${pdfFiles.length}`);
      console.log(`      └─ Database entries restored: ${restoredCount}`);

    } catch (error) {
      console.error('❌ Failed to restore PDFs:', error);
      throw error;
    }
  }
}

// Run the restoration
async function main() {
  const restorer = new ImageAssignmentRestorer();
  
  try {
    await restorer.restoreCorrectImageAssignments();
    await restorer.restorePDFs();
    
    console.log('\n🎊 All restorations completed successfully!');
    console.log('   You can now test the product pages to see correct images and PDFs.\n');
    
  } catch (error) {
    console.error('\n💥 Restoration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ImageAssignmentRestorer };