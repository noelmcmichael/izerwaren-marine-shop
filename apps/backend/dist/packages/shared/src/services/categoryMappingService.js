"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryMappingService = exports.CategoryMappingService = void 0;
const categoryMappings_1 = require("../constants/categoryMappings");
/**
 * Service for mapping between database categories and owner's intended categories
 * Provides a centralized way to handle category transformations without database changes
 */
class CategoryMappingService {
    constructor() {
        this.mappings = categoryMappings_1.CATEGORY_MAPPINGS;
    }
    /**
     * Get all owner categories that have been mapped to database categories
     */
    getMappedOwnerCategories() {
        return (0, categoryMappings_1.getMappedOwnerCategories)();
    }
    /**
     * Get all owner categories (including unmapped ones)
     */
    getAllOwnerCategories() {
        return categoryMappings_1.ALL_OWNER_CATEGORIES;
    }
    /**
     * Get database categories that map to a given owner category
     */
    getDbCategoriesForOwner(ownerCategory) {
        return (0, categoryMappings_1.getDbCategoriesForOwner)(ownerCategory);
    }
    /**
     * Map a database category to its corresponding owner category
     */
    mapDbCategoryToOwner(dbCategory) {
        return (0, categoryMappings_1.mapDbCategoryToOwner)(dbCategory);
    }
    /**
     * Get expected product count for an owner category
     */
    getProductCountForOwnerCategory(ownerCategory) {
        return (0, categoryMappings_1.getProductCountForOwnerCategory)(ownerCategory);
    }
    /**
     * Get owner category details including mapped db categories and product count
     */
    getOwnerCategoryDetails(ownerCategory) {
        const mapping = this.mappings.find(m => m.ownerCategory === ownerCategory);
        if (!mapping)
            return null;
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
    getAllMappedCategoryDetails() {
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
    isCategoryMapped(ownerCategory) {
        return this.mappings.some(m => m.ownerCategory === ownerCategory);
    }
    /**
     * Generate SQL WHERE clause for filtering by owner category
     */
    generateOwnerCategoryFilter(ownerCategory) {
        const dbCategories = this.getDbCategoriesForOwner(ownerCategory);
        if (dbCategories.length === 0)
            return '';
        const quotedCategories = dbCategories.map(cat => `'${cat.replace(/'/g, "''")}'`);
        return `category_name IN (${quotedCategories.join(', ')})`;
    }
    /**
     * Get summary statistics for mapped categories
     */
    getMappingSummary() {
        const totalMappedCategories = this.mappings.length;
        const totalMappedProducts = this.mappings.reduce((sum, m) => sum + m.productCount, 0);
        const mappingCoverage = (totalMappedCategories / categoryMappings_1.ALL_OWNER_CATEGORIES.length) * 100;
        const averageProductsPerCategory = Math.round(totalMappedProducts / totalMappedCategories);
        return {
            totalMappedCategories,
            totalMappedProducts,
            mappingCoverage: Math.round(mappingCoverage * 100) / 100,
            averageProductsPerCategory,
        };
    }
}
exports.CategoryMappingService = CategoryMappingService;
// Export singleton instance
exports.categoryMappingService = new CategoryMappingService();
