'use client';

import React from 'react';

import { VariantGroup } from './types';

interface ProductVariantSelectorProps {
  variantGroups: VariantGroup[];
  selectedOptions: Record<string, string>;
  onOptionSelect: (groupName: string, optionValue: string) => void;
}

/**
 * Product variant selector with radio buttons and dropdowns
 */
export function ProductVariantSelector({
  variantGroups,
  selectedOptions,
  onOptionSelect,
}: ProductVariantSelectorProps) {
  // Sort groups by sort order
  const sortedGroups = [...variantGroups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className='product-variant-selector space-y-6'>
      {sortedGroups.map(group => (
        <div key={group.id} className='variant-group'>
          <label className='block text-sm font-medium text-gray-900 mb-3'>
            {group.label}
            {group.required && <span className='text-red-500 ml-1'>*</span>}
          </label>

          {group.inputType === 'radio' ? (
            <RadioVariantGroup
              group={group}
              selectedValue={selectedOptions[group.name]}
              onSelect={value => onOptionSelect(group.name, value)}
            />
          ) : (
            <DropdownVariantGroup
              group={group}
              selectedValue={selectedOptions[group.name]}
              onSelect={value => onOptionSelect(group.name, value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface VariantGroupProps {
  group: VariantGroup;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

/**
 * Radio button variant group (for binary choices like Left/Right)
 */
function RadioVariantGroup({ group, selectedValue, onSelect }: VariantGroupProps) {
  // Sort options by sort order
  const sortedOptions = [...group.options].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className='radio-variant-group'>
      <div className='space-y-3'>
        {sortedOptions.map(option => (
          <div key={option.id} className='flex items-center'>
            <input
              id={`${group.id}-${option.id}`}
              name={group.name}
              type='radio'
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onSelect(option.value)}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
            />
            <label
              htmlFor={`${group.id}-${option.id}`}
              className='ml-3 flex items-center cursor-pointer'
            >
              <span className='text-sm font-medium text-gray-900'>{option.displayText}</span>
              {option.priceModifier && option.priceModifier > 0 && (
                <span className='ml-2 text-sm text-green-600'>
                  +${option.priceModifier.toFixed(2)}
                </span>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dropdown variant group (for multiple choices like materials, sizes)
 */
function DropdownVariantGroup({ group, selectedValue, onSelect }: VariantGroupProps) {
  // Sort options by sort order
  const sortedOptions = [...group.options].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className='dropdown-variant-group'>
      <select
        value={selectedValue || ''}
        onChange={e => onSelect(e.target.value)}
        className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
      >
        <option value=''>
          {group.required ? `Select ${group.label}...` : `Optional ${group.label}...`}
        </option>
        {sortedOptions.map(option => (
          <option key={option.id} value={option.value}>
            {option.displayText}
            {option.priceModifier &&
              option.priceModifier > 0 &&
              ` (+$${option.priceModifier.toFixed(2)})`}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProductVariantSelector;
