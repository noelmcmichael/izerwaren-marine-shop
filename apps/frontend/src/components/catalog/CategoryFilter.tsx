'use client';

import { ChevronDown, Filter, X, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { config } from '@/lib/config';



interface Category {
  name: string;
  productCount: number;
  dbCategories: string[];
  description: string;
}

interface CategoryFilterProps {
  onCategoryChange?: () => void;
  disabled?: boolean;
}

export default function CategoryFilter({
  onCategoryChange,
  disabled = false,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryRef = useRef<HTMLDivElement>(null);

  const selectedCategory = searchParams.get('category');
  const urlSubCategories = searchParams.get('subcategories');

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Initialize selected sub-categories from URL
  useEffect(() => {
    if (urlSubCategories) {
      setSelectedSubCategories(urlSubCategories.split(',').filter(Boolean));
    } else {
      setSelectedSubCategories([]);
    }
  }, [urlSubCategories]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (subCategoryRef.current && !subCategoryRef.current.contains(event.target as Node)) {
        setIsSubCategoryOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = config.api.baseUrl === '/api' ? '/api/products/categories' : `${config.api.baseUrl}/products/categories`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      setCategories(data.categories || data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }

    // Clear sub-categories when changing main category
    params.delete('subcategories');
    setSelectedSubCategories([]);

    // Reset to first page when changing category
    params.delete('page');

    router.push(`/catalog?${params.toString()}`);
    setIsOpen(false);
    setSearchTerm('');

    // Notify parent component
    if (onCategoryChange) {
      onCategoryChange();
    }
  };

  const handleSubCategoryToggle = (subCategory: string) => {
    const newSelected = selectedSubCategories.includes(subCategory)
      ? selectedSubCategories.filter(sc => sc !== subCategory)
      : [...selectedSubCategories, subCategory];

    setSelectedSubCategories(newSelected);
  };

  const applySubCategoryFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSubCategories.length > 0) {
      params.set('subcategories', selectedSubCategories.join(','));
    } else {
      params.delete('subcategories');
    }

    // Reset to first page when changing filters
    params.delete('page');

    router.push(`/catalog?${params.toString()}`);
    setIsSubCategoryOpen(false);

    // Notify parent component
    if (onCategoryChange) {
      onCategoryChange();
    }
  };

  const clearAllSubCategories = () => {
    setSelectedSubCategories([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('subcategories');
    params.delete('page');

    router.push(`/catalog?${params.toString()}`);

    if (onCategoryChange) {
      onCategoryChange();
    }
  };

  const filteredCategories = categories.filter(
    category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className='relative'>
        <div className='flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg animate-pulse'>
          <Filter className='h-4 w-4 text-gray-400' />
          <span className='text-sm text-gray-500'>Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='relative'>
        <div className='flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg'>
          <Filter className='h-4 w-4 text-red-400' />
          <span className='text-sm text-red-600'>Categories unavailable</span>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
  const availableSubCategories = selectedCategoryData?.dbCategories || [];

  return (
    <div className='flex items-center space-x-2'>
      {/* Primary Category Dropdown */}
      <div className='relative' ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center justify-between space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px] ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${selectedCategory ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <div className='flex items-center space-x-2 flex-1 min-w-0'>
            <Filter className='h-4 w-4 text-gray-500 flex-shrink-0' />
            <span className='text-sm font-medium text-gray-700 truncate'>
              {selectedCategoryData ? selectedCategoryData.name : 'All Categories'}
            </span>
            {selectedCategory && (
              <span className='text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full flex-shrink-0'>
                {selectedCategoryData?.productCount || 0}
              </span>
            )}
          </div>
          <div className='flex items-center space-x-1 flex-shrink-0'>
            {selectedCategory && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleCategorySelect(null);
                }}
                className='p-1 hover:bg-gray-200 rounded-full transition-colors'
                title='Clear filter'
              >
                <X className='h-3 w-3 text-gray-400' />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden'>
            {/* Search box */}
            <div className='p-3 border-b border-gray-200'>
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search categories...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                autoFocus
              />
            </div>

            {/* Categories list */}
            <div className='max-h-64 overflow-y-auto'>
              {/* All Categories option */}
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>All Categories</span>
                  <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
                    {categories.reduce((total, cat) => total + cat.productCount, 0)}
                  </span>
                </div>
                <div className='text-xs text-gray-500 mt-1'>Show all products</div>
              </button>

              {/* Variant Products option */}
              <button
                onClick={() => handleCategorySelect('VARIANT_PRODUCTS')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedCategory === 'VARIANT_PRODUCTS'
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>🔧 Variant Products</span>
                  <span className='text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full'>
                    63
                  </span>
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  Products with configuration options (size, handing, thickness, etc.)
                </div>
              </button>

              {/* PDF Products option */}
              <button
                onClick={() => handleCategorySelect('PDF_PRODUCTS')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedCategory === 'PDF_PRODUCTS'
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>📄 PDF Specifications</span>
                  <span className='text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                    377
                  </span>
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  Products with detailed PDF technical specification sheets
                </div>
              </button>

              {/* Filter message */}
              {searchTerm && filteredCategories.length === 0 && (
                <div className='px-4 py-3 text-sm text-gray-500 text-center'>
                  No categories found matching &ldquo;{searchTerm}&rdquo;
                </div>
              )}

              {/* Category options */}
              {filteredCategories.map(category => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedCategory === category.name
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium truncate pr-2'>{category.name}</span>
                    <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0'>
                      {category.productCount}
                    </span>
                  </div>
                  <div
                    className='text-xs text-gray-500 mt-1 line-clamp-2'
                    title={category.description}
                  >
                    {category.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className='px-4 py-2 bg-gray-50 border-t border-gray-200'>
              <div className='text-xs text-gray-500 text-center'>
                {filteredCategories.length} of {categories.length} categories
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Category Dropdown */}
      {selectedCategory && availableSubCategories.length > 0 && (
        <div className='relative' ref={subCategoryRef}>
          <button
            onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
            disabled={disabled}
            className={`flex items-center justify-between space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[180px] ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${selectedSubCategories.length > 0 ? 'bg-green-50 border-green-300' : ''}`}
          >
            <div className='flex items-center space-x-2 flex-1 min-w-0'>
              <span className='text-sm font-medium text-gray-700 truncate'>
                {selectedSubCategories.length === 0
                  ? 'All Sub-categories'
                  : selectedSubCategories.length === 1
                    ? selectedSubCategories[0].split(' ')[0] + '...'
                    : `${selectedSubCategories.length} selected`}
              </span>
              {selectedSubCategories.length > 0 && (
                <span className='text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0'>
                  {selectedSubCategories.length}
                </span>
              )}
            </div>
            <div className='flex items-center space-x-1 flex-shrink-0'>
              {selectedSubCategories.length > 0 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    clearAllSubCategories();
                  }}
                  className='p-1 hover:bg-gray-200 rounded-full transition-colors'
                  title='Clear sub-category filters'
                >
                  <X className='h-3 w-3 text-gray-400' />
                </button>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${isSubCategoryOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {isSubCategoryOpen && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden min-w-[300px]'>
              {/* Header */}
              <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
                <div className='text-sm font-medium text-gray-700'>
                  Sub-categories for {selectedCategory}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  Select multiple options to filter products
                </div>
              </div>

              {/* Sub-categories list */}
              <div className='max-h-48 overflow-y-auto'>
                {availableSubCategories.map((subCategory, index) => {
                  const isSelected = selectedSubCategories.includes(subCategory);
                  const displayName =
                    subCategory.length > 40 ? subCategory.substring(0, 37) + '...' : subCategory;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSubCategoryToggle(subCategory)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        isSelected ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className='h-3 w-3 text-white' />}
                        </div>
                        <span className='text-sm text-gray-700 flex-1' title={subCategory}>
                          {displayName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer with actions */}
              <div className='px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
                <div className='text-xs text-gray-500'>
                  {selectedSubCategories.length} of {availableSubCategories.length} selected
                </div>
                <div className='flex space-x-2'>
                  {selectedSubCategories.length > 0 && (
                    <button
                      onClick={clearAllSubCategories}
                      className='text-xs text-gray-600 hover:text-gray-800 transition-colors'
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={applySubCategoryFilters}
                    className='px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors'
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
