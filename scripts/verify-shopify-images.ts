import { PrismaClient } from '@izerwaren/database';
import { createShopifyClient } from '@izerwaren/shopify-integration';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function verifyShopifyImages() {
  console.log('🔍 Verifying Shopify Image Status\n================================');
  
  try {
    // Initialize Shopify client
    const shopifyClient = createShopifyClient();

    // Get a sample of products from the database
    const sampleProducts = await prisma.product.findMany({
      where: {
        shopifyProductId: { not: null }
      },
      include: {
        images: {
          take: 3
        }
      },
      take: 5
    });

    console.log(`📋 Checking ${sampleProducts.length} sample products in Shopify:\n`);

    for (const product of sampleProducts) {
      console.log(`🛍️  Product: ${product.sku} - ${product.title}`);
      console.log(`   Shopify ID: ${product.shopifyProductId}`);
      console.log(`   DB images: ${product.images.length}`);

      if (product.shopifyProductId) {
        try {
          // Get product images from Shopify
          const shopifyImagesResult = await getProductImagesFromShopify(
            shopifyClient, 
            product.shopifyProductId
          );

          if (shopifyImagesResult.success && shopifyImagesResult.data) {
            console.log(`   Shopify images: ${shopifyImagesResult.data.length}`);
            
            if (shopifyImagesResult.data.length > 0) {
              console.log(`   Sample Shopify image: ${shopifyImagesResult.data[0].src}`);
            } else {
              console.log(`   ⚠️  No images found in Shopify!`);
            }
          } else {
            console.log(`   ❌ Error fetching Shopify images: ${shopifyImagesResult.error}`);
          }
        } catch (error) {
          console.log(`   ❌ Error checking Shopify: ${error}`);
        }
      }

      // Show sample DB image URLs
      if (product.images.length > 0) {
        console.log(`   Sample DB image URL: ${product.images[0].imageUrl || 'NULL'}`);
        console.log(`   Sample local path: ${product.images[0].localPath}`);
      }
      
      console.log('');
    }

    // Check overall statistics
    const totalProductsWithShopifyImages = await countProductsWithShopifyImages(shopifyClient);
    console.log(`📊 Overall Statistics:`);
    console.log(`   └─ Products checked in Shopify: ${totalProductsWithShopifyImages} (sample check)`);

  } catch (error) {
    console.error('❌ Error verifying Shopify images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getProductImagesFromShopify(client: any, productId: string) {
  try {
    const query = `
      query getProductImages($id: ID!) {
        product(id: $id) {
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    `;

    const response = await client.query<{
      product: {
        images: {
          edges: Array<{ 
            node: { 
              id: string; 
              url: string; 
              altText?: string; 
              width?: number; 
              height?: number; 
            } 
          }>;
        };
      };
    }>(query, { id: productId });

    return {
      success: true,
      data: response.product.images.edges.map(edge => ({
        id: edge.node.id,
        src: edge.node.url,
        altText: edge.node.altText,
        width: edge.node.width,
        height: edge.node.height,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function countProductsWithShopifyImages(client: any): Promise<number> {
  try {
    const query = `
      query {
        products(first: 10) {
          edges {
            node {
              id
              images(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query<{
      products: {
        edges: Array<{
          node: {
            id: string;
            images: {
              edges: Array<{ node: { id: string } }>;
            };
          };
        }>;
      };
    }>(query);

    const productsWithImages = response.products.edges.filter(
      edge => edge.node.images.edges.length > 0
    ).length;

    return productsWithImages;
  } catch (error) {
    console.error('Error counting products with images:', error);
    return 0;
  }
}

verifyShopifyImages();