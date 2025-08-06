'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Package,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';

async function fetchProduct(sku: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products/${sku}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();

    // Transform API data to component types
    return {
      id: data.id,
      sku: data.sku || '',
      title: data.title,
      description: data.description || undefined,
      price: Number(data.price) || 0,
      retailPrice: data.retailPrice ? Number(data.retailPrice) : undefined,
      handle: data.handle,
      productType: data.productType,
      hasVariants: data.hasVariants,
      variantCount: data.variantCount,
      tags: data.tags,
      status: data.status,
      variantGroups:
        data.variantGroups?.map((group: any) => ({
          id: group.id,
          name: group.name,
          label: group.label,
          inputType: group.inputType,
          required: group.required,
          sortOrder: group.sortOrder,
          options: group.options.map((option: any) => ({
            id: option.id,
            value: option.value,
            displayText: option.displayText,
            priceModifier: option.priceModifier ? Number(option.priceModifier) : undefined,
            sortOrder: option.sortOrder,
          })),
        })) || [],
      productVariants:
        data.productVariants?.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          title: variant.title,
          price: variant.price ? Number(variant.price) : undefined,
          isActive: variant.isActive,
          selections: variant.selections.map((selection: any) => ({
            id: selection.id,
            variantId: selection.variantId,
            optionId: selection.optionId,
            option: {
              id: selection.option.id,
              value: selection.option.value,
              displayText: selection.option.displayText,
              priceModifier: selection.option.priceModifier
                ? Number(selection.option.priceModifier)
                : undefined,
              sortOrder: selection.option.sortOrder,
              variantGroup: {
                id: selection.option.variantGroup.id,
                name: selection.option.variantGroup.name,
                label: selection.option.variantGroup.label,
                inputType: selection.option.variantGroup.inputType,
                required: selection.option.variantGroup.required,
                sortOrder: selection.option.variantGroup.sortOrder,
                options: [],
              },
            },
          })),
        })) || [],
      technicalSpecs:
        data.technicalSpecs?.map((spec: any) => ({
          id: spec.id,
          category: spec.category,
          name: spec.name,
          value: spec.value,
          unit: spec.unit,
          isSearchable: spec.isSearchable,
        })) || [],
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

interface ProductPageProps {
  params: {
    sku: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const productData = await fetchProduct(params.sku);
        if (!productData) {
          setError('Product not found');
          return;
        }
        setProduct(productData);
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.sku]);

  // Mock account for testing - in real app this would come from authentication
  const mockAccount = {
    id: 'test-account',
    tier: 'PREMIUM' as const,
  };

  const handleAddToCart = (variant?: any) => {
    alert(`Added to cart: ${variant?.sku || product?.sku}`);
  };

  const handleRequestQuote = (variant?: any) => {
    alert(`Quote requested for: ${variant?.sku || product?.sku}`);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-4xl mb-4'>⏳</div>
          <p className='text-gray-600'>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-4xl mb-4'>❌</div>
          <p className='text-gray-600'>{error || 'Product not found'}</p>
          <button
            onClick={() => router.back()}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Breadcrumb */}
        <nav className='mb-8'>
          <ol className='flex items-center space-x-2 text-sm text-gray-600'>
            <li>
              <a href='/' className='hover:text-blue-600'>
                Home
              </a>
            </li>
            <li className='text-gray-400'>/</li>
            <li>
              <a href='/products' className='hover:text-blue-600'>
                Products
              </a>
            </li>
            <li className='text-gray-400'>/</li>
            <li className='text-gray-900 font-medium'>{product.sku}</li>
          </ol>
        </nav>

        {/* Product Detail */}
        <ProductDetail
          product={product}
          account={mockAccount}
          onAddToCart={handleAddToCart}
          onRequestQuote={handleRequestQuote}
        />
      </div>
    </div>
  );
}
