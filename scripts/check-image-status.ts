import { PrismaClient } from '@izerwaren/database';

const prisma = new PrismaClient();

async function checkImageStatus() {
  console.log('🖼️  Checking Image Status\n========================');
  
  try {
    const totalImages = await prisma.productImage.count();
    const uploadedImages = await prisma.productImage.count({
      where: {
        imageUrl: { not: null }
      }
    });
    const filesExist = await prisma.productImage.count({
      where: {
        fileExists: true
      }
    });
    const primaryImages = await prisma.productImage.count({
      where: {
        isPrimary: true
      }
    });

    console.log(`📊 Image Statistics:`);
    console.log(`   ├─ Total images in DB: ${totalImages}`);
    console.log(`   ├─ Uploaded to Shopify: ${uploadedImages} (${((uploadedImages/totalImages)*100).toFixed(1)}%)`);
    console.log(`   ├─ Files exist locally: ${filesExist} (${((filesExist/totalImages)*100).toFixed(1)}%)`);
    console.log(`   └─ Primary images: ${primaryImages}`);

    // Get products without images uploaded
    const productsWithoutImages = await prisma.product.count({
      where: {
        images: {
          none: {
            imageUrl: { not: null }
          }
        }
      }
    });

    console.log(`\n🛍️  Product Image Coverage:`);
    console.log(`   ├─ Products without Shopify images: ${productsWithoutImages}`);
    console.log(`   └─ Products with Shopify images: ${947 - productsWithoutImages}`);

    // Sample of products with local images but no Shopify images
    const sampleProductsNeedingUpload = await prisma.product.findMany({
      where: {
        images: {
          some: {
            fileExists: true,
            imageUrl: null
          }
        }
      },
      include: {
        images: {
          where: {
            fileExists: true,
            imageUrl: null
          },
          take: 3
        }
      },
      take: 5
    });

    if (sampleProductsNeedingUpload.length > 0) {
      console.log(`\n📋 Sample Products Ready for Image Upload:`);
      sampleProductsNeedingUpload.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.sku} - ${product.title}`);
        product.images.forEach((image) => {
          console.log(`      └─ ${image.localPath} (order: ${image.imageOrder})`);
        });
      });
    }

    // Check image file locations
    const sampleLocalPaths = await prisma.productImage.findMany({
      where: {
        fileExists: true
      },
      select: {
        localPath: true
      },
      take: 5
    });

    if (sampleLocalPaths.length > 0) {
      console.log(`\n📁 Sample Local Image Paths:`);
      sampleLocalPaths.forEach((image, index) => {
        console.log(`   ${index + 1}. ${image.localPath}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking image status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageStatus();