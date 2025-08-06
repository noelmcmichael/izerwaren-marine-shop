'use client';

import React from 'react';

import { ProductDetail } from '@/components/product/ProductDetail';
import { Product } from '@/components/product/types';

// Mock data for testing
const mockVariableProduct: Product = {
  id: 'cmdsiz0j30000bdvw8itw0y3c',
  sku: 'IZW-0007',
  title: 'Door Lock 30 mm Backset with Cylinder Key - Thumb-turn Function',
  description:
    'Professional marine door lock with cylinder key and thumb-turn function. Suitable for 30mm backset doors with various handing configurations.',
  price: 468.23,
  retailPrice: 625.0,
  handle: 'door-lock-30-mm-backset-with-cylinder-key-thumb-turn-function',
  productType: 'VARIABLE',
  hasVariants: true,
  variantCount: 4,
  tags: ['Marine Locks', 'Door Hardware'],
  status: 'active',
  variantGroups: [
    {
      id: 'group-1',
      name: 'Rimlock Handing',
      label: 'Rimlock Handing',
      inputType: 'radio',
      required: true,
      sortOrder: 1,
      options: [
        {
          id: 'opt-1',
          value: 'Left hand inwards',
          displayText: 'Left Hand Inwards',
          priceModifier: 0,
          sortOrder: 0,
        },
        {
          id: 'opt-2',
          value: 'Right hand outwards',
          displayText: 'Right Hand Outwards',
          priceModifier: 0,
          sortOrder: 1,
        },
        {
          id: 'opt-3',
          value: 'Left hand outwards',
          displayText: 'Left Hand Outwards',
          priceModifier: 0,
          sortOrder: 2,
        },
        {
          id: 'opt-4',
          value: 'Right hand inwards',
          displayText: 'Right Hand Inwards',
          priceModifier: 0,
          sortOrder: 3,
        },
      ],
    },
  ],
  productVariants: [
    {
      id: 'var-1',
      sku: 'IZW-0007-LHI',
      title: 'Door Lock 30 mm Backset with Cylinder Key - Thumb-turn Function (Left hand inwards)',
      price: 468.23,
      isActive: true,
      selections: [
        {
          id: 'sel-1',
          variantId: 'var-1',
          optionId: 'opt-1',
          option: {
            id: 'opt-1',
            value: 'Left hand inwards',
            displayText: 'Left Hand Inwards',
            priceModifier: 0,
            sortOrder: 0,
            variantGroup: {
              id: 'group-1',
              name: 'Rimlock Handing',
              label: 'Rimlock Handing',
              inputType: 'radio',
              required: true,
              sortOrder: 1,
              options: [],
            },
          },
        },
      ],
    },
    {
      id: 'var-2',
      sku: 'IZW-0007-RHO',
      title:
        'Door Lock 30 mm Backset with Cylinder Key - Thumb-turn Function (Right hand outwards)',
      price: 468.23,
      isActive: true,
      selections: [
        {
          id: 'sel-2',
          variantId: 'var-2',
          optionId: 'opt-2',
          option: {
            id: 'opt-2',
            value: 'Right hand outwards',
            displayText: 'Right Hand Outwards',
            priceModifier: 0,
            sortOrder: 1,
            variantGroup: {
              id: 'group-1',
              name: 'Rimlock Handing',
              label: 'Rimlock Handing',
              inputType: 'radio',
              required: true,
              sortOrder: 1,
              options: [],
            },
          },
        },
      ],
    },
  ],
  technicalSpecs: [
    {
      id: 'spec-1',
      category: 'dimension',
      name: 'Backset',
      value: '30',
      unit: 'mm',
      isSearchable: true,
    },
    {
      id: 'spec-2',
      category: 'material',
      name: 'Construction',
      value: 'Brass',
      isSearchable: true,
    },
    {
      id: 'spec-3',
      category: 'environment',
      name: 'Suitable For',
      value: 'Marine',
      isSearchable: true,
    },
  ],
};

const mockSimpleProduct: Product = {
  id: 'simple-1',
  sku: 'IZW-0004',
  title: 'Gas Springs Series 10-23 with Lock Open Sleeve',
  description:
    'Gas spring for hatches from 100 lbs. to 200 lbs. weight. Stainless steel construction with polished finish.',
  price: 94.78,
  retailPrice: 120.0,
  handle: 'gas-springs-series-10-23-with-lock-open-sleeve',
  productType: 'SIMPLE',
  hasVariants: false,
  variantCount: 0,
  tags: ['Gas Springs', 'Marine Hardware'],
  status: 'active',
  technicalSpecs: [
    {
      id: 'spec-simple-1',
      category: 'force',
      name: 'Force Range',
      value: '100-1250',
      unit: 'N',
      isSearchable: true,
    },
    {
      id: 'spec-simple-2',
      category: 'dimension',
      name: 'Rod Diameter',
      value: '10',
      unit: 'mm',
      isSearchable: true,
    },
    {
      id: 'spec-simple-3',
      category: 'dimension',
      name: 'Body Diameter',
      value: '23',
      unit: 'mm',
      isSearchable: true,
    },
  ],
};

const mockAccount = {
  id: 'account-1',
  tier: 'PREMIUM' as const,
};

export default function ProductDemoPage() {
  const handleAddToCart = (variant?: any) => {
    if (variant) {
      alert(`Added to cart: ${variant.sku} - ${variant.title}`);
    } else {
      alert('Added simple product to cart');
    }
  };

  const handleRequestQuote = (variant?: any) => {
    if (variant) {
      alert(`Quote requested for: ${variant.sku} - ${variant.title}`);
    } else {
      alert('Quote requested for simple product');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Product Component Demo</h1>
          <p className='text-gray-600'>Testing both variable and simple product displays</p>
        </div>

        {/* Variable Product Demo */}
        <div className='mb-12'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='mb-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Variable Product Demo</h2>
              <p className='text-gray-600'>Product with configurable variants (Rimlock Handing)</p>
            </div>

            <ProductDetail
              product={mockVariableProduct}
              account={mockAccount}
              onAddToCart={handleAddToCart}
              onRequestQuote={handleRequestQuote}
            />
          </div>
        </div>

        {/* Simple Product Demo */}
        <div className='mb-12'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='mb-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>Simple Product Demo</h2>
              <p className='text-gray-600'>Product without variants (direct add-to-cart)</p>
            </div>

            <ProductDetail
              product={mockSimpleProduct}
              account={mockAccount}
              onAddToCart={handleAddToCart}
              onRequestQuote={handleRequestQuote}
            />
          </div>
        </div>

        {/* Account Tier Demo */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {['STANDARD', 'PREMIUM', 'ENTERPRISE'].map(tier => (
            <div key={tier} className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
              <h3 className='font-medium text-gray-900 mb-4'>{tier} Account Pricing</h3>
              <ProductDetail
                product={mockSimpleProduct}
                account={{ id: 'test', tier: tier as any }}
                onAddToCart={handleAddToCart}
                onRequestQuote={handleRequestQuote}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
