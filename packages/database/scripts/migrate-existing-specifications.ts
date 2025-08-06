#!/usr/bin/env tsx

/**
 * Migrate Existing Technical Specifications to New Category System
 * Task 10.1 completion - categorize legacy specifications
 */

import { PrismaClient, SpecImportance, SpecDataType } from '@prisma/client';

const prisma = new PrismaClient();

// Category mapping based on legacy category strings
const categoryMapping = {
  'dimension': 'physical_dimensions',
  'dimensions': 'physical_dimensions',
  'physical': 'physical_dimensions',
  'size': 'physical_dimensions',
  'length': 'physical_dimensions',
  'width': 'physical_dimensions',
  'height': 'physical_dimensions',
  'diameter': 'physical_dimensions',
  'thickness': 'physical_dimensions',
  
  'material': 'material_properties',
  'materials': 'material_properties',
  'finish': 'material_properties',
  'coating': 'material_properties',
  'construction': 'material_properties',
  
  'force': 'performance_specs',
  'strength': 'performance_specs',
  'load': 'performance_specs',
  'working_load': 'performance_specs',
  'breaking_strength': 'performance_specs',
  'tensile': 'performance_specs',
  'pressure': 'performance_specs',
  
  'current': 'electrical_specs',
  'voltage': 'electrical_specs',
  'power': 'electrical_specs',
  'electrical': 'electrical_specs',
  
  'weight': 'package_info',
  'package': 'package_info',
  'packaging': 'package_info',
  'quantity': 'package_info',
  
  'environment': 'environmental_ratings',
  'environmental': 'environmental_ratings',
  'marine': 'environmental_ratings',
  'corrosion': 'environmental_ratings',
  'resistance': 'environmental_ratings',
  'ip_rating': 'environmental_ratings',
  'rating': 'environmental_ratings',
  
  'standard': 'compliance_certs',
  'certification': 'compliance_certs',
  'compliance': 'compliance_certs',
  'iso': 'compliance_certs',
  'astm': 'compliance_certs',
  
  'installation': 'installation_specs',
  'mounting': 'installation_specs',
  'clearance': 'installation_specs',
};

// Specification importance detection
function detectImportance(name: string, category: string): SpecImportance {
  const criticalKeywords = ['breaking', 'ultimate', 'maximum', 'working_load', 'strength', 'safety'];
  const importantKeywords = ['load', 'force', 'current', 'voltage', 'diameter', 'length'];
  
  const lowerName = name.toLowerCase();
  
  if (criticalKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'CRITICAL';
  }
  
  if (importantKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'IMPORTANT';
  }
  
  if (category === 'physical_dimensions' || category === 'performance_specs') {
    return 'IMPORTANT';
  }
  
  return 'STANDARD';
}

// Data type detection based on value and unit
function detectDataType(value: string, unit: string | null): SpecDataType {
  // Check for numeric values
  const numericRegex = /^[\d\.,\-\s]+$/;
  const rangeRegex = /^\d+[\s]*[-–]\s*\d+/;
  const booleanValues = ['yes', 'no', 'true', 'false', 'y', 'n'];
  
  if (rangeRegex.test(value.trim())) {
    return 'RANGE';
  }
  
  if (numericRegex.test(value.trim()) && unit) {
    return 'NUMERIC';
  }
  
  if (booleanValues.includes(value.toLowerCase().trim())) {
    return 'BOOLEAN';
  }
  
  if (value.toLowerCase().includes('http') || value.toLowerCase().includes('www')) {
    return 'URL';
  }
  
  return 'TEXT';
}

// Extract numeric values from specification values
function extractNumericValue(value: string): { numeric: number | null, min: number | null, max: number | null } {
  // Remove common non-numeric characters but keep decimal points and ranges
  const cleaned = value.replace(/[^\d\.,\-–\s]/g, '');
  
  // Check for range values (e.g., "100-150", "100 - 150")
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return { numeric: null, min, max };
  }
  
  // Single numeric value
  const numericMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (numericMatch) {
    const numeric = parseFloat(numericMatch[1]);
    return { numeric, min: null, max: null };
  }
  
  return { numeric: null, min: null, max: null };
}

async function migrateExistingSpecifications() {
  console.log('🔄 Migrating existing technical specifications to new category system...');
  
  try {
    // Get all existing specifications
    const existingSpecs = await prisma.technicalSpecification.findMany({
      where: { categoryId: null }, // Only unmigrated specs
      include: { product: true }
    });
    
    console.log(`📊 Found ${existingSpecs.length} specifications to migrate`);
    
    // Get all categories for mapping
    const categories = await prisma.specificationCategory.findMany();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
    
    let migratedCount = 0;
    let errors: any[] = [];
    
    for (const spec of existingSpecs) {
      try {
        // Determine category based on legacy category field
        let categoryName = 'package_info'; // default fallback
        
        if (spec.category) {
          const legacyCategory = spec.category.toLowerCase();
          categoryName = categoryMapping[legacyCategory] || categoryName;
          
          // Check if any mapping key is contained in the legacy category
          for (const [key, mappedCategory] of Object.entries(categoryMapping)) {
            if (legacyCategory.includes(key)) {
              categoryName = mappedCategory;
              break;
            }
          }
        }
        
        // Get category ID
        const categoryId = categoryMap.get(categoryName);
        if (!categoryId) {
          console.warn(`⚠️  Category not found: ${categoryName}`);
          continue;
        }
        
        // Detect data type and importance
        const dataType = detectDataType(spec.value, spec.unit);
        const importance = detectImportance(spec.name, categoryName);
        
        // Extract numeric values
        const { numeric, min, max } = extractNumericValue(spec.value);
        
        // Update specification with enhanced metadata
        await prisma.technicalSpecification.update({
          where: { id: spec.id },
          data: {
            categoryId: categoryId,
            dataType: dataType,
            importance: importance,
            numericValue: numeric,
            numericMin: min,
            numericMax: max,
            sourceSystem: 'legacy',
            isValidated: false,
            version: 1,
          }
        });
        
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`   ✓ Migrated ${migratedCount} specifications...`);
        }
        
      } catch (error) {
        errors.push({ specId: spec.id, error: error.message });
        console.error(`❌ Error migrating spec ${spec.id}:`, error.message);
      }
    }
    
    console.log(`✅ Migration completed!`);
    console.log(`   - Migrated: ${migratedCount} specifications`);
    console.log(`   - Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      errors.slice(0, 5).forEach(err => console.log(`   - ${err.specId}: ${err.error}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more`);
      }
    }
    
    // Create summary report
    const migrationSummary = await prisma.technicalSpecification.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: { categoryId: { not: null } }
    });
    
    console.log('\n📊 Migration Summary by Category:');
    for (const summary of migrationSummary) {
      const category = categories.find(cat => cat.id === summary.categoryId);
      console.log(`   - ${category?.displayName || 'Unknown'}: ${summary._count._all} specifications`);
    }
    
    return {
      migrated: migratedCount,
      errors: errors.length,
      summary: migrationSummary
    };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateExistingSpecifications()
    .then((result) => {
      console.log('🎉 Migration completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { migrateExistingSpecifications };