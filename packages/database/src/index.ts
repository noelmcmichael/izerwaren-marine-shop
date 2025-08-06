import { PrismaClient } from '@prisma/client';

// Create a global singleton for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export Prisma types for use in other packages
export * from '@prisma/client';

// Database utilities - temporarily disabled for compilation
// export * from './utils/connection';
// export * from './utils/migration';
// export * from './repositories/products';
// export * from './repositories/media';
// export * from './repositories/customers';
