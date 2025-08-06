'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag, Package, Heart, ShoppingCart } from 'lucide-react';
import { getImageUrl, generateAltText } from '../../lib/image-utils';

interface ProductImage {
  id: string;
  imageUrl?: string;
  localPath?: string;
  altText?: string;
  isPrimary: boolean;
}

interface RelatedProduct {
  id: string;
  title: string;
  sku: string;
  price?: number;
  availability?: string;
  vendor?: string;
  relationshipType: 'same_category' | 'same_vendor' | 'similar_specs';
  primaryImage?: ProductImage | null;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
  currentProductSku: string;
  className?: string;
}

// Format price for display
const formatPrice = (price?: number) => {
  if (!price) return null;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// Get relationship type display
const getRelationshipDisplay = (type: string) => {
  switch (type) {
    case 'same_category':
      return { label: 'Same Category', color: 'bg-blue-100 text-blue-800' };
    case 'same_vendor':
      return { label: 'Same Brand', color: 'bg-green-100 text-green-800' };
    case 'similar_specs':
      return { label: 'Similar Specs', color: 'bg-purple-100 text-purple-800' };
    default:
      return { label: 'Related', color: 'bg-gray-100 text-gray-800' };
  }
};

// Get availability status styling
const getAvailabilityStatus = (availability?: string) => {
  switch (availability) {
    case 'In Stock':
      return { text: 'In Stock', className: 'text-green-600' };
    case 'Limited Stock':
      return { text: 'Limited', className: 'text-yellow-600' };
    case 'Available to Order':
      return { text: 'To Order', className: 'text-blue-600' };
    default:
      return { text: 'Contact', className: 'text-gray-600' };
  }
};

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  currentProductSku,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter out current product and limit results
  const relatedProducts = products.filter(product => product.sku !== currentProductSku).slice(0, 8);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (relatedProducts.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Related Products</h3>
          <p className="mt-1 text-sm text-gray-500">
            No related products are available at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Related Products</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {relatedProducts.length} {relatedProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

          {/* Navigation arrows */}
          {relatedProducts.length > 3 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={scrollLeft}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={scrollRight}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {relatedProducts.map((product) => {
            const relationship = getRelationshipDisplay(product.relationshipType);
            const availability = getAvailabilityStatus(product.availability);
            const productPrice = formatPrice(product.price);

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-72 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  <Link href={`/product/${product.sku}`}>
                    <Image
                      src={
                        getImageUrl(product.primaryImage?.imageUrl, product.primaryImage?.localPath) ||
                        '/images/placeholder-product.jpg'
                      }
                      alt={product.primaryImage?.altText || generateAltText(product.title)}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 100vw, 288px"
                    />
                  </Link>

                  {/* Relationship badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${relationship.color}`}>
                      {relationship.label}
                    </span>
                  </div>

                  {/* Quick actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col space-y-1">
                      <button
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                        title="Add to wishlist"
                      >
                        <Heart className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                        title="Quick add to cart"
                      >
                        <ShoppingCart className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Vendor */}
                  {product.vendor && (
                    <div className="flex items-center space-x-1 mb-2">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {product.vendor}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <Link href={`/product/${product.sku}`}>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                      {product.title}
                    </h4>
                  </Link>

                  {/* SKU */}
                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>

                  {/* Price and Availability */}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {productPrice ? (
                        <p className="text-sm font-semibold text-gray-900">{productPrice}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Price on request</p>
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-medium ${availability.className}`}>
                        {availability.text}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 space-y-2">
                    <Link
                      href={`/product/${product.sku}`}
                      className="block w-full text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show all link */}
      <div className="px-6 pb-4">
        <Link
          href="/catalog"
          className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Products →
        </Link>
      </div>
    </div>
  );
};

export default RelatedProducts;