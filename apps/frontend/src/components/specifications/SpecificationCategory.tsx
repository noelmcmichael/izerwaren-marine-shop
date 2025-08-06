'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  ExclamationTriangleIcon,
  StarIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

import { SpecificationItem } from './SpecificationItem';
import type { 
  SpecificationCategoryProps, 
  SpecImportance,
  EnhancedTechnicalSpecification 
} from './types';

/**
 * Individual specification category component with animations and collapsible sections
 * Part of Task 10 - Technical Specifications Display System
 */
export function SpecificationCategory({
  category,
  specifications,
  isCollapsed,
  onToggleCollapsed,
  onSpecificationUpdate,
  searchTerm,
  compactView = false,
  showImportanceBadges = true,
  className = ''
}: SpecificationCategoryProps) {
  
  // Get importance stats for the category
  const importanceStats = React.useMemo(() => {
    const stats = {
      CRITICAL: 0,
      IMPORTANT: 0,
      STANDARD: 0,
      AUXILIARY: 0
    };
    specifications.forEach(spec => {
      stats[spec.importance]++;
    });
    return stats;
  }, [specifications]);

  // Get importance color and icon
  const getImportanceColor = (importance: SpecImportance): string => {
    switch (importance) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'IMPORTANT': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'STANDARD': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'AUXILIARY': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: SpecImportance) => {
    switch (importance) {
      case 'CRITICAL': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'IMPORTANT': return <StarSolidIcon className="w-4 h-4" />;
      case 'STANDARD': return <InformationCircleIcon className="w-4 h-4" />;
      case 'AUXILIARY': return <StarIcon className="w-4 h-4" />;
    }
  };

  // Category header color based on importance
  const getCategoryHeaderColor = (): string => {
    if (importanceStats.CRITICAL > 0) return 'border-l-red-500';
    if (importanceStats.IMPORTANT > 0) return 'border-l-amber-500';
    return 'border-l-blue-500';
  };

  const specificationCount = specifications.length;
  const highlightedCount = specifications.filter(spec => spec.isHighlighted).length;

  return (
    <div className={`specification-category bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Category Header */}
      <div 
        className={`category-header p-4 border-l-4 ${getCategoryHeaderColor()} cursor-pointer hover:bg-gray-50 transition-colors`}
        onClick={() => onToggleCollapsed(category.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Collapse/Expand Icon */}
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </motion.div>

            {/* Category Icon */}
            {category.icon && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-lg">{category.icon}</span>
              </div>
            )}

            {/* Category Name and Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {category.displayName || category.name}
              </h3>
              {category.description && !compactView && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Importance Badges */}
            {showImportanceBadges && !compactView && (
              <div className="flex space-x-1">
                {(['CRITICAL', 'IMPORTANT', 'STANDARD', 'AUXILIARY'] as SpecImportance[]).map(importance => {
                  const count = importanceStats[importance];
                  if (count === 0) return null;
                  
                  return (
                    <div
                      key={importance}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getImportanceColor(importance)}`}
                      title={`${count} ${importance.toLowerCase()} specifications`}
                    >
                      {getImportanceIcon(importance)}
                      <span className="ml-1">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Specification Count */}
            <div className="text-sm text-gray-500">
              <span className="font-medium">{specificationCount}</span>
              {highlightedCount > 0 && (
                <span className="ml-1 text-amber-600">
                  ({highlightedCount} highlighted)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="category-content">
              {specifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No specifications in this category</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {specifications.map((specification, index) => (
                    <SpecificationItem
                      key={specification.id}
                      specification={specification}
                      onUpdate={onSpecificationUpdate}
                      searchTerm={searchTerm}
                      compactView={compactView}
                      showImportanceBadge={showImportanceBadges}
                      className={index === 0 ? 'border-t-0' : ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}