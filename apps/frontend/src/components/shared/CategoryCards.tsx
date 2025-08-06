'use client';

import { Package, ChevronRight, X } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { config } from '@/lib/config';

interface Category {
  name: string;
  productCount: number;
  description?: string;
  dbCategories: string[];
}

interface CategoryCardsProps {
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  // eslint-disable-next-line no-unused-vars
  onCategoryChange: (categoryName: string | null) => void;
  // eslint-disable-next-line no-unused-vars
  onSubCategoryChange: (subCategoryName: string | null) => void;
  showProductCounts?: boolean;
  className?: string;
}

export function CategoryCards({
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  showProductCounts = true,
  className = '',
}: CategoryCardsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = config.api.baseUrl === '/api' ? '/api/v1/products/categories' : `${config.api.baseUrl}/v1/products/categories`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      setCategories(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [config.api.baseUrl]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === selectedCategory) {
      // Clicking the same category - deselect
      onCategoryChange(null);
      onSubCategoryChange(null);
    } else {
      // Select new category
      onCategoryChange(categoryName);
      onSubCategoryChange(null); // Clear sub-category when changing main category
    }
  };

  const handleSubCategorySelect = (subCategoryName: string) => {
    if (subCategoryName === selectedSubCategory) {
      // Clicking the same sub-category - deselect
      onSubCategoryChange(null);
    } else {
      // Select new sub-category
      onSubCategoryChange(subCategoryName);
    }
  };

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className='text-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto'></div>
          <p className='mt-2 text-sm text-gray-500'>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className='text-center py-8'>
          <p className='text-red-600 text-sm'>{error}</p>
          <button
            onClick={fetchCategories}
            className='mt-2 text-blue-600 hover:text-blue-800 underline text-sm'
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Category Selection State */}
      {(selectedCategory || selectedSubCategory) && (
        <div className='mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Package className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              <span className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                Active Filter:
              </span>
              <span className='text-sm text-blue-700 dark:text-blue-300'>
                {selectedCategory}
                {selectedSubCategory && (
                  <>
                    <ChevronRight className='w-3 h-3 inline mx-1' />
                    {selectedSubCategory}
                  </>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                onCategoryChange(null);
                onSubCategoryChange(null);
              }}
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {/* Main Categories Grid */}
      {!selectedCategory && (
        <div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            Marine Hardware Categories
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {categories.map(category => (
              <div
                key={category.name}
                onClick={() => handleCategorySelect(category.name)}
                className='border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-700'
              >
                <div className='flex items-start justify-between mb-2'>
                  <h4 className='font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight'>
                    {category.name}
                  </h4>
                  <ChevronRight className='w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5' />
                </div>

                {category.description && (
                  <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
                    {category.description}
                  </p>
                )}

                <div className='flex items-center justify-between'>
                  {showProductCounts && (
                    <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                      {category.productCount} products
                    </span>
                  )}
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {category.dbCategories.length} sub-categories
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Categories View */}
      {selectedCategory && selectedCategoryData && (
        <div>
          <div className='flex items-center gap-2 mb-4'>
            <button
              onClick={() => handleCategorySelect(selectedCategory)}
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm'
            >
              ← Back to categories
            </button>
          </div>

          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            {selectedCategory}
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
            Select a sub-category to refine your search ({selectedCategoryData.productCount} total
            products)
          </p>

          <div className='space-y-2'>
            {/* All products in category option */}
            <button
              onClick={() => handleSubCategorySelect('')}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                !selectedSubCategory
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='font-medium'>All {selectedCategory}</span>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {selectedCategoryData.productCount} products
                </span>
              </div>
            </button>

            {/* Individual sub-categories */}
            {selectedCategoryData.dbCategories.map((subCategory, index) => (
              <button
                key={index}
                onClick={() => handleSubCategorySelect(subCategory)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedSubCategory === subCategory
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-sm'>{subCategory}</span>
                  <ChevronRight className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className='text-center py-8'>
          <Package className='w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2' />
          <p className='text-gray-500 dark:text-gray-400 text-sm'>No categories available</p>
        </div>
      )}
    </div>
  );
}
