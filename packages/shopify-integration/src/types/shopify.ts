import { z } from 'zod';

// Shopify Product Types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  compare_at_price?: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  option1?: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyImage {
  id: string;
  product_id: string;
  src: string;
  alt?: string;
  position: number;
  width: number;
  height: number;
  variant_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

// GraphQL Response Types
export interface ProductCreateResponse {
  productCreate: {
    product?: ShopifyProduct;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export interface ProductUpdateResponse {
  productUpdate: {
    product?: ShopifyProduct;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

export interface BulkOperationResponse {
  bulkOperationRunQuery: {
    bulkOperation?: {
      id: string;
      status: string;
      errorCode?: string;
      createdAt: string;
      completedAt?: string;
      objectCount?: string;
      fileSize?: string;
      url?: string;
    };
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

// Migration specific types
export interface MigrationProgress {
  totalProducts: number;
  processedProducts: number;
  successfulProducts: number;
  failedProducts: number;
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  startTime: Date;
  endTime?: Date;
  currentPhase: 'preparation' | 'products' | 'variants' | 'images' | 'validation' | 'completed' | 'failed';
  errors: MigrationError[];
}

export interface MigrationError {
  type: 'product' | 'variant' | 'image' | 'api' | 'validation';
  entityId: string;
  message: string;
  details?: any;
  timestamp: Date;
  retryCount: number;
}

export interface ProductMappingResult {
  localProductId: string;
  shopifyProductId?: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  errors: string[];
  variants: VariantMappingResult[];
  images: ImageMappingResult[];
}

export interface VariantMappingResult {
  localVariantId?: string;
  shopifyVariantId?: string;
  sku: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  errors: string[];
}

export interface ImageMappingResult {
  localImageId: string;
  shopifyImageId?: string;
  localPath: string;
  shopifyUrl?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'skipped';
  errors: string[];
  fileSize?: number;
  processedSize?: number;
}

// Validation Schemas
export const ShopifyProductSchema = z.object({
  title: z.string().min(1).max(255),
  handle: z.string().min(1).max(255),
  description: z.string().optional(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
});

export const ShopifyVariantSchema = z.object({
  title: z.string().min(1).max(255),
  price: z.string().regex(/^\d+\.\d{2}$/),
  sku: z.string().optional(),
  compare_at_price: z.string().regex(/^\d+\.\d{2}$/).optional(),
  inventory_quantity: z.number().int().min(0),
  weight: z.number().min(0),
  weight_unit: z.enum(['g', 'kg', 'oz', 'lb']).default('g'),
});

export const ShopifyImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().optional(),
  position: z.number().int().min(1),
});

// Migration Configuration
export interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  parallelProcessing: boolean;
  maxConcurrency: number;
  skipImages: boolean;
  skipPdfs: boolean;
  includeProductTypes: string[];
  excludeProductTypes: string[];
  validateOnly: boolean;
  resumeFromProduct?: string;
}

export const defaultMigrationConfig: MigrationConfig = {
  dryRun: false,
  batchSize: 10,
  maxRetries: 3,
  retryDelay: 1000,
  parallelProcessing: true,
  maxConcurrency: 5,
  skipImages: false,
  skipPdfs: false,
  includeProductTypes: [],
  excludeProductTypes: [],
  validateOnly: false,
};

// API Rate Limiting
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime: Date;
  bucketSize: number;
}

export interface APICallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimit?: RateLimitInfo;
  retryAfter?: number;
}

// Shopify Bulk Operations
export interface BulkOperationStatus {
  id: string;
  status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
  objectCount?: number;
  fileSize?: number;
  url?: string;
  type: 'QUERY' | 'MUTATION';
}

// Media Processing
export interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  progressive: boolean;
  stripMetadata: boolean;
}

export const defaultImageProcessingOptions: ImageProcessingOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 90,
  format: 'jpeg',
  progressive: true,
  stripMetadata: true,
};

export interface ProcessedImage {
  originalPath: string;
  processedPath: string;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
  format: string;
}

// Cross-system Association Tracking
export interface ProductAssociation {
  localProductId: string;
  shopifyProductId: string;
  localHandle: string;
  shopifyHandle: string;
  lastSynced: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  conflictStatus?: 'none' | 'title' | 'price' | 'inventory' | 'other';
}

export interface VariantAssociation {
  localVariantId: string;
  shopifyVariantId: string;
  sku: string;
  lastSynced: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface MediaAssociation {
  localImageId: string;
  shopifyImageId: string;
  localPath: string;
  shopifyUrl: string;
  lastSynced: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}