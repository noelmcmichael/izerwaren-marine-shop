'use client';

import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: string;
  availability?: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  shopifyVariants: Array<{
    id: string;
    sku?: string;
    inventoryQty?: number;
  }>;
}

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
}

export function ProductGrid({ products, viewMode }: ProductGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border">
            <ProductCard product={product} viewMode="list" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <ProductCard product={product} viewMode="grid" />
        </div>
      ))}
    </div>
  );
}