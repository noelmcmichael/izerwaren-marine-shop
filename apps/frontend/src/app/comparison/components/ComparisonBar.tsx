/**
 * Floating Comparison Bar Component
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Persistent floating UI element that shows selected products count
 * and provides quick access to the comparison page.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, Eye } from 'lucide-react';
// import { useTranslations } from 'next-intl'; // Temporarily disabled for production stability
import Link from 'next/link';
import Image from 'next/image';
import { useComparison } from '@/hooks/useComparison';

interface ComparisonBarProps {
  className?: string;
}

export function ComparisonBar({ className = '' }: ComparisonBarProps) {
  // const t = useTranslations('comparison'); // Temporarily disabled for production stability
  const { products, maxProducts, isOpen, toggleComparison, clearComparison } = useComparison();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render if not mounted or no products
  if (!mounted || products.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {/* Left Section - Title & Count */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Scale className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Compare Products
                </h3>
                <p className="text-sm text-gray-600">
                  {products.length} product{products.length !== 1 ? 's' : ''} selected
                  {products.length >= maxProducts && (
                    <span className="ml-2 text-amber-600">
                      Maximum {maxProducts} products reached
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Center Section - Product Thumbnails */}
            <div className="hidden md:flex items-center space-x-2">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="w-12 h-12 bg-gray-100 rounded-md border overflow-hidden"
                  title={product.title}
                >
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">
                        {product.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href="/comparison"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">
                  View Comparison
                </span>
              </Link>
              
              <button
                onClick={clearComparison}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                title="Clear All"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Product List (Collapsible) */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden mt-4 pt-4 border-t border-gray-200"
              >
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">
                              {product.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.vendor || product.sku}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Toggle Button */}
          <div className="md:hidden mt-3 text-center">
            <button
              onClick={toggleComparison}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isOpen ? 'Close' : 'View Comparison ↓'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ComparisonBar;