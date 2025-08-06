import {
  CATEGORY_MAPPINGS,
  getMappedOwnerCategories,
  getDbCategoriesForOwner,
  mapDbCategoryToOwner,
  getProductCountForOwnerCategory,
  ALL_OWNER_CATEGORIES,
} from '../constants/categoryMappings';
import { CategoryMapping, OwnerCategory, OwnerCategoryName } from '../types/Category';

/**
 * Service for mapping between database categories and owner's intended categories
 * Provides a centralized way to handle category transformations without database changes
 */
export class CategoryMappingService {
  private mappings: CategoryMapping[] = CATEGORY_MAPPINGS;

  /**
   * Get all owner categories that have been mapped to database categories
   */
  getMappedOwnerCategories(): OwnerCategoryName[] {
    return getMappedOwnerCategories();
  }

  /**
   * Get all owner categories (including unmapped ones)
   */
  getAllOwnerCategories(): OwnerCategoryName[] {
    return ALL_OWNER_CATEGORIES;
  }

  /**
   * Get database categories that map to a given owner category
   */
  getDbCategoriesForOwner(ownerCategory: string): string[] {
    return getDbCategoriesForOwner(ownerCategory);
  }

  /**
   * Map a database category to its corresponding owner category
   */
  mapDbCategoryToOwner(dbCategory: string): string | null {
    return mapDbCategoryToOwner(dbCategory);
  }

  /**
   * Get expected product count for an owner category
   */
  getProductCountForOwnerCategory(ownerCategory: string): number {
    return getProductCountForOwnerCategory(ownerCategory);
  }

  /**
   * Get owner category details including mapped db categories and product count
   */
  getOwnerCategoryDetails(ownerCategory: string): OwnerCategory | null {
    const mapping = this.mappings.find(m => m.ownerCategory === ownerCategory);
    if (!mapping) return null;

    return {
      name: mapping.ownerCategory,
      productCount: mapping.productCount,
      dbCategories: mapping.dbCategories,
      description: mapping.description,
    };
  }

  /**
   * Get all mapped owner categories with their details
   */
  getAllMappedCategoryDetails(): OwnerCategory[] {
    return this.mappings.map(mapping => ({
      name: mapping.ownerCategory,
      productCount: mapping.productCount,
      dbCategories: mapping.dbCategories,
      description: mapping.description,
    }));
  }

  /**
   * Check if an owner category has been mapped
   */
  isCategoryMapped(ownerCategory: string): boolean {
    return this.mappings.some(m => m.ownerCategory === ownerCategory);
  }

  /**
   * Generate SQL WHERE clause for filtering by owner category
   */
  generateOwnerCategoryFilter(ownerCategory: string): string {
    const dbCategories = this.getDbCategoriesForOwner(ownerCategory);
    if (dbCategories.length === 0) return '';

    const quotedCategories = dbCategories.map(cat => `'${cat.replace(/'/g, "''")}'`);
    return `category_name IN (${quotedCategories.join(', ')})`;
  }

  /**
   * Get summary statistics for mapped categories
   */
  getMappingSummary(): {
    totalMappedCategories: number;
    totalMappedProducts: number;
    mappingCoverage: number; // percentage of owner categories mapped
    averageProductsPerCategory: number;
  } {
    const totalMappedCategories = this.mappings.length;
    const totalMappedProducts = this.mappings.reduce((sum, m) => sum + m.productCount, 0);
    const mappingCoverage = (totalMappedCategories / ALL_OWNER_CATEGORIES.length) * 100;
    const averageProductsPerCategory = Math.round(
      totalMappedProducts / totalMappedCategories
    );

    return {
      totalMappedCategories,
      totalMappedProducts,
      mappingCoverage: Math.round(mappingCoverage * 100) / 100,
      averageProductsPerCategory,
    };
  }
}

// Export singleton instance
export const categoryMappingService = new CategoryMappingService();
