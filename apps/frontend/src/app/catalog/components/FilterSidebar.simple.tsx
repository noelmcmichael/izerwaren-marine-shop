'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Filter, Package, Settings, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { config } from '../../../lib/config';

interface Category {
  name: string;
  productCount: number;
  description?: string;
  dbCategories: string[];
}

interface FilterSidebarProps {
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  onCategoryChange: (_categoryName: string | null) => void;
  onSubCategoryChange: (_subCategoryName: string | null) => void;
  onFiltersChange?: (_filters: any) => void;
  className?: string;
}

export function FilterSidebar({
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  className = '',
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);

  const t = useTranslations('catalog');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = config.api.baseUrl === '/api' ? '/api/products/categories' : `${config.api.baseUrl}/products/categories`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      setCategories(result.data || result.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleClearFilters = () => {
    onCategoryChange(null);
    onSubCategoryChange(null);
    setExpandedCategory(null);
    setAvailability([]);
  };

  const handleAvailabilityChange = (value: string) => {
    setAvailability(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === selectedCategory) {
      onCategoryChange(null);
      onSubCategoryChange(null);
      setExpandedCategory(null);
    } else {
      onCategoryChange(categoryName);
      onSubCategoryChange(null);
      setExpandedCategory(categoryName);
    }
  };

  const handleSubCategorySelect = (subCategoryName: string) => {
    if (subCategoryName === selectedSubCategory) {
      onSubCategoryChange(null);
    } else {
      onSubCategoryChange(subCategoryName);
    }
  };

  const hasActiveFilters = selectedCategory || selectedSubCategory || availability.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          {t('filterBy')}
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

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            {t('category')}
          </h4>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">{t('loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-xs text-red-600">{error}</p>
              <button
                onClick={fetchCategories}
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
              >
                {t('retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {categories.map((category) => (
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
                            expandedCategory === category.name ? 'rotate-180' : ''
                          }`} 
                        />
                      )}
                    </div>
                  </button>

                  {expandedCategory === category.name && category.dbCategories.length > 0 && (
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

        {/* Availability */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            {t('availability')}
          </h4>
          <div className="space-y-2">
            {['In Stock', 'Available to Order', 'Limited Stock'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={availability.includes(option)}
                  onChange={() => handleAvailabilityChange(option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Placeholder for Advanced Features */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Filters
          </h4>
          <div className="text-sm text-gray-500 italic">
            Price range, materials, and technical specifications filters are being implemented...
          </div>
        </div>
      </div>
    </div>
  );
}