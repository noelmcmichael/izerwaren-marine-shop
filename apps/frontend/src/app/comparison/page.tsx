/**
 * Product Comparison Page
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Main comparison page displaying selected products in a
 * side-by-side comparison table with specifications highlighting.
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useComparison } from '@/hooks/useComparison';
import ComparisonTable from './components/ComparisonTable';

export default function ComparisonPage() {
  const t = useTranslations('comparison');
  const tCommon = useTranslations('common');
  const { products, clearComparison } = useComparison();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/search"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>{tCommon('back')}</span>
              </Link>
              
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* Actions */}
            {products.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearComparison}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-md border border-gray-300 hover:border-red-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('clearAll')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Comparison Stats */}
          {products.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <span className="font-semibold">{products.length}</span> products selected for comparison
                  {products.length < 2 && (
                    <span className="ml-2 text-blue-600">
                      (Add at least 2 products to compare effectively)
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-blue-600">
                  Products with different specifications are highlighted
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComparisonTable 
          products={products} 
          className="bg-white rounded-lg shadow-sm border"
        />
      </div>

      {/* Footer Actions */}
      {products.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center space-x-4">
              <Link
                href="/search"
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Add More Products
              </Link>
              
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Print Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          body {
            background: white !important;
          }
          
          .bg-gray-50 {
            background: white !important;
          }
          
          .border {
            border: 1px solid #e5e7eb !important;
          }
          
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}