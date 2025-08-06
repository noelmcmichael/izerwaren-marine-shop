/**
 * SearchFilters Component with Faceted Search
 * Task 9.4: Algolia Search Integration
 * 
 * Provides advanced filtering capabilities integrated with Algolia facets
 * and seamless integration with existing filter system
 */

'use client';

import React, { useState } from 'react';
import {
  useRefinementList,
  useRange,
  useClearRefinements,
} from 'react-instantsearch';
import { Filter, X, ChevronDown, ChevronUp, DollarSign, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchFiltersProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

// Individual filter components
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

function FilterSection({ title, children, defaultOpen = false, icon }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Category refinement component
function CategoryRefinement() {
  const { items, refine } = useRefinementList({
    attribute: 'categoryName',
    limit: 10,
    showMore: true,
    sortBy: ['count:desc', 'name:asc'],
  });

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.value} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.isRefined}
            onChange={() => refine(item.value)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="ml-2 text-sm text-gray-700 flex-1">
            {item.label}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  );
}

// Vendor refinement component
function VendorRefinement() {
  const { items, refine } = useRefinementList({
    attribute: 'vendor',
    limit: 8,
    showMore: true,
    sortBy: ['count:desc', 'name:asc'],
  });

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.value} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.isRefined}
            onChange={() => refine(item.value)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="ml-2 text-sm text-gray-700 flex-1">
            {item.label}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  );
}

// Availability refinement component
function AvailabilityRefinement() {
  const { items, refine } = useRefinementList({
    attribute: 'availability',
    limit: 5,
    sortBy: ['count:desc', 'name:asc'],
  });

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.value} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.isRefined}
            onChange={() => refine(item.value)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="ml-2 text-sm text-gray-700 flex-1">
            {item.label}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  );
}

// Price range component
function PriceRange() {
  const t = useTranslations('search.filters');
  const { start, range, canRefine, refine } = useRange({
    attribute: 'price',
  });

  const [localMin, setLocalMin] = useState(start[0]?.toString() || '');
  const [localMax, setLocalMax] = useState(start[1]?.toString() || '');

  const handleApplyRange = () => {
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;
    refine([min, max]);
  };

  const handleClearRange = () => {
    setLocalMin('');
    setLocalMax('');
    refine([undefined, undefined]);
  };

  if (!canRefine) {
    return (
      <div className="text-sm text-gray-500">
        {t('noPriceData', 'No price data available')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            {t('minPrice', 'Min Price')}
          </label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder={range.min?.toString() || '0'}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            {t('maxPrice', 'Max Price')}
          </label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder={range.max?.toString() || '1000'}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleApplyRange}
          className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
        >
          {t('apply', 'Apply')}
        </button>
        <button
          onClick={handleClearRange}
          className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors duration-200"
        >
          {t('clear', 'Clear')}
        </button>
      </div>

      {range.min !== undefined && range.max !== undefined && (
        <div className="text-xs text-gray-500">
          {t('priceRange', 'Range')}: ${range.min.toFixed(2)} - ${range.max.toFixed(2)}
        </div>
      )}
    </div>
  );
}

// Material refinement component
function MaterialRefinement() {
  const { items, refine } = useRefinementList({
    attribute: 'specifications.material',
    limit: 6,
    showMore: true,
    sortBy: ['count:desc', 'name:asc'],
  });

  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        {t('noMaterials', 'No materials available')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.value} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.isRefined}
            onChange={() => refine(item.value)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="ml-2 text-sm text-gray-700 flex-1">
            {item.label}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  );
}

// Clear filters component
function ClearFilters() {
  const { canRefine, refine } = useClearRefinements();

  if (!canRefine) {
    return null;
  }

  return (
    <button
      onClick={() => refine()}
      className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2"
    >
      <X className="h-4 w-4" />
      {t('clearAllFilters', 'Clear All Filters')}
    </button>
  );
}

export function SearchFilters({ className = '', isOpen = true, onToggle }: SearchFiltersProps) {
  const t = useTranslations('search.filters');

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            {t('filters', 'Filters')}
          </h3>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="divide-y divide-gray-200">
          {/* Clear All Filters */}
          <div className="p-4">
            <ClearFilters />
          </div>

          {/* Categories */}
          <FilterSection 
            title={t('categories', 'Categories')} 
            defaultOpen={true}
            icon={<Package className="h-4 w-4 text-gray-500" />}
          >
            <CategoryRefinement />
          </FilterSection>

          {/* Price Range */}
          <FilterSection 
            title={t('priceRange', 'Price Range')} 
            defaultOpen={true}
            icon={<DollarSign className="h-4 w-4 text-gray-500" />}
          >
            <PriceRange />
          </FilterSection>

          {/* Brands/Vendors */}
          <FilterSection 
            title={t('brands', 'Brands')} 
            defaultOpen={false}
          >
            <VendorRefinement />
          </FilterSection>

          {/* Availability */}
          <FilterSection 
            title={t('availability', 'Availability')} 
            defaultOpen={false}
          >
            <AvailabilityRefinement />
          </FilterSection>

          {/* Materials */}
          <FilterSection 
            title={t('materials', 'Materials')} 
            defaultOpen={false}
          >
            <MaterialRefinement />
          </FilterSection>
        </div>
      )}
    </div>
  );
}

export default SearchFilters;