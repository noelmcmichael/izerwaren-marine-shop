'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

import { SpecificationCategory } from './SpecificationCategory';
import { SpecificationSearch } from './SpecificationSearch';
import { SpecificationActions } from './SpecificationActions';
import { useSpecifications } from './hooks/useSpecifications';
import { useSpecificationPreferences } from './hooks/useSpecificationPreferences';
import type { SpecificationDisplayProps } from './types';

/**
 * Main specification display component with categorized, searchable specifications
 * Enhanced for Task 10 - Technical Specifications Display System
 */
export function SpecificationDisplay({
  productId,
  specifications: initialSpecs = [],
  categories: initialCategories = [],
  showSearch = true,
  showActions = true,
  compactView = false,
  onSpecificationUpdate,
  onExport,
  className = ''
}: SpecificationDisplayProps) {
  const { preferences, mounted, toggleCategoryCollapsed, isCategoryCollapsed } = useSpecificationPreferences();
  const {
    specifications,
    categories,
    groupedSpecifications,
    loading,
    error,
    searchTerm,
    filters,
    totalCount,
    filteredCount,
    hasActiveFilters,
    setSearchTerm,
    updateFilters,
    clearFilters
  } = useSpecifications(productId);

  const [expandedAll, setExpandedAll] = useState(false);

  // Use provided data if available, otherwise use hook data
  const displaySpecs = initialSpecs.length > 0 ? initialSpecs : specifications;
  const displayCategories = initialCategories.length > 0 ? initialCategories : categories;
  const displayGrouped = initialSpecs.length > 0 ? {} : groupedSpecifications; // TODO: group initial specs

  // Handle expand/collapse all
  const handleExpandAll = () => {
    const allCategoryIds = Object.keys(displayGrouped);
    if (expandedAll) {
      // Collapse all
      allCategoryIds.forEach(categoryId => {
        if (!isCategoryCollapsed(categoryId)) {
          toggleCategoryCollapsed(categoryId);
        }
      });
    } else {
      // Expand all
      allCategoryIds.forEach(categoryId => {
        if (isCategoryCollapsed(categoryId)) {
          toggleCategoryCollapsed(categoryId);
        }
      });
    }
    setExpandedAll(!expandedAll);
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export logic
      console.log(`Exporting ${displaySpecs.length} specifications as ${format}`);
    }
  };

  // SSR safety
  if (!mounted) {
    return (
      <div className={`specification-display ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`specification-display ${className}`}>
        <div className="text-center py-8 text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Error loading specifications: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`specification-display ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (displaySpecs.length === 0) {
    return (
      <div className={`specification-display ${className}`}>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium mb-2">No Technical Specifications</h3>
          <p>This product doesn't have any technical specifications available.</p>
        </div>
      </div>
    );
  }

  const categorizedSpecsCount = Object.keys(displayGrouped).length;
  const hasMultipleCategories = categorizedSpecsCount > 1;

  return (
    <div className={`specification-display ${compactView ? 'compact' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Technical Specifications
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {hasActiveFilters ? (
              <>
                Showing {filteredCount} of {totalCount} specifications
                {hasMultipleCategories && ` across ${categorizedSpecsCount} categories`}
              </>
            ) : (
              <>
                {totalCount} specifications
                {hasMultipleCategories && ` in ${categorizedSpecsCount} categories`}
              </>
            )}
          </p>
        </div>

        {/* Expand/Collapse All */}
        {hasMultipleCategories && (
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {expandedAll ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                Expand All
              </>
            )}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {showSearch && (
        <div className="mb-6">
          <SpecificationSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={updateFilters}
            availableCategories={displayCategories}
            totalSpecs={totalCount}
            filteredSpecs={filteredCount}
            placeholder="Search specifications by name, value, or unit..."
          />
          
          {hasActiveFilters && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mb-6">
          <SpecificationActions
            specifications={displaySpecs}
            onExport={handleExport}
            onPrint={() => window.print()}
          />
        </div>
      )}

      {/* Specifications by Category */}
      {filteredCount === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <p>No specifications match your search criteria</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(displayGrouped)
            .sort(([, a], [, b]) => a.category.displayOrder - b.category.displayOrder)
            .map(([categoryId, group]) => (
              <SpecificationCategory
                key={categoryId}
                category={group.category}
                specifications={group.specifications}
                isCollapsed={isCategoryCollapsed(categoryId)}
                onToggleCollapsed={toggleCategoryCollapsed}
                onSpecificationUpdate={onSpecificationUpdate}
                searchTerm={searchTerm}
                compactView={compactView}
                className=""
              />
            ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500 text-center">
          {hasActiveFilters ? (
            <>
              Showing {filteredCount} of {totalCount} specifications
              {Object.keys(displayGrouped).length !== displayCategories.length && (
                <> in {Object.keys(displayGrouped).length} categories</>
              )}
            </>
          ) : (
            <>
              Total: {totalCount} specifications across {displayCategories.length} categories
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpecificationDisplay;