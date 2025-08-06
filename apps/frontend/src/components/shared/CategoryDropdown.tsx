'use client';

import { ChevronDown, Package } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { config } from '@/lib/config';

interface Category {
  name: string;
  productCount: number;
  description?: string;
}

interface CategoryDropdownProps {
  selectedCategory: string | null;
  // eslint-disable-next-line no-unused-vars
  onCategoryChange: (categoryName: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showProductCounts?: boolean;
  className?: string;
}

export function CategoryDropdown({
  selectedCategory,
  onCategoryChange,
  placeholder = 'Select a category',
  disabled = false,
  showProductCounts = true,
  className = '',
}: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const handleCategorySelect = (categoryName: string) => {
    const newCategory = categoryName === selectedCategory ? null : categoryName;
    onCategoryChange(newCategory);
    setIsOpen(false);
  };

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  return (
    <div className={`relative ${className}`}>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full flex items-center justify-between px-4 py-2.5 
          border border-gray-300 dark:border-gray-600 rounded-lg
          bg-white dark:bg-gray-700 
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <Package className='w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0' />
          <span className='truncate'>
            {loading
              ? 'Loading categories...'
              : selectedCategoryData
                ? selectedCategoryData.name
                : placeholder}
          </span>
          {selectedCategoryData && showProductCounts && (
            <span className='ml-auto text-sm text-gray-500 dark:text-gray-400 flex-shrink-0'>
              ({selectedCategoryData.productCount})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto'>
          {error ? (
            <div className='px-4 py-3 text-red-600 dark:text-red-400 text-sm'>{error}</div>
          ) : (
            <>
              {/* Clear selection option */}
              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect('')}
                  className='w-full px-4 py-2.5 text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 text-sm'
                >
                  Clear selection
                </button>
              )}

              {/* Category options */}
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`
                    w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-600 
                    transition-colors duration-150
                    ${
                      selectedCategory === category.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }
                  `}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium truncate pr-2'>{category.name}</span>
                    {showProductCounts && (
                      <span className='text-sm text-gray-500 dark:text-gray-400 flex-shrink-0'>
                        {category.productCount}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <div className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate'>
                      {category.description}
                    </div>
                  )}
                </button>
              ))}

              {categories.length === 0 && !loading && (
                <div className='px-4 py-3 text-gray-500 dark:text-gray-400 text-sm'>
                  No categories available
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />}
    </div>
  );
}
