'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon as StarOutlineIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

import { useUnitConversion } from './hooks/useUnitConversion';
import type { 
  SpecificationItemProps, 
  SpecImportance,
  SpecDataType 
} from './types';

/**
 * Individual specification row component with unit conversion and editing capabilities
 * Part of Task 10 - Technical Specifications Display System
 */
export function SpecificationItem({
  specification,
  onUpdate,
  searchTerm,
  compactView = false,
  showImportanceBadge = true,
  showUnitToggle = true,
  editable = false,
  className = ''
}: SpecificationItemProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(specification.value);
  const [editUnit, setEditUnit] = useState(specification.unit || '');

  const { 
    convertValue, 
    getAvailableUnits, 
    isConvertible,
    currentUnitSystem,
    toggleUnitSystem 
  } = useUnitConversion();

  // Get converted value and unit
  const { value: displayValue, unit: displayUnit } = React.useMemo(() => {
    if (!specification.unit || !isConvertible(specification.unit)) {
      return { value: specification.value, unit: specification.unit };
    }

    const converted = convertValue(
      parseFloat(specification.value) || 0,
      specification.unit,
      currentUnitSystem
    );

    return {
      value: converted?.value?.toString() || specification.value,
      unit: converted?.unit || specification.unit
    };
  }, [specification.value, specification.unit, currentUnitSystem, convertValue, isConvertible]);

  // Handle save edit
  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate({
        id: specification.id,
        value: editValue,
        unit: editUnit,
        reason: 'Manual update'
      });
    }
    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditValue(specification.value);
    setEditUnit(specification.unit || '');
    setIsEditing(false);
  };

  // Get importance styling
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
      case 'CRITICAL': return <ExclamationTriangleIcon className="w-3 h-3" />;
      case 'IMPORTANT': return <StarSolidIcon className="w-3 h-3" />;
      case 'STANDARD': return <CheckCircleIcon className="w-3 h-3" />;
      case 'AUXILIARY': return <StarOutlineIcon className="w-3 h-3" />;
    }
  };

  // Get data type icon
  const getDataTypeIcon = (dataType: SpecDataType) => {
    switch (dataType) {
      case 'URL': return <LinkIcon className="w-4 h-4 text-blue-500" />;
      case 'FILE': return <DocumentIcon className="w-4 h-4 text-purple-500" />;
      case 'RANGE': return <ArrowsRightLeftIcon className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  // Highlight search terms
  const highlightText = (text: string, searchTerm?: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Format numeric values
  const formatValue = (value: string, dataType: SpecDataType): string => {
    if (dataType === 'NUMERIC' && !isNaN(parseFloat(value))) {
      const num = parseFloat(value);
      return num % 1 === 0 ? num.toString() : num.toFixed(2);
    }
    return value;
  };

  // Handle special data types
  const renderSpecialValue = () => {
    switch (specification.dataType) {
      case 'URL':
        return (
          <a 
            href={specification.value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline flex items-center"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            View Document
          </a>
        );
      
      case 'FILE':
        return (
          <button 
            onClick={() => window.open(specification.value, '_blank')}
            className="text-purple-600 hover:text-purple-800 underline flex items-center"
          >
            <DocumentIcon className="w-4 h-4 mr-1" />
            Download File
          </button>
        );
      
      case 'BOOLEAN':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            specification.value.toLowerCase() === 'true' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {specification.value.toLowerCase() === 'true' ? '✓ Yes' : '✗ No'}
          </span>
        );
      
      default:
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {specification.unit && (
              <input
                type="text"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unit"
              />
            )}
          </div>
        ) : (
          <span className="font-medium">
            {highlightText(formatValue(displayValue, specification.dataType), searchTerm)}
            {displayUnit && (
              <span className="ml-1 text-gray-500 font-normal">
                {displayUnit}
              </span>
            )}
          </span>
        );
    }
  };

  return (
    <motion.div 
      className={`specification-item p-4 hover:bg-gray-50 transition-colors ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`flex ${compactView ? 'items-center' : 'items-start'} justify-between`}>
        {/* Left Side - Name and Value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {/* Data Type Icon */}
            {getDataTypeIcon(specification.dataType)}
            
            {/* Specification Name */}
            <h4 className={`${compactView ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
              {highlightText(specification.name, searchTerm)}
            </h4>

            {/* Highlighted Badge */}
            {specification.isHighlighted && (
              <StarSolidIcon className="w-4 h-4 text-amber-500" title="Highlighted specification" />
            )}
          </div>

          {/* Value */}
          <div className="mt-1">
            {renderSpecialValue()}
          </div>

          {/* Numeric Range Display */}
          {specification.dataType === 'RANGE' && specification.numericMin !== undefined && specification.numericMax !== undefined && (
            <div className="mt-1 text-sm text-gray-600">
              Range: {specification.numericMin} - {specification.numericMax} {displayUnit}
            </div>
          )}

          {/* Additional Info for non-compact view */}
          {!compactView && specification.description && (
            <p className="mt-1 text-sm text-gray-600">
              {highlightText(specification.description, searchTerm)}
            </p>
          )}
        </div>

        {/* Right Side - Actions and Badges */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Unit Conversion Toggle */}
          {showUnitToggle && isConvertible(specification.unit || '') && (
            <button
              onClick={toggleUnitSystem}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={`Switch to ${currentUnitSystem === 'metric' ? 'imperial' : 'metric'} units`}
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </button>
          )}

          {/* Edit Button */}
          {editable && (
            <div className="flex items-center space-x-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Save changes"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Cancel changes"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit specification"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Importance Badge */}
          {showImportanceBadge && (
            <div 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getImportanceColor(specification.importance)}`}
              title={`${specification.importance.toLowerCase()} importance`}
            >
              {getImportanceIcon(specification.importance)}
              <span className="ml-1 capitalize">{specification.importance.toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}