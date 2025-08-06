import { prisma } from '../index';

export async function getMigrationStatus() {
  try {
    // Check if migrations table exists and get status
    const migrations = await prisma.$queryRaw<
      Array<{
        migration_name: string;
        finished_at: Date | null;
      }>
    >`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10
    `;

    return {
      success: true,
      migrations,
      lastMigration: migrations[0] || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      migrations: [],
    };
  }
}

export async function getTableCounts() {
  try {
    const tables = [
      'products',
      'product_variants',
      'technical_specifications',
      'product_images',
      'product_pdfs',
      'dealers',
      'rfq_requests',
    ];

    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        counts[table] = Number((result as any)[0]?.count || 0);
      } catch {
        counts[table] = 0;
      }
    }

    return {
      success: true,
      counts,
      totalRecords: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      counts: {},
    };
  }
}
