'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

import type { 
  SpecificationSearchProps, 
  SpecificationFilters,
  SpecImportance,
  SpecDataType 
} from './types';

/**
 * Advanced search interface with filters for technical specifications
 * Part of Task 10 - Technical Specifications Display System
 */
export function SpecificationSearch({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  availableCategories = [],
  totalSpecs,
  filteredSpecs,
  placeholder = "Search specifications...",
  className = ''
}: SpecificationSearchProps) {
  
  const [showFilters, setShowFilters] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    onSearchChange(value);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SpecificationFilters>) => {
    onFiltersChange({
      ...filters,
      ...newFilters
    });
  };

  // Toggle category filter
  const toggleCategoryFilter = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    handleFilterChange({ categories: newCategories });
  };

  // Toggle importance filter
  const toggleImportanceFilter = (importance: SpecImportance) => {
    const newImportance = filters.importance.includes(importance)
      ? filters.importance.filter(imp => imp !== importance)
      : [...filters.importance, importance];
    
    handleFilterChange({ importance: newImportance });
  };

  // Toggle data type filter
  const toggleDataTypeFilter = (dataType: SpecDataType) => {
    const newDataTypes = filters.dataTypes.includes(dataType)
      ? filters.dataTypes.filter(type => type !== dataType)
      : [...filters.dataTypes, dataType];
    
    handleFilterChange({ dataTypes: newDataTypes });
  };

  // Clear all filters
  const clearAllFilters = () => {
    handleFilterChange({
      categories: [],
      importance: [],
      dataTypes: [],
      validated: null,
      hasNumericValue: null,
      unitTypes: []
    });
    handleSearchChange('');
  };

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.importance.length > 0 ||
      filters.dataTypes.length > 0 ||
      filters.validated !== null ||
      filters.hasNumericValue !== null ||
      filters.unitTypes.length > 0 ||
      searchTerm.length > 0
    );
  }, [filters, searchTerm]);

  // Focus search input on Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`specification-search ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setFocusedInput(true)}
            onBlur={() => setFocusedInput(false)}
            placeholder={placeholder}
            className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              focusedInput ? 'border-blue-300' : 'border-gray-300'
            }`}
          />
          
          {/* Clear Search */}
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}

          {/* Keyboard Shortcut Hint */}
          {!focusedInput && !searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 rounded border">⌘</kbd>
                <kbd className="px-2 py-1 bg-gray-100 rounded border">K</kbd>
              </div>
            </div>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-lg border transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          title="Toggle filters"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>

        {/* Results Count */}
        <div className="hidden sm:block text-sm text-gray-600 min-w-max">
          <span className="font-medium">{filteredSpecs.toLocaleString()}</span>
          <span className="text-gray-400"> of {totalSpecs.toLocaleString()}</span>
        </div>
      </div>

      {/* Active Filters Bar */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center space-x-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {/* Search Term Badge */}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-2 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Category Badges */}
              {filters.categories.map(categoryId => {
                const category = availableCategories.find(cat => cat.id === categoryId);
                return (
                  <span key={categoryId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {category?.displayName || categoryId}
                    <button
                      onClick={() => toggleCategoryFilter(categoryId)}
                      className="ml-2 hover:text-green-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}

              {/* Importance Badges */}
              {filters.importance.map(importance => (
                <span key={importance} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {importance.toLowerCase()}
                  <button
                    onClick={() => toggleImportanceFilter(importance)}
                    className="ml-2 hover:text-amber-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {/* Clear All Button */}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
              >
                Clear all
                <XMarkIcon className="ml-1 h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Categories Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Categories
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableCategories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category.id)}
                          onChange={() => toggleCategoryFilter(category.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.displayName || category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Importance Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Importance</h4>
                  <div className="space-y-2">
                    {(['CRITICAL', 'IMPORTANT', 'STANDARD', 'AUXILIARY'] as SpecImportance[]).map(importance => (
                      <label key={importance} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.importance.includes(importance)}
                          onChange={() => toggleImportanceFilter(importance)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {importance.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Type Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Data Type</h4>
                  <div className="space-y-2">
                    {(['TEXT', 'NUMERIC', 'RANGE', 'BOOLEAN', 'ENUM', 'URL', 'FILE'] as SpecDataType[]).map(dataType => (
                      <label key={dataType} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.dataTypes.includes(dataType)}
                          onChange={() => toggleDataTypeFilter(dataType)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {dataType.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Additional</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.validated === true}
                        onChange={(e) => handleFilterChange({ 
                          validated: e.target.checked ? true : null 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Validated only</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasNumericValue === true}
                        onChange={(e) => handleFilterChange({ 
                          hasNumericValue: e.target.checked ? true : null 
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has numeric value</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {filteredSpecs.toLocaleString()} of {totalSpecs.toLocaleString()} specifications
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}