#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMediaAssets() {
  console.log('📊 Media Assets Status Report');
  console.log('=============================\n');

  // Check product counts
  const productStats = await prisma.product.aggregate({
    _count: { id: true },
    _sum: { imageCount: true },
  });

  const productsWithImages = await prisma.product.count({
    where: { imageCount: { gt: 0 } },
  });

  const productsWithPrimaryImage = await prisma.product.count({
    where: { primaryImagePath: { not: null } },
  });

  console.log('🛍️  Product Image Status:');
  console.log(`   ├─ Total Products: ${productStats._count.id}`);
  console.log(`   ├─ Products with Images: ${productsWithImages}`);
  console.log(`   ├─ Products with Primary Image Path: ${productsWithPrimaryImage}`);
  console.log(`   └─ Total Image Count: ${productStats._sum.imageCount || 0}\n`);

  // Check ProductImage records
  const imageRecords = await prisma.productImage.count();
  const imagesExist = await prisma.productImage.count({
    where: { fileExists: true },
  });

  console.log('🖼️  ProductImage Records:');
  console.log(`   ├─ Total Image Records: ${imageRecords}`);
  console.log(`   └─ Files that Exist: ${imagesExist}\n`);

  // Check ProductCatalog records
  const catalogRecords = await prisma.productCatalog.count();
  const catalogsDownloaded = await prisma.productCatalog.count({
    where: { downloadStatus: 'completed' },
  });

  console.log('📚 Product Catalog (PDF) Status:');
  console.log(`   ├─ Total Catalog Records: ${catalogRecords}`);
  console.log(`   └─ Downloaded Catalogs: ${catalogsDownloaded}\n`);

  // Sample products with image info
  console.log('🔍 Sample Products with Image Data:');
  const sampleProducts = await prisma.product.findMany({
    where: {
      OR: [{ imageCount: { gt: 0 } }, { primaryImagePath: { not: null } }],
    },
    take: 5,
    select: {
      sku: true,
      title: true,
      imageCount: true,
      primaryImagePath: true,
      images: {
        select: {
          localPath: true,
          isPrimary: true,
          fileExists: true,
        },
      },
      catalogs: {
        select: {
          pdfUrl: true,
          downloadStatus: true,
        },
      },
    },
  });

  sampleProducts.forEach((product, i) => {
    console.log(`   ${i + 1}. ${product.sku} - ${product.title?.substring(0, 40)}...`);
    console.log(`      ├─ Image Count: ${product.imageCount || 0}`);
    console.log(`      ├─ Primary Image: ${product.primaryImagePath || 'None'}`);
    console.log(`      ├─ Image Records: ${product.images.length}`);
    console.log(`      └─ Catalog Records: ${product.catalogs.length}`);
  });

  if (sampleProducts.length === 0) {
    console.log('   No products found with image data.');
  }

  await prisma.$disconnect();
}

checkMediaAssets().catch(console.error);
