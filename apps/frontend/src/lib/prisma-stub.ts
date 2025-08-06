// Prisma stub for hotfix - this frontend should not directly use database
// All data should come through API routes

export const prisma = {
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  // Add other methods as needed
};

export type PrismaClient = typeof prisma;