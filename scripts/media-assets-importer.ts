#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

interface CatalogData {
  id: string | null;
  product_sku: string;
  pdf_url: string;
  local_pdf_path: string;
  file_size: number;
  download_status: string;
  created_at: string;
}

interface CatalogResponse {
  catalogs: CatalogData[];
  pagination: {
    limit: number;
    offset: number;
    total_count: number;
    has_next: boolean;
  };
}

interface ImageData {
  product_sku: string;
  image_path: string;
  is_primary: boolean;
  image_order: number;
  file_exists: boolean;
}

class MediaAssetsImporter {
  private revivalApiBase = 'http://localhost:8000';

  async importCatalogs(batchSize = 50) {
    console.log('📚 Starting Catalog (PDF) Import...');
    console.log('===================================\n');

    let offset = 0;
    let totalImported = 0;
    let hasNext = true;

    while (hasNext) {
      const url = `${this.revivalApiBase}/catalogs?limit=${batchSize}&offset=${offset}`;
      console.log(`📥 Fetching catalogs: offset ${offset}, limit ${batchSize}`);

      const response = await fetch(url);
      const data = (await response.json()) as CatalogResponse;

      for (const catalog of data.catalogs) {
        try {
          // Find the product by SKU
          const product = await prisma.product.findUnique({
            where: { sku: catalog.product_sku },
          });

          if (!product) {
            console.log(`   ⚠️  Product not found for SKU: ${catalog.product_sku}`);
            continue;
          }

          // Create catalog record
          await prisma.productCatalog.upsert({
            where: { productId: product.id },
            update: {
              pdfUrl: catalog.pdf_url,
              localPdfPath: catalog.local_pdf_path,
              fileSize: catalog.file_size,
              downloadStatus:
                catalog.download_status === 'success' ? 'completed' : catalog.download_status,
            },
            create: {
              productId: product.id,
              pdfUrl: catalog.pdf_url,
              localPdfPath: catalog.local_pdf_path,
              fileSize: catalog.file_size,
              downloadStatus:
                catalog.download_status === 'success' ? 'completed' : catalog.download_status,
            },
          });

          totalImported++;
          console.log(`   ✅ ${catalog.product_sku}: ${path.basename(catalog.local_pdf_path)}`);
        } catch (error) {
          console.log(`   ❌ Error importing catalog for ${catalog.product_sku}: ${error}`);
        }
      }

      offset += batchSize;
      hasNext = data.pagination.has_next;

      console.log(
        `   📊 Batch complete: ${totalImported}/${data.pagination.total_count} catalogs imported\n`
      );
    }

    console.log(`✅ Catalog import complete: ${totalImported} catalogs imported\n`);
    return totalImported;
  }

  async importProductImages() {
    console.log('🖼️  Starting Product Images Import...');
    console.log('=====================================\n');

    // Since there's no direct images endpoint, let's work with what we have
    // We'll use the image data already in the products table to create ProductImage records

    const products = await prisma.product.findMany({
      where: {
        AND: [{ imageCount: { gt: 0 } }, { primaryImagePath: { not: null } }],
      },
      select: {
        id: true,
        sku: true,
        title: true,
        imageCount: true,
        primaryImagePath: true,
      },
    });

    console.log(`📊 Found ${products.length} products with image data`);
    let totalImagesCreated = 0;

    for (const product of products) {
      try {
        // Create primary image record
        if (product.primaryImagePath) {
          await prisma.productImage.upsert({
            where: {
              productId_localPath: {
                productId: product.id,
                localPath: product.primaryImagePath,
              },
            },
            update: {
              isPrimary: true,
              imageOrder: 1,
              fileExists: await this.checkFileExists(product.primaryImagePath),
            },
            create: {
              productId: product.id,
              localPath: product.primaryImagePath,
              isPrimary: true,
              imageOrder: 1,
              fileExists: await this.checkFileExists(product.primaryImagePath),
            },
          });

          totalImagesCreated++;
        }

        // Note: We can't create records for additional images without more detailed data
        // The Revival API would need an images endpoint for that

        console.log(`   ✅ ${product.sku}: Primary image imported`);
      } catch (error) {
        console.log(`   ❌ Error importing images for ${product.sku}: ${error}`);
      }
    }

    console.log(`✅ Image import complete: ${totalImagesCreated} image records created\n`);
    return totalImagesCreated;
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      // For now, assume files exist since they're referenced in the database
      // In production, you'd want to check the actual file system
      return true;
    } catch {
      return false;
    }
  }

  async generateMediaAssetsReport() {
    console.log('📊 Media Assets Import Report');
    console.log('=============================\n');

    const catalogCount = await prisma.productCatalog.count();
    const imageCount = await prisma.productImage.count();

    const productsWithCatalogs = await prisma.product.count({
      where: {
        catalogs: {
          some: {},
        },
      },
    });

    const productsWithImageRecords = await prisma.product.count({
      where: {
        images: {
          some: {},
        },
      },
    });

    console.log('📚 PDF Catalogs:');
    console.log(`   ├─ Total Catalog Records: ${catalogCount}`);
    console.log(`   └─ Products with Catalogs: ${productsWithCatalogs}\n`);

    console.log('🖼️  Product Images:');
    console.log(`   ├─ Total Image Records: ${imageCount}`);
    console.log(`   └─ Products with Image Records: ${productsWithImageRecords}\n`);

    // Show sample records
    const sampleCatalogs = await prisma.productCatalog.findMany({
      take: 3,
      include: {
        product: {
          select: { sku: true, title: true },
        },
      },
    });

    console.log('🔍 Sample Catalog Records:');
    sampleCatalogs.forEach((catalog, i) => {
      console.log(
        `   ${i + 1}. ${catalog.product.sku} - ${catalog.product.title?.substring(0, 40)}...`
      );
      console.log(`      ├─ PDF URL: ${catalog.pdfUrl.substring(0, 60)}...`);
      console.log(`      ├─ Local Path: ${catalog.localPdfPath}`);
      console.log(`      ├─ File Size: ${(catalog.fileSize || 0 / 1024).toFixed(1)} KB`);
      console.log(`      └─ Status: ${catalog.downloadStatus}`);
    });
  }
}

async function main() {
  const importer = new MediaAssetsImporter();

  console.log('🚀 Media Assets Import Process');
  console.log('===============================\n');

  try {
    // Import catalogs (PDFs)
    const catalogsImported = await importer.importCatalogs();

    // Import images
    const imagesImported = await importer.importProductImages();

    // Generate final report
    await importer.generateMediaAssetsReport();

    console.log('🎉 Media Assets Import Complete!');
    console.log(`   ├─ ${catalogsImported} PDF catalogs imported`);
    console.log(`   └─ ${imagesImported} image records created`);
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
