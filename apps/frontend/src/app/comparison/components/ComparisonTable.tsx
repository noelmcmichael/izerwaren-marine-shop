/**
 * Product Comparison Table Component
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Side-by-side comparison of technical specifications with
 * difference highlighting and mobile-responsive design.
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, FileText, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductSummary, formatPrice } from '@/lib/types';
import { useProductActions } from '@/hooks/useProductActions';
import { useComparison } from '@/hooks/useComparison';

interface ComparisonTableProps {
  products: ProductSummary[];
  className?: string;
}

interface SpecificationComparison {
  name: string;
  category?: string;
  values: (string | undefined)[];
  hasVariations: boolean;
}

export function ComparisonTable({ products, className = '' }: ComparisonTableProps) {
  const t = useTranslations('comparison');
  const { addToCart, requestQuote, isLoading } = useProductActions();
  const { removeProduct } = useComparison();
  const [currentMobileProduct, setCurrentMobileProduct] = useState(0);

  // Group and compare specifications
  const specificationComparison = useMemo((): SpecificationComparison[] => {
    if (!products.length) return [];

    // Collect all unique specifications
    const allSpecs = new Map<string, SpecificationComparison>();

    products.forEach((product, productIndex) => {
      const specs = product.technicalSpecs || [];
      
      specs.forEach((spec) => {
        const key = `${spec.category || 'general'}-${spec.name}`;
        
        if (!allSpecs.has(key)) {
          allSpecs.set(key, {
            name: spec.name,
            category: spec.category,
            values: new Array(products.length).fill(undefined),
            hasVariations: false,
          });
        }

        const specComparison = allSpecs.get(key)!;
        specComparison.values[productIndex] = spec.value;
      });
    });

    // Determine which specs have variations
    allSpecs.forEach((spec) => {
      const uniqueValues = new Set(spec.values.filter(v => v !== undefined));
      spec.hasVariations = uniqueValues.size > 1;
    });

    // Sort by category and name
    return Array.from(allSpecs.values()).sort((a, b) => {
      const categoryA = a.category || 'zzz';
      const categoryB = b.category || 'zzz';
      
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  // Handle product actions
  const handleAddToCart = async (product: ProductSummary) => {
    await addToCart(product, 1);
  };

  const handleRequestQuote = async (product: ProductSummary) => {
    await requestQuote(product, 1);
  };

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId);
  };

  // Mobile navigation
  const nextMobileProduct = () => {
    setCurrentMobileProduct((prev) => (prev + 1) % products.length);
  };

  const prevMobileProduct = () => {
    setCurrentMobileProduct((prev) => (prev - 1 + products.length) % products.length);
  };

  if (!products.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('empty.description')}
          </p>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('empty.action')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-4 w-48 bg-gray-50">
                <span className="font-semibold text-gray-900">
                  {t('table.specifications')}
                </span>
              </th>
              {products.map((product) => (
                <th key={product.id} className="text-center p-4 min-w-64 bg-gray-50 relative">
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={t('removeFromComparison')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="space-y-3">
                    {/* Product Image */}
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            {product.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {product.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        SKU: {product.sku}
                      </p>
                      {product.vendor && (
                        <p className="text-xs text-gray-600">
                          {product.vendor}
                        </p>
                      )}
                      {product.price && (
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{t('table.addToCart')}</span>
                      </button>
                      
                      <button
                        onClick={() => handleRequestQuote(product)}
                        disabled={isLoading}
                        className="w-full bg-gray-600 text-white text-xs py-2 px-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{t('table.requestQuote')}</span>
                      </button>
                      
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full bg-white border border-gray-300 text-gray-700 text-xs py-2 px-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t('table.viewDetails')}</span>
                      </Link>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {specificationComparison.map((spec, index) => (
              <tr key={`${spec.category}-${spec.name}`} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  <div>
                    <span className="block">{spec.name}</span>
                    {spec.category && (
                      <span className="text-xs text-gray-500">{spec.category}</span>
                    )}
                  </div>
                </td>
                {spec.values.map((value, productIndex) => (
                  <td
                    key={productIndex}
                    className={`p-4 text-center border-r border-gray-200 ${
                      spec.hasVariations && value 
                        ? 'bg-yellow-50 border-l-2 border-l-yellow-400' 
                        : ''
                    }`}
                  >
                    <span className={`${spec.hasVariations && value ? 'font-semibold text-yellow-800' : 'text-gray-700'}`}>
                      {value || '—'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            
            {specificationComparison.length === 0 && (
              <tr>
                <td colSpan={products.length + 1} className="p-8 text-center text-gray-500">
                  {t('table.noSpecs')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-sm text-gray-600">
              {t('mobile.productDetails')} {currentMobileProduct + 1} / {products.length}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMobileProduct}
                disabled={products.length <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMobileProduct}
                disabled={products.length <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Product */}
          {products[currentMobileProduct] && (
            <div className="p-4">
              <MobileProductCard
                product={products[currentMobileProduct]}
                specifications={specificationComparison}
                productIndex={currentMobileProduct}
                onAddToCart={handleAddToCart}
                onRequestQuote={handleRequestQuote}
                onRemove={handleRemoveProduct}
                isLoading={isLoading}
                t={t}
              />
            </div>
          )}

          {/* Mobile Hint */}
          <div className="p-4 bg-gray-50 text-center text-sm text-gray-600 border-t">
            {t('mobile.swipeHint')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Product Card Component
interface MobileProductCardProps {
  product: ProductSummary;
  specifications: SpecificationComparison[];
  productIndex: number;
  onAddToCart: (product: ProductSummary) => void;
  onRequestQuote: (product: ProductSummary) => void;
  onRemove: (productId: string) => void;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

function MobileProductCard({
  product,
  specifications,
  productIndex,
  onAddToCart,
  onRequestQuote,
  onRemove,
  isLoading,
  t
}: MobileProductCardProps) {
  return (
    <div className="space-y-4">
      {/* Product Header */}
      <div className="flex items-start space-x-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">
                {product.title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 leading-tight">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            SKU: {product.sku}
          </p>
          {product.vendor && (
            <p className="text-sm text-gray-600">
              {product.vendor}
            </p>
          )}
          {product.price && (
            <p className="text-lg font-semibold text-green-600 mt-2">
              {formatPrice(product.price)}
            </p>
          )}
        </div>

        <button
          onClick={() => onRemove(product.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onAddToCart(product)}
          disabled={isLoading}
          className="bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('table.addToCart')}</span>
        </button>
        
        <button
          onClick={() => onRequestQuote(product)}
          disabled={isLoading}
          className="bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
        >
          <FileText className="w-4 h-4" />
          <span>{t('table.requestQuote')}</span>
        </button>
      </div>

      {/* Specifications */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">
          {t('mobile.specifications')}
        </h4>
        <div className="space-y-2">
          {specifications.map((spec) => {
            const value = spec.values[productIndex];
            if (!value) return null;

            return (
              <div
                key={`${spec.category}-${spec.name}`}
                className={`flex justify-between py-2 px-3 rounded ${
                  spec.hasVariations ? 'bg-yellow-50 border-l-2 border-l-yellow-400' : 'bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-700 text-sm">
                  {spec.name}
                  {spec.category && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({spec.category})
                    </span>
                  )}
                </span>
                <span className={`text-sm ${spec.hasVariations ? 'font-semibold text-yellow-800' : 'text-gray-600'}`}>
                  {value}
                </span>
              </div>
            );
          })}
          
          {specifications.filter(spec => spec.values[productIndex]).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              {t('table.noSpecs')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComparisonTable;