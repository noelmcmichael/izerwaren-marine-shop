import { useState, useEffect, useMemo } from 'react';
import type { 
  EnhancedTechnicalSpecification, 
  SpecificationCategory, 
  SpecificationFilters,
  SpecificationGrouping,
  SpecificationQuery,
  SpecificationResponse
} from '../types';

/**
 * Custom hook for managing technical specifications
 * Provides grouped and categorized specifications with filtering and search
 */
export function useSpecifications(productId: string, initialFilters?: Partial<SpecificationFilters>) {
  const [specifications, setSpecifications] = useState<EnhancedTechnicalSpecification[]>([]);
  const [categories, setCategories] = useState<SpecificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SpecificationFilters>({
    categories: [],
    importance: [],
    dataTypes: [],
    validated: null,
    hasNumericValue: null,
    unitTypes: [],
    ...initialFilters
  });

  // Fetch specifications from API
  const fetchSpecifications = async (query: SpecificationQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        productId: query.productId,
        ...(query.categoryIds?.length && { 
          categoryIds: query.categoryIds.join(',') 
        }),
        ...(query.importance?.length && { 
          importance: query.importance.join(',') 
        }),
        ...(query.searchTerm && { searchTerm: query.searchTerm }),
        ...(query.includeAuxiliary !== undefined && { 
          includeAuxiliary: query.includeAuxiliary.toString() 
        }),
        ...(query.unitSystem && { unitSystem: query.unitSystem })
      });

      const response = await fetch(`/api/specifications?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch specifications: ${response.statusText}`);
      }

      const data: SpecificationResponse = await response.json();
      
      setSpecifications(data.specifications);
      setCategories(data.categories);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch specifications');
      setSpecifications([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount and when productId changes
  useEffect(() => {
    if (productId) {
      fetchSpecifications({ productId });
    }
  }, [productId]);

  // Filter specifications based on current filters and search
  const filteredSpecifications = useMemo(() => {
    let filtered = specifications;

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(spec =>
        spec.name.toLowerCase().includes(lowerSearchTerm) ||
        spec.value.toLowerCase().includes(lowerSearchTerm) ||
        (spec.unit && spec.unit.toLowerCase().includes(lowerSearchTerm)) ||
        (spec.category?.displayName.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(spec =>
        spec.categoryId && filters.categories.includes(spec.categoryId)
      );
    }

    // Importance filter
    if (filters.importance.length > 0) {
      filtered = filtered.filter(spec =>
        filters.importance.includes(spec.importance)
      );
    }

    // Data type filter
    if (filters.dataTypes.length > 0) {
      filtered = filtered.filter(spec =>
        filters.dataTypes.includes(spec.dataType)
      );
    }

    // Validation filter
    if (filters.validated !== null) {
      filtered = filtered.filter(spec =>
        spec.isValidated === filters.validated
      );
    }

    // Numeric value filter
    if (filters.hasNumericValue !== null) {
      filtered = filtered.filter(spec =>
        filters.hasNumericValue 
          ? spec.numericValue !== null || spec.numericMin !== null 
          : spec.numericValue === null && spec.numericMin === null
      );
    }

    // Unit type filter (based on unit field)
    if (filters.unitTypes.length > 0) {
      filtered = filtered.filter(spec =>
        spec.unit && filters.unitTypes.some(unitType =>
          spec.unit?.toLowerCase().includes(unitType.toLowerCase())
        )
      );
    }

    return filtered;
  }, [specifications, searchTerm, filters]);

  // Group specifications by category
  const groupedSpecifications = useMemo((): SpecificationGrouping => {
    const grouped: SpecificationGrouping = {};

    filteredSpecifications.forEach(spec => {
      const categoryId = spec.categoryId || 'uncategorized';
      
      if (!grouped[categoryId]) {
        const category = categories.find(cat => cat.id === categoryId) || {
          id: categoryId,
          name: 'uncategorized',
          displayName: 'Uncategorized',
          displayOrder: 999,
          isCollapsible: true,
          isActiveByDefault: true,
          importance: 'STANDARD' as const,
          applicableTypes: []
        };
        
        grouped[categoryId] = {
          category,
          specifications: [],
          count: 0
        };
      }
      
      grouped[categoryId].specifications.push(spec);
      grouped[categoryId].count++;
    });

    // Sort specifications within each category by display order and importance
    Object.values(grouped).forEach(group => {
      group.specifications.sort((a, b) => {
        // First by importance (CRITICAL > IMPORTANT > STANDARD > AUXILIARY)
        const importanceOrder = { CRITICAL: 0, IMPORTANT: 1, STANDARD: 2, AUXILIARY: 3 };
        const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
        if (importanceDiff !== 0) return importanceDiff;
        
        // Then by display order
        const orderDiff = a.displayOrder - b.displayOrder;
        if (orderDiff !== 0) return orderDiff;
        
        // Finally by name
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [filteredSpecifications, categories]);

  // Get category hierarchy (categories sorted by display order)
  const sortedCategories = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter(category => {
        // Only show categories that have specifications or are parent categories
        const hasSpecs = filteredSpecifications.some(spec => spec.categoryId === category.id);
        const hasChildren = categories.some(cat => cat.parentId === category.id);
        return hasSpecs || hasChildren;
      });
  }, [categories, filteredSpecifications]);

  // Update filters
  const updateFilters = (newFilters: Partial<SpecificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      categories: [],
      importance: [],
      dataTypes: [],
      validated: null,
      hasNumericValue: null,
      unitTypes: []
    });
    setSearchTerm('');
  };

  // Refresh specifications
  const refresh = () => {
    if (productId) {
      fetchSpecifications({ 
        productId,
        searchTerm: searchTerm || undefined,
        categoryIds: filters.categories.length > 0 ? filters.categories : undefined,
        importance: filters.importance.length > 0 ? filters.importance : undefined
      });
    }
  };

  return {
    // Data
    specifications: filteredSpecifications,
    categories: sortedCategories,
    groupedSpecifications,
    
    // State
    loading,
    error,
    searchTerm,
    filters,
    
    // Computed values
    totalCount: specifications.length,
    filteredCount: filteredSpecifications.length,
    categoryCount: Object.keys(groupedSpecifications).length,
    
    // Actions
    setSearchTerm,
    updateFilters,
    clearFilters,
    refresh,
    
    // Utils
    hasActiveFilters: searchTerm !== '' || 
      filters.categories.length > 0 || 
      filters.importance.length > 0 || 
      filters.dataTypes.length > 0 ||
      filters.validated !== null ||
      filters.hasNumericValue !== null ||
      filters.unitTypes.length > 0
  };
}

export default useSpecifications;