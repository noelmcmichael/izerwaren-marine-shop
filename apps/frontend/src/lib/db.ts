import { prisma } from '../lib/prisma-stub';
import type {
  Dealer,
  DealerPricing,
  RfqRequest,
  Product,
  ProductVariant,
  ProductSyncLog,
  DealerTier,
  RfqStatus,
  SyncOperation,
  SyncStatus,
} from '@prisma/client';

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Dealer management functions
export async function createDealer(data: {
  firebaseUid: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  tier?: DealerTier;
}) {
  return await prisma.dealer.create({
    data: {
      firebaseUid: data.firebaseUid,
      companyName: data.companyName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      tier: data.tier || 'STANDARD',
    },
  });
}

export async function getDealerByFirebaseUid(firebaseUid: string) {
  return await prisma.dealer.findUnique({
    where: { firebaseUid },
    include: {
      shopifyCustomers: true,
      dealerPricing: {
        where: {
          isActive: true,
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: new Date() } }],
        },
      },
    },
  });
}

export async function getAllDealers(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [dealers, total] = await Promise.all([
    prisma.dealer.findMany({
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            dealerPricing: true,
            rfqRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dealer.count(),
  ]);

  return {
    dealers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Pricing management functions
export async function createDealerPricing(data: {
  dealerId: string;
  shopifyProductId: string;
  shopifyVariantId?: string;
  markdownPercent?: number;
  fixedPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}) {
  return await prisma.dealerPricing.create({
    data: {
      dealerId: data.dealerId,
      shopifyProductId: data.shopifyProductId,
      shopifyVariantId: data.shopifyVariantId,
      markdownPercent: data.markdownPercent || 0,
      fixedPrice: data.fixedPrice,
      minQuantity: data.minQuantity || 1,
      maxQuantity: data.maxQuantity,
      effectiveFrom: data.effectiveFrom || new Date(),
      effectiveUntil: data.effectiveUntil,
    },
  });
}

export async function getDealerPricing(dealerId: string) {
  return await prisma.dealerPricing.findMany({
    where: {
      dealerId,
      isActive: true,
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: new Date() } }],
    },
    include: {
      dealer: {
        select: {
          companyName: true,
          tier: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Product shadow table functions
export async function upsertProduct(data: {
  shopifyProductId: string;
  title: string;
  handle: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  description?: string;
  status?: string;
}) {
  return await prisma.product.upsert({
    where: { shopifyProductId: data.shopifyProductId },
    update: {
      title: data.title,
      handle: data.handle,
      vendor: data.vendor,
      productType: data.productType,
      tags: data.tags,
      description: data.description,
      status: data.status || 'active',
      updatedAt: new Date(),
    },
    create: {
      shopifyProductId: data.shopifyProductId,
      title: data.title,
      handle: data.handle,
      vendor: data.vendor,
      productType: data.productType,
      tags: data.tags,
      description: data.description,
      status: data.status || 'active',
    },
  });
}

export async function upsertProductVariant(data: {
  productId: string;
  shopifyVariantId: string;
  sku?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  inventoryQty?: number;
  weight?: number;
  weightUnit?: string;
}) {
  return await prisma.productVariant.upsert({
    where: { shopifyVariantId: data.shopifyVariantId },
    update: {
      sku: data.sku,
      title: data.title,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      inventoryQty: data.inventoryQty || 0,
      weight: data.weight,
      weightUnit: data.weightUnit,
    },
    create: {
      productId: data.productId,
      shopifyVariantId: data.shopifyVariantId,
      sku: data.sku,
      title: data.title,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      inventoryQty: data.inventoryQty || 0,
      weight: data.weight,
      weightUnit: data.weightUnit,
    },
  });
}

// Product sync logging
export async function logSyncOperation(data: {
  productId?: string;
  shopifyProductId?: string;
  operation: SyncOperation;
  status: SyncStatus;
  errorMessage?: string;
  sourceData?: any;
  batchId?: string;
}) {
  return await prisma.productSyncLog.create({
    data: {
      productId: data.productId,
      shopifyProductId: data.shopifyProductId,
      operation: data.operation,
      status: data.status,
      errorMessage: data.errorMessage,
      sourceData: data.sourceData,
      syncedAt: new Date(),
    },
  });
}

export async function getSyncLogs(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;

  return await prisma.productSyncLog.findMany({
    skip,
    take: limit,
    include: {
      product: {
        select: {
          title: true,
          handle: true,
        },
      },
    },
    orderBy: { syncedAt: 'desc' },
  });
}

export async function getFailedSyncOperations() {
  return await prisma.productSyncLog.findMany({
    where: {
      status: 'FAILED',
      syncedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: {
      product: {
        select: {
          title: true,
          handle: true,
          shopifyProductId: true,
        },
      },
    },
    orderBy: { syncedAt: 'desc' },
  });
}

// Search and filtering helpers
export async function searchProducts(query: string, limit: number = 20) {
  return await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { handle: { contains: query, mode: 'insensitive' } },
        { vendor: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
      status: 'active',
    },
    include: {
      variants: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });
}

// RFQ system functions
export async function createRfqRequest(data: {
  dealerId: string;
  customerMessage: string;
  items: Array<{
    shopifyProductId: string;
    shopifyVariantId?: string;
    sku: string;
    productTitle: string;
    quantity: number;
    notes?: string;
  }>;
}) {
  const requestNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return await prisma.rfqRequest.create({
    data: {
      dealerId: data.dealerId,
      requestNumber,
      customerMessage: data.customerMessage,
      items: {
        create: data.items,
      },
    },
    include: {
      items: true,
      dealer: {
        select: {
          companyName: true,
          contactEmail: true,
        },
      },
    },
  });
}

export async function getRfqRequests(status?: RfqStatus, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  return await prisma.rfqRequest.findMany({
    where,
    skip,
    take: limit,
    include: {
      dealer: {
        select: {
          companyName: true,
          contactEmail: true,
        },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
