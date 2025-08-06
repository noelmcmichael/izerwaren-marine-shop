'use client';

import React, { useState, useEffect } from 'react';

import { PricingDisplay } from './PricingDisplay';
import { ProductVariantSelector } from './ProductVariantSelector';
import { TechnicalSpecsTable } from './TechnicalSpecsTable';
import {
  ProductDisplayProps,
  VariantConfigurationState,
  ProductVariant,
  VariantGroup,
} from './types';

/**
 * Variable product view for products with configurable variants
 */
export function VariableProductView({
  product,
  account,
  onAddToCart,
  onRequestQuote,
}: ProductDisplayProps) {
  const [configuration, setConfiguration] = useState<VariantConfigurationState>({
    productId: product.id,
    selectedOptions: {},
    isValid: false,
    totalPrice: product.price,
    priceModifiers: 0,
  });

  // Check if configuration is complete
  useEffect(() => {
    if (!product.variantGroups) return;

    const requiredGroups = product.variantGroups.filter(group => group.required);
    const hasAllRequired = requiredGroups.every(group => configuration.selectedOptions[group.name]);

    // Find matching product variant
    let selectedVariant: ProductVariant | undefined;
    if (hasAllRequired && product.productVariants) {
      selectedVariant = findMatchingVariant(configuration.selectedOptions, product.productVariants);
    }

    // Calculate pricing
    const priceModifiers = calculatePriceModifiers(
      configuration.selectedOptions,
      product.variantGroups
    );
    const totalPrice = product.price + priceModifiers;

    setConfiguration(prev => ({
      ...prev,
      isValid: hasAllRequired,
      selectedVariant,
      totalPrice,
      priceModifiers,
    }));
  }, [configuration.selectedOptions, product]);

  const handleOptionSelect = (groupName: string, optionValue: string) => {
    setConfiguration(prev => ({
      ...prev,
      selectedOptions: {
        ...prev.selectedOptions,
        [groupName]: optionValue,
      },
    }));
  };

  const handleAddToCart = () => {
    if (configuration.isValid && configuration.selectedVariant) {
      onAddToCart?.(configuration.selectedVariant);
    }
  };

  const handleRequestQuote = () => {
    if (configuration.isValid && configuration.selectedVariant) {
      onRequestQuote?.(configuration.selectedVariant);
    }
  };

  return (
    <div className='variable-product-view'>
      {/* Product Header */}
      <div className='product-header mb-6'>
        <div className='flex flex-wrap items-start gap-4 mb-4'>
          <span className='text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded'>
            SKU: {product.sku}
          </span>
          <span className='text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded'>
            Configurable Product
          </span>
          <span className='text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded'>
            {product.variantCount} variants
          </span>
        </div>

        <h1 className='text-3xl font-bold text-gray-900 mb-2'>{product.title}</h1>

        {product.description && (
          <div className='text-gray-600 mb-4'>
            <p>{product.description}</p>
          </div>
        )}
      </div>

      {/* Product Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2'>
          {/* Product Image Placeholder */}
          <div className='bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-6'>
            <div className='text-center text-gray-500'>
              <div className='text-4xl mb-2'>⚙️</div>
              <p>Product Image</p>
              <p className='text-sm'>{product.sku}</p>
              {configuration.selectedVariant && (
                <p className='text-xs text-blue-600 mt-1'>
                  Variant: {configuration.selectedVariant.sku}
                </p>
              )}
            </div>
          </div>

          {/* Product Configuration */}
          {product.variantGroups && product.variantGroups.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-xl font-semibold mb-4'>Product Configuration</h3>
              <ProductVariantSelector
                variantGroups={product.variantGroups}
                selectedOptions={configuration.selectedOptions}
                onOptionSelect={handleOptionSelect}
              />
            </div>
          )}

          {/* Selected Variant Display */}
          {configuration.selectedVariant && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
              <h4 className='font-medium text-blue-900 mb-2'>Selected Configuration</h4>
              <div className='text-sm text-blue-800'>
                <p className='font-medium'>{configuration.selectedVariant.title}</p>
                <p className='text-blue-600'>SKU: {configuration.selectedVariant.sku}</p>
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          {product.technicalSpecs && product.technicalSpecs.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-xl font-semibold mb-4'>Technical Specifications</h3>
              <TechnicalSpecsTable specifications={product.technicalSpecs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4'>
            {/* Pricing */}
            <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
              <PricingDisplay
                basePrice={product.price}
                retailPrice={product.retailPrice}
                account={account}
                priceModifiers={configuration.priceModifiers}
                totalPrice={configuration.totalPrice}
              />

              {/* Configuration Status */}
              <div className='mt-4 mb-6'>
                {configuration.isValid ? (
                  <div className='text-green-600 text-sm flex items-center'>
                    <span className='mr-2'>✓</span>
                    Configuration complete
                  </div>
                ) : (
                  <div className='text-amber-600 text-sm flex items-center'>
                    <span className='mr-2'>⚠</span>
                    Please select all required options
                  </div>
                )}
              </div>

              {/* Add to Cart Section */}
              <div className='space-y-3'>
                <button
                  onClick={handleAddToCart}
                  disabled={!configuration.isValid}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                    configuration.isValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleRequestQuote}
                  disabled={!configuration.isValid}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                    configuration.isValid
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Request Quote
                </button>
              </div>

              {/* Product Info */}
              <div className='mt-6 text-sm text-gray-600 space-y-2'>
                <div className='flex justify-between'>
                  <span>Product Type:</span>
                  <span>Configurable</span>
                </div>
                <div className='flex justify-between'>
                  <span>Available Variants:</span>
                  <span>{product.variantCount}</span>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className='flex justify-between'>
                    <span>Category:</span>
                    <span>{product.tags[0]}</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span>Status:</span>
                  <span className='capitalize'>{product.status}</span>
                </div>
              </div>
            </div>

            {/* Configuration Help */}
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>Configuration Guide</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Select required options to proceed</li>
                <li>• Prices update automatically</li>
                <li>• Each configuration has a unique SKU</li>
                <li>• Contact support for custom configurations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function findMatchingVariant(
  selectedOptions: Record<string, string>,
  productVariants: ProductVariant[]
): ProductVariant | undefined {
  return productVariants.find(variant => {
    // Check if this variant matches all selected options
    const variantSelections = variant.selections.reduce(
      (acc, selection) => {
        acc[selection.option.variantGroup.name] = selection.option.value;
        return acc;
      },
      {} as Record<string, string>
    );

    // Check if all selected options match this variant
    for (const [groupName, optionValue] of Object.entries(selectedOptions)) {
      if (variantSelections[groupName] !== optionValue) {
        return false;
      }
    }

    return true;
  });
}

function calculatePriceModifiers(
  selectedOptions: Record<string, string>,
  variantGroups: VariantGroup[]
): number {
  let totalModifier = 0;

  for (const [groupName, optionValue] of Object.entries(selectedOptions)) {
    const group = variantGroups.find(g => g.name === groupName);
    if (group) {
      const option = group.options.find(o => o.value === optionValue);
      if (option?.priceModifier) {
        totalModifier += option.priceModifier;
      }
    }
  }

  return totalModifier;
}

export default VariableProductView;
