import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugImageUrls() {
  try {
    console.log('Checking current image URL patterns in database...\n');
    
    // Sample a few products and their image URLs
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: {
        images: {
          select: {
            id: true,
            imageUrl: true,
            localPath: true,
            isPrimary: true,
          }
        }
      }
    });
    
    console.log('Sample products and their image URLs:');
    sampleProducts.forEach(product => {
      console.log(`\nProduct: ${product.sku} - ${product.title}`);
      product.images.forEach((img, idx) => {
        console.log(`  Image ${idx + 1}:`);
        console.log(`    imageUrl: ${img.imageUrl}`);
        console.log(`    localPath: ${img.localPath}`);
        console.log(`    isPrimary: ${img.isPrimary}`);
      });
    });
    
    // Check for different URL patterns
    console.log('\n\nAnalyzing URL patterns:');
    
    // Check if there are still .biz URLs
    const bizUrls = await prisma.productImage.count({
      where: {
        imageUrl: {
          contains: '.biz'
        }
      }
    });
    
    console.log(`\nImages with .biz URLs: ${bizUrls}`);
    
    // Check if there are Shopify CDN URLs
    const shopifyUrls = await prisma.productImage.count({
      where: {
        imageUrl: {
          contains: 'shopify'
        }
      }
    });
    
    console.log(`Images with Shopify URLs: ${shopifyUrls}`);
    
    // Check local paths
    const localPaths = await prisma.productImage.count({
      where: {
        localPath: {
          not: null
        }
      }
    });
    
    // Check PDFs
    const totalPdfs = await prisma.productCatalog.count();
    console.log(`Total PDFs: ${totalPdfs}`);
    
    const bizPdfUrls = await prisma.productCatalog.count({
      where: {
        pdfUrl: {
          contains: '.biz'
        }
      }
    });
    
    console.log(`PDFs with .biz URLs: ${bizPdfUrls}`);
    
    const localPdfPaths = await prisma.productCatalog.count({
      where: {
        localPdfPath: {
          not: null
        }
      }
    });
    
    console.log(`PDFs with local paths: ${localPdfPaths}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugImageUrls();