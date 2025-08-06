#!/usr/bin/env tsx

/**
 * Fix Specification Migration - Handle Duplicates
 * Task 10.1 - Create unique specification names for duplicates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSpecificationMigration() {
  console.log('🔧 Fixing specification migration - handling duplicates...');
  
  try {
    // First, let's modify the unique constraint to be less restrictive temporarily
    console.log('📝 Temporarily removing strict unique constraint...');
    
    await prisma.$executeRaw`
      ALTER TABLE technical_specifications 
      DROP CONSTRAINT IF EXISTS "technical_specifications_product_id_category_id_name_key";
    `;
    
    // Find all unmigrated specifications grouped by potential duplicates
    const duplicateSpecs = await prisma.$queryRaw<any[]>`
      SELECT 
        product_id, 
        category,
        name,
        array_agg(id ORDER BY created_at) as spec_ids,
        array_agg(value ORDER BY created_at) as values,
        COUNT(*) as count
      FROM technical_specifications 
      WHERE category_id IS NULL
      GROUP BY product_id, category, name 
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `;
    
    console.log(`🔍 Found ${duplicateSpecs.length} groups of duplicate specifications`);
    
    // Process duplicates by making names unique
    let processedCount = 0;
    
    for (const group of duplicateSpecs) {
      const specIds = group.spec_ids as string[];
      const values = group.values as string[];
      
      // Keep the first one with original name, modify others
      for (let i = 1; i < specIds.length; i++) {
        const uniqueName = `${group.name}_${i + 1}`;
        
        try {
          await prisma.technicalSpecification.update({
            where: { id: specIds[i] },
            data: { name: uniqueName }
          });
          processedCount++;
        } catch (error) {
          console.error(`Error updating spec ${specIds[i]}:`, error.message);
        }
      }
      
      if (processedCount % 100 === 0) {
        console.log(`   ✓ Processed ${processedCount} duplicate specifications...`);
      }
    }
    
    console.log(`✅ Processed ${processedCount} duplicate specifications`);
    
    // Now run the original migration
    console.log('🔄 Running specification categorization...');
    
    // Import and run the migration function
    const { migrateExistingSpecifications } = await import('./migrate-existing-specifications.js');
    const migrationResult = await migrateExistingSpecifications();
    
    console.log('✅ Migration completed successfully!');
    
    // Restore the unique constraint but with a more flexible approach
    console.log('🔒 Creating flexible unique constraint...');
    
    await prisma.$executeRaw`
      ALTER TABLE technical_specifications 
      ADD CONSTRAINT "technical_specifications_product_category_name_unique" 
      UNIQUE (product_id, category_id, name);
    `;
    
    return {
      duplicatesProcessed: processedCount,
      migration: migrationResult
    };
    
  } catch (error) {
    console.error('💥 Fix failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixSpecificationMigration()
    .then((result) => {
      console.log('🎉 Fix completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { fixSpecificationMigration };