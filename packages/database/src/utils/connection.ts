import { prisma } from '../index';

export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

export async function getDatabaseInfo() {
  try {
    // Get database version and basic info
    const result = await prisma.$queryRaw<Array<{ version(): string }>>`SELECT version()`;
    return {
      connected: true,
      version: result[0]?.['version()'] || 'Unknown',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
