'use client';

import { ArrowRight, Package, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { config } from '@/lib/config';



interface Category {
  name: string;
  productCount: number;
  description: string;
  dbCategories: string[];
}

interface CategoriesResponse {
  data: Category[];
  summary: {
    totalMappedCategories: number;
    totalMappedProducts: number;
    mappingCoverage: number;
    averageProductsPerCategory: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CategoriesResponse['summary'] | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.api.baseUrl}/products/categories`);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data: CategoriesResponse = await response.json();
      setCategories(data.data);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load categories');
      setCategories([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='bg-white border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='flex items-center text-sm text-gray-500 mb-6'>
              <Link href='/' className='hover:text-gray-700'>
                Home
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Categories</span>
            </div>
            <div className='text-center'>
              <div className='h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4 animate-pulse'></div>
              <div className='h-4 bg-gray-200 rounded w-2/3 mx-auto animate-pulse'></div>
            </div>
          </div>
        </div>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='bg-white rounded-xl border border-gray-200 p-6'>
                <div className='h-6 bg-gray-200 rounded mb-3 animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded mb-2 animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>Unable to Load Categories</h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={fetchCategories}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Breadcrumb */}
          <div className='flex items-center text-sm text-gray-500 mb-6'>
            <Link href='/' className='hover:text-gray-700 transition-colors duration-200'>
              Home
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Categories</span>
          </div>

          <div className='text-center'>
            <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
              Product Categories
            </h1>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto mb-4'>
              Browse our comprehensive range of marine hardware organized by application. Find
              exactly what you need for your project.
            </p>
            {summary && (
              <div className='text-sm text-gray-500'>
                {summary.totalMappedCategories} categories • {summary.totalMappedProducts} total
                products
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {categories.map(category => (
            <div
              key={category.name}
              className='bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group'
            >
              {/* Category Header */}
              <div className='p-6 border-b border-gray-100'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>
                    {category.name}
                  </h3>
                  <span className='text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                    {category.productCount} products
                  </span>
                </div>
                <p className='text-gray-600 text-sm leading-relaxed line-clamp-2'>
                  {category.description}
                </p>
                {category.dbCategories.length > 0 && (
                  <div className='mt-3'>
                    <p className='text-xs text-gray-500 mb-1'>Includes:</p>
                    <div className='flex flex-wrap gap-1'>
                      {category.dbCategories.slice(0, 2).map((dbCategory, dbIndex) => (
                        <span
                          key={dbIndex}
                          className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'
                        >
                          {dbCategory.length > 20
                            ? `${dbCategory.substring(0, 20)}...`
                            : dbCategory}
                        </span>
                      ))}
                      {category.dbCategories.length > 2 && (
                        <span className='text-xs text-gray-500'>
                          +{category.dbCategories.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Action */}
              <div className='px-6 pb-6'>
                <Link
                  href={`/catalog?category=${encodeURIComponent(category.name)}`}
                  className='inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 group'
                >
                  <span>View All {category.name}</span>
                  <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform duration-200' />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Browse All CTA */}
        <div className='text-center mt-12'>
          <div className='bg-white rounded-xl border border-gray-200 p-8'>
            <Package className='h-12 w-12 text-blue-600 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p className='text-gray-600 mb-6'>
              Browse our complete catalog or use search to find specific products
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/catalog'
                className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200'
              >
                <Package className='mr-2 h-5 w-5' />
                Browse All Products
              </Link>
              <Link
                href='/search'
                className='inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200'
              >
                <Search className='mr-2 h-5 w-5' />
                Search Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
