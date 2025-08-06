#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImagePdfFix() {
  console.log('🔍 Verifying Image & PDF Fix');
  console.log('=============================\n');

  try {
    // Test 1: Check overall statistics
    console.log('📊 Overall Statistics:');
    const totalProducts = await prisma.product.count();
    const productsWithImages = await prisma.product.count({
      where: { images: { some: {} } }
    });
    const productsWithPdfs = await prisma.product.count({
      where: { catalogs: { some: {} } }
    });
    const totalImages = await prisma.productImage.count();
    const totalPdfs = await prisma.productCatalog.count();

    console.log(`   ├─ Total products: ${totalProducts}`);
    console.log(`   ├─ Products with images: ${productsWithImages} (${((productsWithImages/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   ├─ Products with PDFs: ${productsWithPdfs}`);
    console.log(`   ├─ Total images: ${totalImages}`);
    console.log(`   └─ Total PDFs: ${totalPdfs}`);

    // Test 2: Verify problematic products are fixed
    console.log('\n🔧 Testing Previously Problematic Products:');
    const testProducts = ['IZW-0944', 'IZW-0948', 'IZW-0950'];
    
    for (const sku of testProducts) {
      const product = await prisma.product.findUnique({
        where: { sku },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { imageOrder: 'asc' }],
            take: 3
          },
          catalogs: true
        }
      });

      if (product) {
        const primaryImage = product.images.find(img => img.isPrimary);
        const primaryImageFile = primaryImage?.localPath?.split('/').pop();
        console.log(`   ├─ ${sku}: ${product.images.length} images, Primary: ${primaryImageFile}, PDFs: ${product.catalogs.length}`);
      } else {
        console.log(`   ├─ ${sku}: ❌ Product not found`);
      }
    }

    // Test 3: Check for duplicate image assignments (should be none now)
    console.log('\n🔄 Checking for Image Assignment Issues:');
    const duplicateImages = await prisma.$queryRaw<Array<{local_path: string, product_count: number}>>`
      SELECT pi.local_path, COUNT(DISTINCT pi.product_id) as product_count
      FROM product_images pi 
      GROUP BY pi.local_path 
      HAVING COUNT(DISTINCT pi.product_id) > 1
      LIMIT 5;
    `;

    if (duplicateImages.length === 0) {
      console.log('   ✅ No duplicate image assignments found');
    } else {
      console.log(`   ⚠️  Found ${duplicateImages.length} images assigned to multiple products:`);
      duplicateImages.forEach(dup => {
        console.log(`      - ${dup.local_path}: ${dup.product_count} products`);
      });
    }

    // Test 4: Verify image order and primary assignments
    console.log('\n📋 Image Order & Primary Assignment Verification:');
    const primaryImageStats = await prisma.$queryRaw<Array<{total_products: number, products_with_primary: number}>>`
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN pi.is_primary = true THEN p.id END) as products_with_primary
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id;
    `;

    const stats = primaryImageStats[0];
    console.log(`   ├─ Products with primary images: ${stats.products_with_primary}/${stats.total_products}`);
    
    if (stats.products_with_primary === stats.total_products) {
      console.log('   ✅ All products have primary images assigned correctly');
    } else {
      console.log('   ⚠️  Some products missing primary images');
    }

    // Test 5: Sample different product types for diversity
    console.log('\n🎲 Random Sample Verification:');
    const randomProducts = await prisma.product.findMany({
      take: 5,
      skip: Math.floor(Math.random() * (totalProducts - 5)),
      include: {
        images: { take: 1, orderBy: { isPrimary: 'desc' } },
        catalogs: true
      }
    });

    randomProducts.forEach(product => {
      const primaryImage = product.images[0]?.localPath?.split('/').pop() || 'None';
      console.log(`   ├─ ${product.sku}: Primary: ${primaryImage}, PDFs: ${product.catalogs.length}`);
    });

    // Test 6: PDF file size distribution
    console.log('\n📄 PDF Statistics:');
    const pdfStats = await prisma.$queryRaw<Array<{min_size: number, max_size: number, avg_size: number}>>`
      SELECT 
        MIN(file_size) as min_size,
        MAX(file_size) as max_size,
        ROUND(AVG(file_size)) as avg_size
      FROM product_catalogs
      WHERE file_size IS NOT NULL;
    `;

    if (pdfStats.length > 0) {
      const stats = pdfStats[0];
      console.log(`   ├─ Size range: ${(stats.min_size/1024).toFixed(1)}KB - ${(stats.max_size/1024).toFixed(1)}KB`);
      console.log(`   └─ Average size: ${(stats.avg_size/1024).toFixed(1)}KB`);
    }

    console.log('\n✅ Verification completed successfully!');
    console.log('\n🌐 Test URLs:');
    console.log('   ├─ IZW-0944: http://localhost:3000/product/IZW-0944');
    console.log('   ├─ IZW-0948: http://localhost:3000/product/IZW-0948');
    console.log('   ├─ IZW-0950: http://localhost:3000/product/IZW-0950');
    console.log('   └─ Catalog: http://localhost:3000/catalog');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyImagePdfFix();
}

export { verifyImagePdfFix };