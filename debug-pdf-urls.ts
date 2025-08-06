import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPdfUrls() {
  try {
    console.log('Checking current PDF URL patterns in database...\n');
    
    // Sample PDFs and their URLs
    const samplePdfs = await prisma.productCatalog.findMany({
      take: 5,
      include: {
        product: {
          select: {
            sku: true,
            title: true
          }
        }
      }
    });
    
    console.log('Sample PDFs and their URLs:');
    samplePdfs.forEach(pdf => {
      console.log(`\nProduct: ${pdf.product.sku} - ${pdf.product.title}`);
      console.log(`  pdfUrl: ${pdf.pdfUrl}`);
      console.log(`  localPdfPath: ${pdf.localPdfPath}`);
      console.log(`  fileSize: ${pdf.fileSize}`);
    });
    
    // Check PDF counts
    const totalPdfs = await prisma.productCatalog.count();
    console.log(`\nTotal PDFs: ${totalPdfs}`);
    
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

debugPdfUrls();