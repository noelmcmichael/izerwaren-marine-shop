const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runQAInspection() {
  console.log('🔍 Starting Comprehensive QA Inspection...\n');

  // 1. Product Data Quality Check
  console.log('1. PRODUCT DATA QUALITY');
  console.log('========================');
  
  const totalProducts = await prisma.product.count();
  console.log(`Total products: ${totalProducts}`);
  
  // Products missing critical fields  
  const missingPrice = await prisma.product.count({
    where: { price: null }
  });
  
  const missingDescription = await prisma.product.count({
    where: { 
      OR: [
        { description: null },
        { description: '' }
      ]
    }
  });
  
  const missingSku = await prisma.product.count({
    where: { sku: null }
  });
  
  console.log(`Products missing price: ${missingPrice}`);
  console.log(`Products missing description: ${missingDescription}`);
  console.log(`Products missing SKU: ${missingSku}`);
  
  // Price analysis
  const priceStats = await prisma.product.aggregate({
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true }
  });
  
  console.log(`Price range: $${priceStats._min.price} - $${priceStats._max.price}`);
  console.log(`Average price: $${priceStats._avg.price?.toFixed(2)}`);
  
  // 2. Category Distribution
  console.log('\n2. CATEGORY DISTRIBUTION');
  console.log('=========================');
  
  // Group products by category
  const categoryGroups = await prisma.product.groupBy({
    by: ['categoryName'],
    _count: {
      categoryName: true
    },
    orderBy: {
      _count: {
        categoryName: 'desc'
      }
    }
  });
  
  categoryGroups.forEach(cat => {
    console.log(`${cat.categoryName || 'Uncategorized'}: ${cat._count.categoryName} products`);
  });
  
  // Products without categories
  const uncategorized = await prisma.product.count({
    where: { categoryName: null }
  });
  console.log(`Uncategorized products: ${uncategorized}`);
  
  // 3. Image Coverage Analysis
  console.log('\n3. IMAGE COVERAGE ANALYSIS');
  console.log('===========================');
  
  const totalImages = await prisma.productImage.count();
  console.log(`Total images in database: ${totalImages}`);
  
  const productsWithImages = await prisma.product.count({
    where: {
      images: {
        some: {}
      }
    }
  });
  
  const productsWithoutImages = totalProducts - productsWithImages;
  console.log(`Products with images: ${productsWithImages}`);
  console.log(`Products without images: ${productsWithoutImages}`);
  
  // Image file analysis
  const imagesWithLocalPath = await prisma.productImage.count({
    where: {
      localPath: {
        not: ''
      }
    }
  });
  
  const imagesWithBizUrls = await prisma.productImage.count({
    where: {
      imageUrl: {
        contains: '.biz'
      }
    }
  });
  
  console.log(`Images with local paths: ${imagesWithLocalPath}`);
  console.log(`Images with .biz URLs: ${imagesWithBizUrls}`);
  
  // 4. PDF Documentation Coverage
  console.log('\n4. PDF DOCUMENTATION COVERAGE');
  console.log('==============================');
  
  const totalCatalogs = await prisma.productCatalog.count();
  console.log(`Total catalogs in database: ${totalCatalogs}`);
  
  const catalogsWithPdf = await prisma.productCatalog.count();
  
  const catalogsWithLocalPdf = await prisma.productCatalog.count({
    where: {
      localPdfPath: { not: null }
    }
  });
  
  console.log(`Catalogs with PDF references: ${catalogsWithPdf}`);
  console.log(`Catalogs with local PDF paths: ${catalogsWithLocalPdf}`);
  
  // 5. Sample Product Analysis
  console.log('\n5. SAMPLE PRODUCT ANALYSIS');
  console.log('===========================');
  
  // Get 5 random products for detailed inspection
  const sampleProducts = await prisma.product.findMany({
    take: 5,
    include: {
      images: true,
      catalogs: true
    },
    orderBy: {
      sku: 'asc'
    }
  });
  
  for (const product of sampleProducts) {
    console.log(`\nProduct: ${product.sku} - ${product.title}`);
    console.log(`  Price: $${product.price}`);
    console.log(`  Category: ${product.categoryName || 'None'}`);
    console.log(`  Images: ${product.images.length}`);
    console.log(`  Catalogs: ${product.catalogs.length}`);
    console.log(`  Description length: ${product.description?.length || 0} chars`);
  }
  
  console.log('\n🔍 QA Inspection Complete\n');
}

async function checkFileSystemAssets() {
  console.log('6. FILE SYSTEM ASSET CHECK');
  console.log('===========================');
  
  const frontendPublic = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public';
  
  // Check images directory
  const imagesDir = path.join(frontendPublic, 'images', 'products');
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    console.log(`Image files on disk: ${imageFiles.length}`);
    
    // Sample a few files
    const sampleImages = imageFiles.slice(0, 5);
    console.log(`Sample images: ${sampleImages.join(', ')}`);
  } else {
    console.log('❌ Images directory not found');
  }
  
  // Check PDFs directory
  const pdfsDir = path.join(frontendPublic, 'pdfs');
  if (fs.existsSync(pdfsDir)) {
    const pdfFiles = fs.readdirSync(pdfsDir);
    console.log(`PDF files on disk: ${pdfFiles.length}`);
    
    // Sample a few files
    const samplePdfs = pdfFiles.slice(0, 5);
    console.log(`Sample PDFs: ${samplePdfs.join(', ')}`);
  } else {
    console.log('❌ PDFs directory not found');
  }
}

// Run the inspection
runQAInspection()
  .then(() => checkFileSystemAssets())
  .catch(console.error)
  .finally(() => prisma.$disconnect());