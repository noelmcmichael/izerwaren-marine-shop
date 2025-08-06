'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Eye, Heart, Package, AlertCircle } from 'lucide-react';
import { useCart } from '../../../providers/CartProvider';
import { useToast } from '../../../components/shared/Toast';

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

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  
  const { addToCartBySku, isShopifyConfigured } = useCart();
  const { showToast } = useToast();
  const t = useTranslations('catalog');

  // Get the primary image or fallback to first image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const currentImage = product.images[currentImageIndex] || primaryImage;
  
  // Format price display
  const formatPrice = (price?: string) => {
    if (!price) return t('priceOnRequest');
    
    // Handle different price formats
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numPrice)) return t('priceOnRequest');
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  };

  // Get availability status and styling
  const getAvailabilityStatus = (availability?: string) => {
    switch (availability) {
      case 'In Stock':
        return { text: t('inStock'), className: 'text-green-600 bg-green-50' };
      case 'Limited Stock':
        return { text: t('limitedStock'), className: 'text-yellow-600 bg-yellow-50' };
      case 'Available to Order':
        return { text: t('availableToOrder'), className: 'text-blue-600 bg-blue-50' };
      default:
        return { text: t('contactForAvailability'), className: 'text-gray-600 bg-gray-50' };
    }
  };

  const availabilityStatus = getAvailabilityStatus(product.availability);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isShopifyConfigured) {
      showToast(t('errors.cartNotConfigured'), 'error');
      return;
    }
    
    if (!product.sku) {
      showToast(t('errors.skuMissing'), 'error');
      return;
    }
    
    try {
      setAddToCartLoading(true);
      
      await addToCartBySku(product.sku, 1, {
        validateInventory: true,
        maxQuantity: 99,
      });
      
      showToast(t('addToCart') + ' ✓', 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.failedToAddToCart');
      showToast(errorMessage, 'error');
      console.error('Add to cart failed:', error);
    } finally {
      setAddToCartLoading(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newWishlistState = !isWishlisted;
    setIsWishlisted(newWishlistState);
    
    showToast(
      newWishlistState ? t('addToWishlist') + ' ✓' : t('removeFromWishlist') + ' ✓',
      'success'
    );
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/product/${product.sku}`} className="block hover:bg-gray-50 transition-colors">
        <div className="p-6 flex items-center space-x-6">
          {/* Product Image */}
          <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
            {primaryImage && !imageError ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText || product.title}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">{product.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('sku')}: {product.sku}</p>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availabilityStatus.className}`}>
                    {availabilityStatus.text}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-2 rounded-full border ${
                      isWishlisted 
                        ? 'text-red-600 border-red-200 bg-red-50' 
                        : 'text-gray-400 border-gray-200 hover:text-red-600 hover:border-red-200'
                    }`}
                  >
                    <Heart className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={addToCartLoading || !isShopifyConfigured}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      addToCartLoading || !isShopifyConfigured
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {addToCartLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        {t('adding')}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isShopifyConfigured ? t('addToCart') : t('cartNotAvailable')}
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={`/product/${product.sku}`} className="block group">
      <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-100">
        {currentImage && !imageError ? (
          <Image
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            width={300}
            height={300}
            className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* Image indicators for multiple images */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full border bg-white/90 backdrop-blur-sm ${
                isWishlisted 
                  ? 'text-red-600 border-red-200' 
                  : 'text-gray-600 border-gray-200 hover:text-red-600'
              }`}
            >
              <Heart className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-full border bg-white/90 backdrop-blur-sm text-gray-600 border-gray-200 hover:text-blue-600">
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{t('sku')}: {product.sku}</p>
        </div>

        {product.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${availabilityStatus.className}`}>
            {availabilityStatus.text}
          </span>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={addToCartLoading || !isShopifyConfigured}
            className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              addToCartLoading || !isShopifyConfigured
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {addToCartLoading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                {t('adding')}
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isShopifyConfigured ? t('addToCart') : t('cartNotAvailable')}
              </>
            )}
          </button>
          
          {addToCartError && (
            <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3 mr-1" />
              {addToCartError}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}