'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Filter, DollarSign, Package, Settings, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '../../../lib/config';

interface Category {
  name: string;
  productCount: number;
  description?: string;
  dbCategories: string[];
}

interface FilterOptions {
  technicalSpecs: Record<string, { name: string; values: string[]; unit: string | null }>;
  priceRange: { min: number; max: number };
  availability: string[];
  materials: string[];
  brands: string[];
  categories: Category[];
}

interface FilterState {
  categories: string[];
  subCategories: string[];
  minPrice?: number;
  maxPrice?: number;
  availability: string[];
  materials: string[];
  brands: string[];
  technicalSpecs: Record<string, string[]>;
  hasVariants?: boolean;
  hasPdf?: boolean;
}

interface FilterSidebarProps {
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  onCategoryChange: (categoryName: string | null) => void;
  onSubCategoryChange: (subCategoryName: string | null) => void;
  onFiltersChange?: (filters: FilterState) => void;
  className?: string;
}

export function FilterSidebar({
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  onFiltersChange,
  className = '',
}: FilterSidebarProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    priceRange: false,
    availability: false,
    materials: false,
    brands: false,
    technicalSpecs: false,
    features: false,
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subCategories: [],
    availability: [],
    materials: [],
    brands: [],
    technicalSpecs: {},
  });

  const t = useTranslations('catalog');
  const tFilters = useTranslations('catalog.filters');

  // Fetch filter options from the new API endpoint
  const fetchFilterOptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = config.api.baseUrl === '/api' ? '/api/products/filter-options' : `${config.api.baseUrl}/products/filter-options`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }

      const result = await response.json();
      setFilterOptions(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
      console.error('Error fetching filter options:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleClearFilters = () => {
    onCategoryChange(null);
    onSubCategoryChange(null);
    setFilters({
      categories: [],
      subCategories: [],
      availability: [],
      materials: [],
      brands: [],
      technicalSpecs: {},
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleMultiSelectChange = (filterType: 'availability' | 'materials' | 'brands', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value],
    }));
  };

  const handleTechnicalSpecChange = (category: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      technicalSpecs: {
        ...prev.technicalSpecs,
        [category]: prev.technicalSpecs[category]?.includes(value)
          ? prev.technicalSpecs[category].filter(item => item !== value)
          : [...(prev.technicalSpecs[category] || []), value],
      },
    }));
  };

  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === selectedCategory) {
      onCategoryChange(null);
      onSubCategoryChange(null);
    } else {
      onCategoryChange(categoryName);
      onSubCategoryChange(null);
    }
  };

  const handleSubCategorySelect = (subCategoryName: string) => {
    if (subCategoryName === selectedSubCategory) {
      onSubCategoryChange(null);
    } else {
      onSubCategoryChange(subCategoryName);
    }
  };

  const hasActiveFilters = selectedCategory || selectedSubCategory || 
    filters.availability.length > 0 || filters.materials.length > 0 || 
    filters.brands.length > 0 || Object.keys(filters.technicalSpecs).length > 0 ||
    filters.minPrice !== undefined || filters.maxPrice !== undefined ||
    filters.hasVariants !== undefined || filters.hasPdf !== undefined;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          {tFilters('filterResults')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            {t('clearFilters')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchFilterOptions}
            className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
          >
            {t('retry')}
          </button>
        </div>
      ) : filterOptions ? (
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <button
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                {tFilters('categories')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.categories ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.categories && (
              <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                {filterOptions.categories.map((category) => (
                  <div key={category.name}>
                    <button
                      onClick={() => handleCategorySelect(category.name)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{category.name}</span>
                          <span className="text-xs text-gray-500">{category.productCount} products</span>
                        </div>
                        {category.dbCategories.length > 0 && (
                          <ChevronDown 
                            className={`h-4 w-4 text-gray-400 transform transition-transform ${
                              selectedCategory === category.name ? 'rotate-180' : ''
                            }`} 
                          />
                        )}
                      </div>
                    </button>

                    {selectedCategory === category.name && category.dbCategories.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.dbCategories.map((subCategory) => (
                          <button
                            key={subCategory}
                            onClick={() => handleSubCategorySelect(subCategory)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                              selectedSubCategory === subCategory
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center">
                              <ChevronRight className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="truncate">{subCategory}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <button
              onClick={() => toggleSection('priceRange')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                {tFilters('priceRange')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.priceRange ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.priceRange && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{tFilters('minPrice')}</label>
                    <input
                      type="number"
                      min={filterOptions.priceRange.min}
                      max={filterOptions.priceRange.max}
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value) || undefined)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`${filterOptions.priceRange.min}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{tFilters('maxPrice')}</label>
                    <input
                      type="number"
                      min={filterOptions.priceRange.min}
                      max={filterOptions.priceRange.max}
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value) || undefined)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`${filterOptions.priceRange.max}`}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {tFilters('from')} ${filterOptions.priceRange.min} {tFilters('to')} ${filterOptions.priceRange.max}
                </div>
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <button
              onClick={() => toggleSection('availability')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                {tFilters('availability')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.availability ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.availability && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.availability.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(option)}
                      onChange={() => handleMultiSelectChange('availability', option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Materials */}
          <div>
            <button
              onClick={() => toggleSection('materials')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                {tFilters('materials')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.materials ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.materials && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.materials.map((material) => (
                  <label key={material} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.materials.includes(material)}
                      onChange={() => handleMultiSelectChange('materials', material)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{material}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Brands */}
          <div>
            <button
              onClick={() => toggleSection('brands')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                {tFilters('brands')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.brands ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.brands && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.brands.map((brand) => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleMultiSelectChange('brands', brand)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div>
            <button
              onClick={() => toggleSection('technicalSpecs')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                {tFilters('technicalSpecs')}
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.technicalSpecs ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.technicalSpecs && (
              <div className="mt-3 space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(filterOptions.technicalSpecs).map(([category, spec]) => (
                  <div key={category}>
                    <h5 className="text-xs font-medium text-gray-900 mb-2">
                      {spec.name} {spec.unit && `(${spec.unit})`}
                    </h5>
                    <div className="space-y-1">
                      {spec.values.slice(0, 5).map((value) => (
                        <label key={value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.technicalSpecs[category]?.includes(value) || false}
                            onChange={() => handleTechnicalSpecChange(category, value)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-xs text-gray-700">{value}</span>
                        </label>
                      ))}
                      {spec.values.length > 5 && (
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          +{spec.values.length - 5} more
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Features */}
          <div>
            <button
              onClick={() => toggleSection('features')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Features
              </h4>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transform transition-transform ${
                  expandedSections.features ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections.features && (
              <div className="mt-3 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasVariants === true}
                    onChange={(e) => handleFilterChange('hasVariants', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tFilters('hasVariants')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPdf === true}
                    onChange={(e) => handleFilterChange('hasPdf', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tFilters('hasPdf')}</span>
                </label>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-2">{tFilters('activeFilters')}</h5>
              <div className="flex flex-wrap gap-1">
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {selectedCategory}
                    <button
                      onClick={() => onCategoryChange(null)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {/* Add more active filter chips as needed */}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}