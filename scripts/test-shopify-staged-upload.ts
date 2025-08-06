#!/usr/bin/env tsx
/* eslint-disable no-console */

import { createShopifyClient } from '@izerwaren/shopify-integration';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testStagedUpload() {
  console.log('🧪 Testing Shopify Staged Upload\n===============================');
  
  try {
    const client = createShopifyClient();
    
    // Step 1: Get a real image file from our collection
    const testImagePath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products/0019f0a1-1879-422c-8d19-34950334f7a4.jpg';
    const imageBuffer = await fs.readFile(testImagePath);
    console.log(`📁 Test image: ${path.basename(testImagePath)} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
    
    // Step 2: Create staged upload URL
    console.log('\n🔍 Step 2: Creating staged upload...');
    const stagedUploadMutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedUploadVariables = {
      input: [{
        resource: "IMAGE",
        filename: path.basename(testImagePath),
        mimeType: "image/jpeg",
        fileSize: imageBuffer.length.toString()
      }]
    };

    const stagedUploadResponse = await client.mutation(stagedUploadMutation, stagedUploadVariables);
    console.log('📥 Staged upload response:', JSON.stringify(stagedUploadResponse, null, 2));
    
    if (stagedUploadResponse && stagedUploadResponse.stagedUploadsCreate) {
      const stagedTarget = stagedUploadResponse.stagedUploadsCreate.stagedTargets[0];
      
      if (stagedTarget) {
        console.log('✅ Staged upload URL created');
        console.log(`   Upload URL: ${stagedTarget.url}`);
        console.log(`   Resource URL: ${stagedTarget.resourceUrl}`);
        
        // Step 3: Upload file to staged URL
        console.log('\n📤 Step 3: Uploading file to staged URL...');
        await uploadToStagedUrl(stagedTarget, imageBuffer, path.basename(testImagePath));
        
        // Step 4: Create product image using staged upload
        console.log('\n🔗 Step 4: Creating product image from staged upload...');
        await createProductImageFromStaged(client, stagedTarget.resourceUrl);
        
      } else {
        console.log('❌ No staged target received');
      }
    } else {
      console.log('❌ Failed to create staged upload');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function uploadToStagedUrl(stagedTarget: any, imageBuffer: Buffer, filename: string) {
  try {
    // Create form data for upload
    const formData = new FormData();
    
    // Add parameters from staged upload
    stagedTarget.parameters.forEach((param: any) => {
      formData.append(param.name, param.value);
    });
    
    // Add file
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, filename);
    
    // Upload to staged URL
    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      console.log('✅ File uploaded to staged URL successfully');
    } else {
      console.log(`❌ Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      const responseText = await uploadResponse.text();
      console.log('Response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Staged upload failed:', error);
  }
}

async function createProductImageFromStaged(client: any, resourceUrl: string) {
  try {
    // Get a test product
    const productQuery = `
      query {
        products(first: 1) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `;
    
    const productsResponse = await client.query(productQuery);
    const testProduct = productsResponse.products.edges[0].node;
    
    // Create product image using staged upload
    const createImageMutation = `
      mutation productMediaCreate($productId: ID!, $media: [CreateMediaInput!]!) {
        productMediaCreate(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
              image {
                url
                altText
                width
                height
              }
            }
          }
          mediaUserErrors {
            field
            message
            code
          }
        }
      }
    `;
    
    const createImageVariables = {
      productId: testProduct.id,
      media: [{
        originalSource: resourceUrl,
        altText: 'Test staged upload image',
        mediaContentType: 'IMAGE'
      }]
    };
    
    const createImageResponse = await client.mutation(createImageMutation, createImageVariables);
    console.log('📥 Create image response:', JSON.stringify(createImageResponse, null, 2));
    
    if (createImageResponse && createImageResponse.productMediaCreate && createImageResponse.productMediaCreate.media && createImageResponse.productMediaCreate.media.length > 0) {
      const media = createImageResponse.productMediaCreate.media[0];
      console.log('✅ Product image created successfully!');
      console.log(`   Image ID: ${media.id}`);
      console.log(`   Image URL: ${media.image.url}`);
      console.log(`   Dimensions: ${media.image.width}x${media.image.height}`);
    } else {
      console.log('❌ Failed to create product image');
      if (createImageResponse && createImageResponse.productMediaCreate && createImageResponse.productMediaCreate.mediaUserErrors) {
        console.log('Errors:', createImageResponse.productMediaCreate.mediaUserErrors);
      }
    }
    
  } catch (error) {
    console.error('❌ Create product image failed:', error);
  }
}

testStagedUpload();