#!/usr/bin/env tsx
/* eslint-disable no-console */

import { PrismaClient } from '@izerwaren/database';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

interface LocalImageFile {
  filename: string;
  fullPath: string;
  size: number;
  uuid: string;
  extension: string;
}

interface ImageMappingResult {
  localFile: LocalImageFile;
  dbRecord?: {
    id: string;
    productId: string;
    productSku: string;
    productTitle: string;
    imageOrder: number | null;
    isPrimary: boolean;
    oldUrl: string | null;
  };
  status: 'MAPPED' | 'ORPHANED' | 'MISSING_FILE';
  validationErrors: string[];
}

async function discoverAndMapImages() {
  console.log('🔍 Image Migration Discovery & Mapping\n=====================================');
  
  try {
    // Step 1: Scan local image files
    console.log('📁 Step 1: Scanning local image files...');
    const localFiles = await scanLocalImageFiles();
    console.log(`   Found ${localFiles.length} local image files`);

    // Step 2: Load database image records
    console.log('\n💾 Step 2: Loading database image records...');
    const dbRecords = await loadDatabaseImageRecords();
    console.log(`   Found ${dbRecords.length} database image records`);

    // Step 3: Map files to database records
    console.log('\n🔗 Step 3: Mapping files to database records...');
    const mappingResults = await mapFilesToDbRecords(localFiles, dbRecords);
    
    // Step 4: Validate image files
    console.log('\n✅ Step 4: Validating image files...');
    const validatedResults = await validateImageFiles(mappingResults);

    // Step 5: Generate summary report
    console.log('\n📊 Step 5: Generating summary report...');
    await generateSummaryReport(validatedResults);

    // Step 6: Generate upload manifest
    console.log('\n📋 Step 6: Generating upload manifest...');
    await generateUploadManifest(validatedResults);

    console.log('\n✅ Discovery and mapping complete!');
    
  } catch (error) {
    console.error('❌ Error during discovery:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function scanLocalImageFiles(): Promise<LocalImageFile[]> {
  const imageDir = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/public/images_bak/products';
  const files: LocalImageFile[] = [];
  
  try {
    const dirEntries = await fs.readdir(imageDir);
    
    for (const filename of dirEntries) {
      // Skip non-image files and system files
      if (filename.startsWith('.') || !isImageFile(filename)) {
        continue;
      }
      
      const fullPath = path.join(imageDir, filename);
      const stats = await fs.stat(fullPath);
      
      // Extract UUID from filename (before first dot)
      const uuid = path.basename(filename, path.extname(filename));
      const extension = path.extname(filename).toLowerCase();
      
      files.push({
        filename,
        fullPath,
        size: stats.size,
        uuid,
        extension,
      });
    }
    
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
    
  } catch (error) {
    console.error(`Error scanning image directory: ${error}`);
    return [];
  }
}

async function loadDatabaseImageRecords() {
  return await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          title: true,
          shopifyProductId: true,
        }
      }
    },
    orderBy: [
      { product: { sku: 'asc' } },
      { imageOrder: 'asc' }
    ]
  });
}

async function mapFilesToDbRecords(
  localFiles: LocalImageFile[], 
  dbRecords: any[]
): Promise<ImageMappingResult[]> {
  const results: ImageMappingResult[] = [];
  
  // Create lookup map for database records by UUID
  const dbRecordsByUuid = new Map();
  dbRecords.forEach(record => {
    // Extract UUID from local path or image URL
    const localPathUuid = extractUuidFromPath(record.localPath);
    const imageUrlUuid = record.imageUrl ? extractUuidFromPath(record.imageUrl) : null;
    
    if (localPathUuid) {
      dbRecordsByUuid.set(localPathUuid, {
        id: record.id,
        productId: record.productId,
        productSku: record.product.sku,
        productTitle: record.product.title,
        imageOrder: record.imageOrder,
        isPrimary: record.isPrimary,
        oldUrl: record.imageUrl,
      });
    }
    
    if (imageUrlUuid && imageUrlUuid !== localPathUuid) {
      dbRecordsByUuid.set(imageUrlUuid, {
        id: record.id,
        productId: record.productId,
        productSku: record.product.sku,
        productTitle: record.product.title,
        imageOrder: record.imageOrder,
        isPrimary: record.isPrimary,
        oldUrl: record.imageUrl,
      });
    }
  });
  
  // Map each local file to database record
  for (const localFile of localFiles) {
    const dbRecord = dbRecordsByUuid.get(localFile.uuid);
    
    results.push({
      localFile,
      dbRecord,
      status: dbRecord ? 'MAPPED' : 'ORPHANED',
      validationErrors: [],
    });
  }
  
  // Check for database records without local files
  for (const dbRecord of dbRecords) {
    const localPathUuid = extractUuidFromPath(dbRecord.localPath);
    const hasLocalFile = localFiles.some(file => file.uuid === localPathUuid);
    
    if (!hasLocalFile && localPathUuid) {
      results.push({
        localFile: {
          filename: `${localPathUuid}.jpg`, // Assume extension
          fullPath: '',
          size: 0,
          uuid: localPathUuid,
          extension: '.jpg',
        },
        dbRecord: {
          id: dbRecord.id,
          productId: dbRecord.productId,
          productSku: dbRecord.product.sku,
          productTitle: dbRecord.product.title,
          imageOrder: dbRecord.imageOrder,
          isPrimary: dbRecord.isPrimary,
          oldUrl: dbRecord.imageUrl,
        },
        status: 'MISSING_FILE',
        validationErrors: ['Local file not found'],
      });
    }
  }
  
  return results;
}

async function validateImageFiles(mappingResults: ImageMappingResult[]): Promise<ImageMappingResult[]> {
  const validatedResults = [...mappingResults];
  
  for (const result of validatedResults) {
    if (result.status === 'MISSING_FILE') {
      continue; // Already marked as invalid
    }
    
    try {
      const { fullPath } = result.localFile;
      
      // Check file exists
      await fs.access(fullPath);
      
      // Validate image with Sharp
      const metadata = await sharp(fullPath).metadata();
      
      // Validate format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        result.validationErrors.push(`Unsupported format: ${metadata.format}`);
      }
      
      // Validate dimensions
      if (!metadata.width || !metadata.height) {
        result.validationErrors.push('Unable to determine image dimensions');
      } else {
        if (metadata.width < 1 || metadata.height < 1) {
          result.validationErrors.push('Image dimensions too small');
        }
        if (metadata.width > 5760 || metadata.height > 5760) {
          result.validationErrors.push('Image dimensions too large (max 5760x5760)');
        }
      }
      
      // Validate file size (Shopify limit is 20MB)
      if (result.localFile.size > 20 * 1024 * 1024) {
        result.validationErrors.push('File size exceeds 20MB limit');
      }
      
      // Warn about large files that might need compression
      if (result.localFile.size > 2 * 1024 * 1024) {
        result.validationErrors.push('Large file (>2MB) - recommend compression');
      }
      
    } catch (error) {
      result.validationErrors.push(`File validation failed: ${error}`);
    }
  }
  
  return validatedResults;
}

async function generateSummaryReport(results: ImageMappingResult[]) {
  const stats = {
    total: results.length,
    mapped: results.filter(r => r.status === 'MAPPED').length,
    orphaned: results.filter(r => r.status === 'ORPHANED').length,
    missingFiles: results.filter(r => r.status === 'MISSING_FILE').length,
    validForUpload: results.filter(r => r.status === 'MAPPED' && r.validationErrors.length === 0).length,
    needsCompression: results.filter(r => 
      r.status === 'MAPPED' && 
      r.validationErrors.some(e => e.includes('Large file'))
    ).length,
    hasErrors: results.filter(r => r.validationErrors.length > 0).length,
  };
  
  console.log('📊 Summary Report:');
  console.log('==================');
  console.log(`Total files analyzed: ${stats.total}`);
  console.log(`├─ Successfully mapped: ${stats.mapped} (${((stats.mapped/stats.total)*100).toFixed(1)}%)`);
  console.log(`├─ Orphaned files: ${stats.orphaned} (${((stats.orphaned/stats.total)*100).toFixed(1)}%)`);
  console.log(`├─ Missing local files: ${stats.missingFiles} (${((stats.missingFiles/stats.total)*100).toFixed(1)}%)`);
  console.log(`├─ Ready for upload: ${stats.validForUpload} (${((stats.validForUpload/stats.total)*100).toFixed(1)}%)`);
  console.log(`├─ Need compression: ${stats.needsCompression}`);
  console.log(`└─ Have validation errors: ${stats.hasErrors}`);
  
  // Show sample mapped files
  const sampleMapped = results
    .filter(r => r.status === 'MAPPED' && r.validationErrors.length === 0)
    .slice(0, 5);
    
  if (sampleMapped.length > 0) {
    console.log('\n📋 Sample Ready for Upload:');
    sampleMapped.forEach((result, index) => {
      console.log(`${index + 1}. ${result.dbRecord!.productSku} - ${result.localFile.filename}`);
      console.log(`   └─ Product: ${result.dbRecord!.productTitle.substring(0, 60)}...`);
    });
  }
  
  // Show sample errors
  const sampleErrors = results
    .filter(r => r.validationErrors.length > 0)
    .slice(0, 3);
    
  if (sampleErrors.length > 0) {
    console.log('\n⚠️  Sample Validation Issues:');
    sampleErrors.forEach((result, index) => {
      console.log(`${index + 1}. ${result.localFile.filename} - ${result.status}`);
      result.validationErrors.forEach(error => {
        console.log(`   └─ ${error}`);
      });
    });
  }
  
  // Save detailed report
  const reportPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/image-discovery-report.json';
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    stats,
    results: results.map(r => ({
      filename: r.localFile.filename,
      uuid: r.localFile.uuid,
      size: r.localFile.size,
      status: r.status,
      productSku: r.dbRecord?.productSku,
      validationErrors: r.validationErrors,
    }))
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved: ${reportPath}`);
}

async function generateUploadManifest(results: ImageMappingResult[]) {
  const readyForUpload = results.filter(r => 
    r.status === 'MAPPED' && 
    r.validationErrors.length === 0 &&
    r.dbRecord?.productSku
  );
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalImages: readyForUpload.length,
    estimatedUploadTime: `${Math.ceil(readyForUpload.length * 0.5 / 60)} minutes`, // 500ms per image
    images: readyForUpload.map(result => ({
      localPath: result.localFile.fullPath,
      filename: result.localFile.filename,
      uuid: result.localFile.uuid,
      size: result.localFile.size,
      dbRecordId: result.dbRecord!.id,
      productId: result.dbRecord!.productId,
      productSku: result.dbRecord!.productSku,
      imageOrder: result.dbRecord!.imageOrder,
      isPrimary: result.dbRecord!.isPrimary,
      oldUrl: result.dbRecord!.oldUrl,
    }))
  };
  
  const manifestPath = '/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/.taskmaster/reports/upload-manifest.json';
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`📋 Upload manifest generated: ${manifestPath}`);
  console.log(`   └─ ${manifest.totalImages} images ready for upload`);
  console.log(`   └─ Estimated time: ${manifest.estimatedUploadTime}`);
}

// Helper functions
function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

function extractUuidFromPath(pathStr: string): string | null {
  if (!pathStr) return null;
  
  // Extract UUID from various path formats:
  // ./images/uuid.jpg
  // https://izerwaren.biz/Content/images/products/uuid.jpg
  // /path/to/uuid.jpg
  const matches = pathStr.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return matches ? matches[1] : null;
}

// Execute discovery
discoverAndMapImages();