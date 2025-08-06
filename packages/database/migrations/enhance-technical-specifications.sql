-- Migration: Enhance Technical Specifications Schema
-- Task 10: Technical Specifications Display
-- Date: 2025-01-30

-- Create enum types for enhanced specification system
CREATE TYPE "SpecImportance" AS ENUM ('CRITICAL', 'IMPORTANT', 'STANDARD', 'AUXILIARY');
CREATE TYPE "SpecDataType" AS ENUM ('TEXT', 'NUMERIC', 'RANGE', 'BOOLEAN', 'ENUM', 'URL', 'FILE');
CREATE TYPE "SpecChangeType" AS ENUM ('CREATED', 'VALUE_UPDATED', 'UNIT_CHANGED', 'CATEGORY_MOVED', 'METADATA_UPDATED', 'DELETED', 'VALIDATED');

-- Create specification categories table
CREATE TABLE IF NOT EXISTS "specification_categories" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "is_collapsible" BOOLEAN NOT NULL DEFAULT true,
    "is_active_by_default" BOOLEAN NOT NULL DEFAULT true,
    "importance" "SpecImportance" NOT NULL DEFAULT 'STANDARD',
    "unit_system" TEXT,
    "applicable_types" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for category hierarchy
ALTER TABLE "specification_categories" 
ADD CONSTRAINT "specification_categories_parent_id_fkey" 
FOREIGN KEY ("parent_id") REFERENCES "specification_categories"("id") ON DELETE SET NULL;

-- Create indexes for specification categories
CREATE INDEX "idx_spec_categories_hierarchy" ON "specification_categories"("parent_id", "display_order") WHERE "parent_id" IS NOT NULL;
CREATE INDEX "idx_spec_categories_applicable_types" ON "specification_categories" USING GIN("applicable_types");

-- Backup existing technical specifications
CREATE TABLE IF NOT EXISTS "technical_specifications_backup" AS 
SELECT * FROM "technical_specifications";

-- Add new columns to technical_specifications table
ALTER TABLE "technical_specifications" 
ADD COLUMN IF NOT EXISTS "category_id" TEXT,
ADD COLUMN IF NOT EXISTS "data_type" "SpecDataType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN IF NOT EXISTS "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "importance" "SpecImportance" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_comparable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "numeric_value" DECIMAL(15,4),
ADD COLUMN IF NOT EXISTS "numeric_min" DECIMAL(15,4),
ADD COLUMN IF NOT EXISTS "numeric_max" DECIMAL(15,4),
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "change_reason" TEXT,
ADD COLUMN IF NOT EXISTS "source_system" TEXT,
ADD COLUMN IF NOT EXISTS "is_validated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "validated_by" TEXT,
ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for category
ALTER TABLE "technical_specifications" 
ADD CONSTRAINT "technical_specifications_category_id_fkey" 
FOREIGN KEY ("category_id") REFERENCES "specification_categories"("id") ON DELETE SET NULL;

-- Create specification unit conversions table
CREATE TABLE IF NOT EXISTS "specification_unit_conversions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "specification_id" TEXT NOT NULL,
    "from_unit" TEXT NOT NULL,
    "to_unit" TEXT NOT NULL,
    "conversion_factor" DECIMAL(20,10) NOT NULL,
    "conversion_offset" DECIMAL(20,10) NOT NULL DEFAULT 0,
    "display_format" TEXT,
    CONSTRAINT "specification_unit_conversions_specification_id_fkey" 
        FOREIGN KEY ("specification_id") REFERENCES "technical_specifications"("id") ON DELETE CASCADE
);

-- Create unique constraint for unit conversions
ALTER TABLE "specification_unit_conversions" 
ADD CONSTRAINT "specification_unit_conversions_specification_id_from_unit_to_unit_key" 
UNIQUE ("specification_id", "from_unit", "to_unit");

-- Create specification change log table
CREATE TABLE IF NOT EXISTS "specification_change_log" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "specification_id" TEXT NOT NULL,
    "change_type" "SpecChangeType" NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT NOT NULL,
    "old_unit" TEXT,
    "new_unit" TEXT,
    "reason" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "specification_change_log_specification_id_fkey" 
        FOREIGN KEY ("specification_id") REFERENCES "technical_specifications"("id") ON DELETE CASCADE
);

-- Create index for change log
CREATE INDEX "idx_spec_change_log_spec_time" ON "specification_change_log"("specification_id", "changed_at");

-- Create standard units table
CREATE TABLE IF NOT EXISTS "standard_units" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "unit" TEXT NOT NULL UNIQUE,
    "unit_type" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "base_unit" TEXT,
    "is_base" BOOLEAN NOT NULL DEFAULT false
);

-- Create index for standard units
CREATE INDEX "idx_standard_units_type_system" ON "standard_units"("unit_type", "system_type");

-- Create specification templates table
CREATE TABLE IF NOT EXISTS "specification_templates" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "product_types" TEXT[],
    "categories" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing unique constraint that conflicts with new schema
ALTER TABLE "technical_specifications" DROP CONSTRAINT IF EXISTS "technical_specifications_productId_category_value_key";

-- Create new optimized indexes for technical specifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tech_specs_product_category_order" 
ON "technical_specifications" ("product_id", "category_id", "display_order");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tech_specs_searchable_name_value" 
ON "technical_specifications" ("is_searchable", "name", "value") 
WHERE "is_searchable" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tech_specs_comparison" 
ON "technical_specifications" ("category_id", "name", "product_id", "is_comparable") 
WHERE "is_comparable" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tech_specs_numeric_range" 
ON "technical_specifications" ("category_id", "name", "numeric_value") 
WHERE "numeric_value" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tech_specs_importance_highlighted" 
ON "technical_specifications" ("importance", "is_highlighted");

-- Create new unique constraint for enhanced schema
ALTER TABLE "technical_specifications" 
ADD CONSTRAINT "technical_specifications_product_id_category_id_name_key" 
UNIQUE ("product_id", "category_id", "name");

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_specification_categories_updated_at 
    BEFORE UPDATE ON "specification_categories"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_specifications_updated_at 
    BEFORE UPDATE ON "technical_specifications"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specification_templates_updated_at 
    BEFORE UPDATE ON "specification_templates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();