'use client';

import React from 'react';

import { SimpleProductView } from './SimpleProductView';
import { Product, ProductDisplayProps } from './types';
import { VariableProductView } from './VariableProductView';

/**
 * Main product detail component that handles both simple and variable products
 */
export function ProductDetail({
  product,
  account,
  onAddToCart,
  onRequestQuote,
}: ProductDisplayProps) {
  if (product.productType === 'SIMPLE') {
    return (
      <SimpleProductView
        product={product}
        account={account}
        onAddToCart={onAddToCart}
        onRequestQuote={onRequestQuote}
      />
    );
  }

  return (
    <VariableProductView
      product={product}
      account={account}
      onAddToCart={onAddToCart}
      onRequestQuote={onRequestQuote}
    />
  );
}

export default ProductDetail;
