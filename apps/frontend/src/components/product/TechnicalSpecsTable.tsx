'use client';

import React, { useState } from 'react';

import { TechnicalSpecification } from './types';

interface TechnicalSpecsTableProps {
  specifications: TechnicalSpecification[];
}

/**
 * Technical specifications table with grouping and search
 */
export function TechnicalSpecsTable({ specifications }: TechnicalSpecsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group specifications by category
  const groupedSpecs = specifications.reduce(
    (acc, spec) => {
      if (!acc[spec.category]) {
        acc[spec.category] = [];
      }
      acc[spec.category].push(spec);
      return acc;
    },
    {} as Record<string, TechnicalSpecification[]>
  );

  // Get unique categories
  const categories = Object.keys(groupedSpecs).sort();

  // Filter specifications based on search and category
  const filteredGroupedSpecs = Object.entries(groupedSpecs).reduce(
    (acc, [category, specs]) => {
      // Filter by category
      if (selectedCategory !== 'all' && category !== selectedCategory) {
        return acc;
      }

      // Filter by search term
      const filteredSpecs = specs.filter(
        spec =>
          spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          spec.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (spec.unit && spec.unit.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (filteredSpecs.length > 0) {
        acc[category] = filteredSpecs;
      }

      return acc;
    },
    {} as Record<string, TechnicalSpecification[]>
  );

  if (specifications.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>
        <div className='text-2xl mb-2'>📋</div>
        <p>No technical specifications available</p>
      </div>
    );
  }

  return (
    <div className='technical-specs-table'>
      {/* Search and Filter Controls */}
      <div className='mb-4 flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search specifications...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm'
          />
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className='sm:w-48'>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm'
            >
              <option value='all'>All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Specifications Display */}
      {Object.keys(filteredGroupedSpecs).length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <p>No specifications match your search</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {Object.entries(filteredGroupedSpecs).map(([category, specs]) => (
            <div key={category} className='spec-category'>
              {/* Category Header */}
              <h4 className='text-lg font-medium text-gray-900 mb-3 capitalize'>
                {category.replace('_', ' ')}
                <span className='ml-2 text-sm font-normal text-gray-500'>
                  ({specs.length} {specs.length === 1 ? 'item' : 'items'})
                </span>
              </h4>

              {/* Specifications Table */}
              <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Specification
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Value
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {specs.map((spec, index) => (
                      <tr key={spec.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className='px-4 py-3 text-sm font-medium text-gray-900'>{spec.name}</td>
                        <td className='px-4 py-3 text-sm text-gray-700'>{spec.value}</td>
                        <td className='px-4 py-3 text-sm text-gray-500'>{spec.unit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className='mt-6 text-sm text-gray-500 text-center'>
        Showing {Object.values(filteredGroupedSpecs).flat().length} of {specifications.length}{' '}
        specifications
      </div>
    </div>
  );
}

export default TechnicalSpecsTable;
