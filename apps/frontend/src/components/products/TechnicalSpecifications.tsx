'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Settings, Ruler, Wrench } from 'lucide-react';

interface TechnicalSpec {
  id: string;
  name: string;
  value: string;
  unit?: string;
}

interface TechnicalSpecsByCategory {
  [category: string]: TechnicalSpec[];
}

interface TechnicalSpecificationsProps {
  specifications: TechnicalSpecsByCategory;
  className?: string;
}

// Category icons mapping
const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    dimensions: Ruler,
    material: Settings,
    performance: Wrench,
    mechanical: Settings,
    electrical: Settings,
    environmental: Settings,
    finish: Settings,
    mounting: Settings,
    default: Settings,
  };

  const normalizedCategory = category.toLowerCase();
  const IconComponent = iconMap[normalizedCategory] || iconMap.default;
  return IconComponent;
};

// Format specification value with unit
const formatSpecValue = (value: string, unit?: string) => {
  if (!unit) return value;
  
  // Handle special cases for better formatting
  if (unit === 'mm' || unit === 'inches' || unit === 'in') {
    return `${value} ${unit}`;
  }
  
  if (unit === 'kg' || unit === 'lbs' || unit === 'g') {
    return `${value} ${unit}`;
  }
  
  if (unit === '°C' || unit === '°F') {
    return `${value}${unit}`;
  }
  
  if (unit === 'PSI' || unit === 'Bar' || unit === 'MPa') {
    return `${value} ${unit}`;
  }
  
  return `${value} ${unit}`;
};

// Format category name for display
const formatCategoryName = (category: string) => {
  return category
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const TechnicalSpecifications: React.FC<TechnicalSpecificationsProps> = ({
  specifications,
  className = '',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const categories = Object.keys(specifications);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Expand all categories
  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Filter specifications based on search term
  const filteredSpecifications = React.useMemo(() => {
    if (!searchTerm.trim()) return specifications;

    const filtered: TechnicalSpecsByCategory = {};
    const lowerSearchTerm = searchTerm.toLowerCase();

    Object.entries(specifications).forEach(([category, specs]) => {
      const filteredSpecs = specs.filter(
        spec =>
          spec.name.toLowerCase().includes(lowerSearchTerm) ||
          spec.value.toLowerCase().includes(lowerSearchTerm) ||
          (spec.unit && spec.unit.toLowerCase().includes(lowerSearchTerm))
      );

      if (filteredSpecs.length > 0 || category.toLowerCase().includes(lowerSearchTerm)) {
        filtered[category] = filteredSpecs.length > 0 ? filteredSpecs : specs;
      }
    });

    return filtered;
  }, [specifications, searchTerm]);

  const filteredCategories = Object.keys(filteredSpecifications);

  // Auto-expand categories when searching
  React.useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedCategories(new Set(filteredCategories));
    }
  }, [searchTerm, filteredCategories]);

  if (categories.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Technical Specifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Technical specifications are not available for this product.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Search specifications"
            >
              <Search className="h-4 w-4" />
            </button>
            
            {/* Expand/Collapse controls */}
            <button
              onClick={expandAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search input */}
        {showSearch && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className="divide-y divide-gray-200">
        {filteredCategories.map((category) => {
          const specs = filteredSpecifications[category];
          const isExpanded = expandedCategories.has(category);
          const CategoryIcon = getCategoryIcon(category);

          return (
            <div key={category} className="overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CategoryIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {formatCategoryName(category)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {specs.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Category specifications */}
              {isExpanded && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {specs.map((spec) => (
                        <div key={spec.id} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                          <dt className="text-sm font-medium text-gray-700">{spec.name}</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-semibold">
                            {formatSpecValue(spec.value, spec.unit)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search results info */}
      {searchTerm && filteredCategories.length === 0 && (
        <div className="px-6 py-8 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No specifications match your search term &ldquo;{searchTerm}&rdquo;.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default TechnicalSpecifications;