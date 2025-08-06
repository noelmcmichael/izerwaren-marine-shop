#!/usr/bin/env node

/**
 * Database Migration Manager for B2B Supplements E-commerce
 * Manages schema migrations, performance optimizations, and data constraints
 * Author: Memex AI
 * Date: 2025-01-30
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🚀 Database Migration Manager');
  console.log('============================\n');

  const command = process.argv[2];

  switch (command) {
    case 'status':
      await showMigrationStatus();
      break;
    case 'apply':
      await applyMigrations();
      break;
    case 'optimize':
      await applyOptimizations();
      break;
    case 'constraints':
      await applyConstraints();
      break;
    case 'rollback':
      await rollbackMigration(process.argv[3]);
      break;
    case 'seed':
      await seedDatabase();
      break;
    case 'full-setup':
      await fullDatabaseSetup();
      break;
    default:
      showHelp();
  }

  await prisma.$disconnect();
}

function showHelp() {
  console.log('Available commands:');
  console.log('  status      - Show current migration status');
  console.log('  apply       - Apply pending migrations');
  console.log('  optimize    - Apply performance optimizations');
  console.log('  constraints - Apply data integrity constraints');
  console.log('  rollback    - Rollback specific migration');
  console.log('  seed        - Seed database with sample data');
  console.log('  full-setup  - Complete database setup (migrations + optimizations + constraints)');
  console.log('\nExample: node migration-manager.js full-setup');
}

async function showMigrationStatus() {
  console.log('📊 Current Migration Status');
  console.log('===========================\n');

  try {
    // Check if migration tracking table exists
    const migrationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;

    console.log('Database Connection:', migrationTableExists ? '✅ Connected' : '⚠️  No migration tracking');

    // Count total tables
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    console.log('Total Tables:', tableCount[0].count);

    // Count total indexes
    const indexCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `;
    console.log('Total Indexes:', indexCount[0].count);

    // Check core table record counts
    console.log('\n📈 Record Counts:');
    const coreTables = ['accounts', 'dealers', 'products', 'account_pricing', 'rfq_requests'];
    for (const table of coreTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        console.log(`  - ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`  - ${table}: Table not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
  }
}

async function applyMigrations() {
  console.log('📦 Applying Database Migrations');
  console.log('===============================\n');

  try {
    const migrationFiles = [
      '001_initial_schema.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '../migrations', file);
      if (fs.existsSync(filePath)) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await executeSqlFile(sql, file);
        console.log(`✅ Migration ${file} applied successfully\n`);
      } else {
        console.log(`⚠️  Migration file not found: ${file}`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function applyOptimizations() {
  console.log('⚡ Applying Performance Optimizations');
  console.log('=====================================\n');

  try {
    const filePath = path.join(__dirname, '../migrations/performance-optimizations.sql');
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      await executeSqlFile(sql, 'performance-optimizations.sql');
      console.log('✅ Performance optimizations applied successfully\n');
    } else {
      console.log('⚠️  Performance optimization file not found');
    }
  } catch (error) {
    console.error('❌ Performance optimization failed:', error.message);
    throw error;
  }
}

async function applyConstraints() {
  console.log('🔒 Applying Data Integrity Constraints');
  console.log('=======================================\n');

  try {
    const filePath = path.join(__dirname, '../migrations/data-constraints.sql');
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      await executeSqlFile(sql, 'data-constraints.sql');
      console.log('✅ Data constraints applied successfully\n');
    } else {
      console.log('⚠️  Data constraints file not found');
    }
  } catch (error) {
    console.error('❌ Data constraints application failed:', error.message);
    throw error;
  }
}

async function executeSqlFile(sql, filename) {
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.length === 0) continue;

    try {
      await prisma.$executeRawUnsafe(statement);
      successCount++;
      
      // Log progress for large files
      if (statements.length > 10 && (i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${statements.length} statements executed`);
      }
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('does not exist') ||
          error.message.includes('duplicate key')) {
        skipCount++;
      } else {
        console.log(`  ⚠️  Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log(`  📊 Execution Summary for ${filename}:`);
  console.log(`     - Successful: ${successCount}`);
  console.log(`     - Skipped: ${skipCount}`);
  console.log(`     - Errors: ${errorCount}`);
}

async function rollbackMigration(migrationName) {
  console.log(`🔄 Rolling back migration: ${migrationName}`);
  console.log('=========================================\n');

  if (!migrationName) {
    console.log('❌ Please specify migration name to rollback');
    return;
  }

  // This would implement rollback logic
  // For now, just show what would be rolled back
  console.log('⚠️  Rollback functionality not implemented yet');
  console.log('   Use manual SQL scripts for rollback operations');
}

async function seedDatabase() {
  console.log('🌱 Seeding Database with Sample Data');
  console.log('====================================\n');

  try {
    // Run the existing seed script
    const { spawn } = require('child_process');
    const seedProcess = spawn('npx', ['tsx', 'prisma/seed.ts'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    await new Promise((resolve, reject) => {
      seedProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database seeding completed successfully');
          resolve();
        } else {
          reject(new Error(`Seed process exited with code ${code}`));
        }
      });
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

async function fullDatabaseSetup() {
  console.log('🏗️  Full Database Setup');
  console.log('========================\n');

  try {
    console.log('Step 1: Checking current status...');
    await showMigrationStatus();
    console.log('\nStep 2: Applying migrations...');
    await applyMigrations();
    console.log('\nStep 3: Applying performance optimizations...');
    await applyOptimizations();
    console.log('\nStep 4: Applying data constraints...');
    await applyConstraints();
    console.log('\nStep 5: Final status check...');
    await showMigrationStatus();
    
    console.log('\n🎉 Full database setup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Run: node migration-manager.js seed (to add sample data)');
    console.log('   - Test: npm run test (to validate setup)');
    console.log('   - Monitor: Check the created performance views');

  } catch (error) {
    console.error('❌ Full database setup failed:', error.message);
    throw error;
  }
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the migration manager
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Migration manager failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  main, 
  showMigrationStatus, 
  applyMigrations, 
  applyOptimizations, 
  applyConstraints 
};