#!/usr/bin/env tsx

/**
 * Seed Specification Categories for Task 10
 * Creates default categories for marine hardware specifications
 */

import { PrismaClient, SpecImportance } from '@prisma/client';

const prisma = new PrismaClient();

const marineHardwareCategories = [
  // Physical Dimensions
  {
    name: 'physical_dimensions',
    displayName: 'Physical Dimensions',
    description: 'Product physical measurements and dimensional specifications',
    icon: 'ruler',
    color: '#3B82F6',
    importance: 'CRITICAL' as SpecImportance,
    unitSystem: 'both',
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 1,
    isActiveByDefault: true,
  },
  
  // Material Properties
  {
    name: 'material_properties',
    displayName: 'Material Properties',
    description: 'Material composition, finish, and treatment specifications',
    icon: 'layers',
    color: '#10B981',
    importance: 'CRITICAL' as SpecImportance,
    unitSystem: null,
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 2,
    isActiveByDefault: true,
  },
  
  // Performance Specifications
  {
    name: 'performance_specs',
    displayName: 'Performance Specifications',
    description: 'Load ratings, working limits, and performance characteristics',
    icon: 'zap',
    color: '#F59E0B',
    importance: 'CRITICAL' as SpecImportance,
    unitSystem: 'both',
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock'],
    displayOrder: 3,
    isActiveByDefault: true,
  },
  
  // Electrical Characteristics (for powered items)
  {
    name: 'electrical_specs',
    displayName: 'Electrical Characteristics',
    description: 'Voltage, current, power consumption, and electrical specifications',
    icon: 'zap',
    color: '#EF4444',
    importance: 'IMPORTANT' as SpecImportance,
    unitSystem: 'metric',
    applicableTypes: ['door_lock', 'powered_hardware'],
    displayOrder: 4,
    isActiveByDefault: true,
  },
  
  // Installation Requirements
  {
    name: 'installation_specs',
    displayName: 'Installation Requirements',
    description: 'Mounting requirements, clearances, and installation specifications',
    icon: 'tool',
    color: '#8B5CF6',
    importance: 'IMPORTANT' as SpecImportance,
    unitSystem: 'both',
    applicableTypes: ['cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 5,
    isActiveByDefault: true,
  },
  
  // Environmental Ratings
  {
    name: 'environmental_ratings',
    displayName: 'Environmental Ratings',
    description: 'Marine environment resistance, IP ratings, and durability specifications',
    icon: 'shield-check',
    color: '#06B6D4',
    importance: 'IMPORTANT' as SpecImportance,
    unitSystem: null,
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 6,
    isActiveByDefault: true,
  },
  
  // Compliance & Certifications
  {
    name: 'compliance_certs',
    displayName: 'Compliance & Certifications',
    description: 'Industry standards, certifications, and regulatory compliance',
    icon: 'check-circle',
    color: '#84CC16',
    importance: 'STANDARD' as SpecImportance,
    unitSystem: null,
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 7,
    isActiveByDefault: true,
  },
  
  // Package Information
  {
    name: 'package_info',
    displayName: 'Package Information',
    description: 'Packaging details, quantities, and shipping specifications',
    icon: 'cube',
    color: '#6B7280',
    importance: 'STANDARD' as SpecImportance,
    unitSystem: 'both',
    applicableTypes: ['fastener', 'cleat', 'hardware', 'door_lock', 'deck_hardware'],
    displayOrder: 8,
    isActiveByDefault: false,
  },
  
  // Maintenance & Service
  {
    name: 'maintenance_service',
    displayName: 'Maintenance & Service',
    description: 'Maintenance requirements, service intervals, and lifecycle information',
    icon: 'refresh',
    color: '#6366F1',
    importance: 'AUXILIARY' as SpecImportance,
    unitSystem: null,
    applicableTypes: ['door_lock', 'powered_hardware'],
    displayOrder: 9,
    isActiveByDefault: false,
  },
];

const standardUnits = [
  // Length units
  { unit: 'mm', unitType: 'length', systemType: 'metric', displayName: 'Millimeters', symbol: 'mm', isBase: true },
  { unit: 'cm', unitType: 'length', systemType: 'metric', displayName: 'Centimeters', symbol: 'cm', baseUnit: 'mm' },
  { unit: 'm', unitType: 'length', systemType: 'metric', displayName: 'Meters', symbol: 'm', baseUnit: 'mm' },
  { unit: 'inch', unitType: 'length', systemType: 'imperial', displayName: 'Inches', symbol: 'in', isBase: true },
  { unit: 'ft', unitType: 'length', systemType: 'imperial', displayName: 'Feet', symbol: 'ft', baseUnit: 'inch' },
  
  // Weight units
  { unit: 'g', unitType: 'weight', systemType: 'metric', displayName: 'Grams', symbol: 'g', isBase: true },
  { unit: 'kg', unitType: 'weight', systemType: 'metric', displayName: 'Kilograms', symbol: 'kg', baseUnit: 'g' },
  { unit: 'oz', unitType: 'weight', systemType: 'imperial', displayName: 'Ounces', symbol: 'oz', isBase: true },
  { unit: 'lb', unitType: 'weight', systemType: 'imperial', displayName: 'Pounds', symbol: 'lb', baseUnit: 'oz' },
  
  // Force units
  { unit: 'N', unitType: 'force', systemType: 'metric', displayName: 'Newtons', symbol: 'N', isBase: true },
  { unit: 'kN', unitType: 'force', systemType: 'metric', displayName: 'Kilonewtons', symbol: 'kN', baseUnit: 'N' },
  { unit: 'lbf', unitType: 'force', systemType: 'imperial', displayName: 'Pounds Force', symbol: 'lbf', isBase: true },
  
  // Electrical units
  { unit: 'V', unitType: 'voltage', systemType: 'metric', displayName: 'Volts', symbol: 'V', isBase: true },
  { unit: 'A', unitType: 'current', systemType: 'metric', displayName: 'Amperes', symbol: 'A', isBase: true },
  { unit: 'mA', unitType: 'current', systemType: 'metric', displayName: 'Milliamperes', symbol: 'mA', baseUnit: 'A' },
  { unit: 'W', unitType: 'power', systemType: 'metric', displayName: 'Watts', symbol: 'W', isBase: true },
  
  // Pressure units
  { unit: 'Pa', unitType: 'pressure', systemType: 'metric', displayName: 'Pascals', symbol: 'Pa', isBase: true },
  { unit: 'MPa', unitType: 'pressure', systemType: 'metric', displayName: 'Megapascals', symbol: 'MPa', baseUnit: 'Pa' },
  { unit: 'psi', unitType: 'pressure', systemType: 'imperial', displayName: 'Pounds per Square Inch', symbol: 'psi', isBase: true },
  
  // Temperature units
  { unit: 'C', unitType: 'temperature', systemType: 'metric', displayName: 'Celsius', symbol: '°C', isBase: true },
  { unit: 'F', unitType: 'temperature', systemType: 'imperial', displayName: 'Fahrenheit', symbol: '°F', isBase: true },
];

const specificationTemplates = [
  {
    name: 'Marine Fastener',
    description: 'Standard specification template for marine fasteners',
    productTypes: ['fastener', 'bolt', 'screw', 'nut'],
    categories: [
      { categoryName: 'physical_dimensions', requiredSpecs: ['length', 'diameter', 'thread_pitch', 'head_type'] },
      { categoryName: 'material_properties', requiredSpecs: ['material', 'finish', 'coating'] },
      { categoryName: 'performance_specs', requiredSpecs: ['tensile_strength', 'working_load'] },
      { categoryName: 'environmental_ratings', requiredSpecs: ['corrosion_resistance', 'marine_grade'] },
    ],
    isActive: true,
  },
  
  {
    name: 'Cleat Hardware',
    description: 'Standard specification template for cleat hardware',
    productTypes: ['cleat', 'deck_hardware'],
    categories: [
      { categoryName: 'physical_dimensions', requiredSpecs: ['length', 'width', 'height', 'base_dimensions'] },
      { categoryName: 'material_properties', requiredSpecs: ['material', 'finish', 'construction'] },
      { categoryName: 'performance_specs', requiredSpecs: ['working_load', 'breaking_strength'] },
      { categoryName: 'installation_specs', requiredSpecs: ['mounting_pattern', 'fastener_requirements'] },
      { categoryName: 'environmental_ratings', requiredSpecs: ['marine_grade', 'uv_resistance'] },
    ],
    isActive: true,
  },
  
  {
    name: 'Door Lock System',
    description: 'Standard specification template for door lock systems',
    productTypes: ['door_lock', 'locking_hardware'],
    categories: [
      { categoryName: 'physical_dimensions', requiredSpecs: ['length', 'width', 'thickness', 'door_thickness_range'] },
      { categoryName: 'material_properties', requiredSpecs: ['material', 'finish', 'lock_mechanism'] },
      { categoryName: 'performance_specs', requiredSpecs: ['locking_force', 'operation_cycles'] },
      { categoryName: 'electrical_specs', requiredSpecs: ['voltage', 'current_draw', 'power_consumption'] },
      { categoryName: 'installation_specs', requiredSpecs: ['cutout_requirements', 'mounting_hardware'] },
      { categoryName: 'environmental_ratings', requiredSpecs: ['ip_rating', 'operating_temperature'] },
    ],
    isActive: true,
  },
];

async function seedSpecificationData() {
  console.log('🌱 Seeding specification categories and supporting data...');
  
  try {
    // Clear existing data
    console.log('📝 Clearing existing specification data...');
    await prisma.specificationTemplate.deleteMany();
    await prisma.standardUnit.deleteMany();
    await prisma.specificationCategory.deleteMany();
    
    // Create specification categories
    console.log('📂 Creating specification categories...');
    const createdCategories = [];
    for (const category of marineHardwareCategories) {
      const created = await prisma.specificationCategory.create({
        data: category,
      });
      createdCategories.push(created);
      console.log(`  ✓ Created category: ${created.displayName}`);
    }
    
    // Create standard units
    console.log('📏 Creating standard units...');
    for (const unit of standardUnits) {
      await prisma.standardUnit.create({ data: unit });
      console.log(`  ✓ Created unit: ${unit.displayName} (${unit.symbol})`);
    }
    
    // Create specification templates
    console.log('📋 Creating specification templates...');
    for (const template of specificationTemplates) {
      await prisma.specificationTemplate.create({
        data: {
          ...template,
          categories: template.categories,
        },
      });
      console.log(`  ✓ Created template: ${template.name}`);
    }
    
    console.log('✅ Specification seeding completed successfully!');
    console.log(`   - ${createdCategories.length} categories created`);
    console.log(`   - ${standardUnits.length} standard units created`);
    console.log(`   - ${specificationTemplates.length} templates created`);
    
    return {
      categories: createdCategories.length,
      units: standardUnits.length,
      templates: specificationTemplates.length,
    };
    
  } catch (error) {
    console.error('❌ Error seeding specification data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSpecificationData()
    .then((result) => {
      console.log('🎉 Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedSpecificationData };