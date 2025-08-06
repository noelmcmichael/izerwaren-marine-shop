const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function findDetailedIssues() {
  console.log('🔍 DETAILED ISSUE DETECTION');
  console.log('============================\n');

  // 1. Products with missing prices (critical for e-commerce)
  console.log('1. PRODUCTS WITH MISSING PRICES (Critical)');
  console.log('============================================');
  const missingPriceProducts = await prisma.product.findMany({
    where: { price: null },
    select: { sku: true, title: true, categoryName: true },
    take: 10
  });
  
  missingPriceProducts.forEach(product => {
    console.log(`❌ ${product.sku}: ${product.title}`);
    console.log(`   Category: ${product.categoryName || 'None'}`);
  });
  
  if (missingPriceProducts.length === 10) {
    console.log('   ... and 18 more products without prices');
  }
  
  // 2. Products with missing descriptions
  console.log('\n2. PRODUCTS WITH MISSING DESCRIPTIONS');
  console.log('======================================');
  const missingDescProducts = await prisma.product.findMany({
    where: { 
      OR: [
        { description: null },
        { description: '' }
      ]
    },
    select: { sku: true, title: true, price: true },
    take: 10
  });
  
  missingDescProducts.forEach(product => {
    console.log(`⚠️  ${product.sku}: ${product.title} ($${product.price})`);
  });
  
  // 3. Category assignment issues
  console.log('\n3. CATEGORY ASSIGNMENT ISSUES');
  console.log('==============================');
  const uncategorizedProducts = await prisma.product.findMany({
    where: { categoryName: null },
    select: { sku: true, title: true, price: true },
    take: 5
  });
  
  console.log(`Found ${uncategorizedProducts.length} uncategorized products:`);
  uncategorizedProducts.forEach(product => {
    console.log(`❌ ${product.sku}: ${product.title} ($${product.price})`);
  });
  
  // 4. Check for unusual category assignments (products in wrong categories)
  console.log('\n4. POTENTIAL CATEGORY MISASSIGNMENTS');
  console.log('=====================================');
  
  // Gas springs in lock categories
  const gasSpringsInLocks = await prisma.product.findMany({
    where: {
      AND: [
        { title: { contains: 'Gas Spring', mode: 'insensitive' } },
        { categoryName: { contains: 'Lock', mode: 'insensitive' } }
      ]
    },
    select: { sku: true, title: true, categoryName: true },
    take: 5
  });
  
  if (gasSpringsInLocks.length > 0) {
    console.log('Gas springs incorrectly categorized in lock categories:');
    gasSpringsInLocks.forEach(product => {
      console.log(`❌ ${product.sku}: ${product.title}`);
      console.log(`   Category: ${product.categoryName}`);
    });
  }
  
  // 5. File system asset verification
  console.log('\n5. FILE SYSTEM ASSET VERIFICATION');
  console.log('==================================');
  
  // Check for missing image files
  const frontendPublic = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public';
  const imagesDir = path.join(frontendPublic, 'images', 'products');
  const pdfsDir = path.join(frontendPublic, 'pdfs');
  
  // Sample check: verify a few image files exist
  const sampleImages = await prisma.productImage.findMany({
    take: 10,
    select: { localPath: true, productId: true }
  });
  
  let missingImages = 0;
  for (const image of sampleImages) {
    const fullPath = path.join(frontendPublic, image.localPath);
    if (!fs.existsSync(fullPath)) {
      missingImages++;
      console.log(`❌ Missing image: ${image.localPath}`);
    }
  }
  
  if (missingImages === 0) {
    console.log(`✅ All ${sampleImages.length} sampled image files exist`);
  } else {
    console.log(`❌ ${missingImages}/${sampleImages.length} sampled images missing`);
  }
  
  // Check PDF files
  const samplePdfs = await prisma.productCatalog.findMany({
    take: 10,
    select: { localPdfPath: true, productId: true }
  });
  
  let missingPdfs = 0;
  for (const pdf of samplePdfs) {
    if (pdf.localPdfPath) {
      // Convert absolute path to relative web path
      const relativePath = pdf.localPdfPath.replace('/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public', '');
      const fullPath = path.join(frontendPublic, relativePath);
      if (!fs.existsSync(fullPath)) {
        missingPdfs++;
        console.log(`❌ Missing PDF: ${relativePath}`);
      }
    }
  }
  
  if (missingPdfs === 0) {
    console.log(`✅ All ${samplePdfs.length} sampled PDF files exist`);
  } else {
    console.log(`❌ ${missingPdfs}/${samplePdfs.length} sampled PDFs missing`);
  }
  
  // 6. Price consistency check
  console.log('\n6. PRICE CONSISTENCY ANALYSIS');
  console.log('==============================');
  
  // Find products with extreme prices (possible data entry errors)
  const extremelyExpensive = await prisma.product.findMany({
    where: { 
      price: { gt: 2000 }
    },
    select: { sku: true, title: true, price: true, categoryName: true },
    orderBy: { price: 'desc' },
    take: 5
  });
  
  console.log('Most expensive products (>$2000):');
  extremelyExpensive.forEach(product => {
    console.log(`💰 ${product.sku}: ${product.title} - $${product.price}`);
    console.log(`   Category: ${product.categoryName}`);
  });
  
  const extremelyCheap = await prisma.product.findMany({
    where: { 
      price: { lt: 5 }
    },
    select: { sku: true, title: true, price: true, categoryName: true },
    orderBy: { price: 'asc' },
    take: 5
  });
  
  console.log('\nCheapest products (<$5):');
  extremelyCheap.forEach(product => {
    console.log(`💸 ${product.sku}: ${product.title} - $${product.price}`);
    console.log(`   Category: ${product.categoryName}`);
  });
  
  // 7. Image distribution analysis
  console.log('\n7. IMAGE DISTRIBUTION ANALYSIS');
  console.log('===============================');
  
  const imageStats = await prisma.product.findMany({
    include: {
      _count: {
        select: { images: true }
      }
    },
    orderBy: {
      images: { _count: 'desc' }
    },
    take: 5
  });
  
  console.log('Products with most images:');
  imageStats.forEach(product => {
    console.log(`📸 ${product.sku}: ${product._count.images} images - ${product.title}`);
  });
  
  const noImageProducts = await prisma.product.findMany({
    where: {
      images: { none: {} }
    },
    select: { sku: true, title: true },
    take: 5
  });
  
  if (noImageProducts.length > 0) {
    console.log('\nProducts with no images:');
    noImageProducts.forEach(product => {
      console.log(`❌ ${product.sku}: ${product.title}`);
    });
  } else {
    console.log('\n✅ All products have at least one image');
  }
  
  console.log('\n🔍 Detailed Issue Detection Complete\n');
}

// Run the detailed inspection
findDetailedIssues()
  .catch(console.error)
  .finally(() => prisma.$disconnect());