'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Heart,
  Share2,
  Package,
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  FileText,
  Quote,
  BarChart3,
  Truck
} from 'lucide-react';

import { useCart } from '../../../providers/CartProvider';
import { config } from '../../../lib/config';
import { useTranslations } from 'next-intl';

// Import our new enhanced components
import ImageGallery from '../../../components/products/ImageGallery';
import TechnicalSpecifications from '../../../components/products/TechnicalSpecifications';
import PDFCatalogViewer from '../../../components/products/PDFCatalogViewer';
import RelatedProducts from '../../../components/products/RelatedProducts';

// Enhanced Product interface with full backend data
interface EnhancedProduct {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: number;
  retailPrice?: number;
  availability?: string;
  vendor?: string;
  categoryName?: string;
  tags?: string[];
  images: Array<{
    id: string;
    imageUrl?: string;
    localPath?: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  shopifyVariants: Array<{
    id: string;
    sku?: string;
    inventoryQty?: number;
    price?: string;
    compareAtPrice?: string;
  }>;
  technicalSpecsByCategory: Record<string, Array<{
    id: string;
    name: string;
    value: string;
    unit?: string;
  }>>;
  catalogs: Array<{
    id: string;
    title: string;
    pdfUrl?: string;
    localPdfPath?: string;
    fileSize?: number;
    thumbnailUrl?: string;
  }>;
  relatedProducts: Array<{
    id: string;
    title: string;
    sku: string;
    price?: number;
    availability?: string;
    vendor?: string;
    relationshipType: string;
    primaryImage?: {
      id: string;
      imageUrl?: string;
      localPath?: string;
      altText?: string;
      isPrimary: boolean;
    } | null;
  }>;
  availabilityDetails: {
    status: string;
    inStock: boolean;
    quantityAvailable: number;
    leadTime?: string;
  };
  priceDetails: {
    basePrice?: number;
    retailPrice?: number;
    currency: string;
    bulkPricingAvailable: boolean;
  };
  hasPdfSpecs: boolean;
}

export default function EnhancedProductDetailPage() {
  const params = useParams();
  const sku = params.sku as string;
  const { addToCart, isShopifyConfigured } = useCart();
  const t = useTranslations();

  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'documents'>('overview');

  useEffect(() => {
    if (!sku) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the new enhanced SKU endpoint
        const apiUrl = config.api.baseUrl === '/api' ? '/api/products' : `${config.api.baseUrl}/products`;
        const response = await fetch(`${apiUrl}/sku/${sku}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }

        const result = await response.json();
        setProduct(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [sku]);

  // Format price display
  const formatPrice = (price?: number) => {
    if (!price) return null;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get availability status and styling
  const getAvailabilityStatus = (availability?: string) => {
    switch (availability) {
      case 'In Stock':
        return { text: t('product.inStock'), className: 'text-green-600 bg-green-50', icon: Check };
      case 'Limited Stock':
        return { text: t('product.limitedStock'), className: 'text-yellow-600 bg-yellow-50', icon: Package };
      case 'Available to Order':
        return { text: t('product.availableToOrder'), className: 'text-blue-600 bg-blue-50', icon: Package };
      default:
        return { text: t('product.contactForAvailability'), className: 'text-gray-600 bg-gray-50', icon: X };
    }
  };

  const handleAddToCart = async () => {
    if (!isShopifyConfigured) {
      alert('Shopping cart is not configured. Please check Shopify settings.');
      return;
    }

    if (!product) return;

    try {
      // For now, we'll need to get the Shopify variant ID
      const variantId = product.shopifyVariants[0]?.id;

      if (!variantId) {
        // Fallback: show success message for demo purposes
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
        return;
      }

      await addToCart(variantId, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this marine hardware: ${product.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Product URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Package className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>{t('product.notFound')}</h3>
          <p className='mt-1 text-sm text-gray-500'>
            {error || t('product.notFoundMessage')}
          </p>
          <div className='mt-6'>
            <Link
              href='/catalog'
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              {t('navigation.backToCatalog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availabilityStatus = getAvailabilityStatus(product.availability);
  const AvailabilityIcon = availabilityStatus.icon;
  const formattedPrice = formatPrice(product.priceDetails.basePrice);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Breadcrumb */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <nav className='flex' aria-label='Breadcrumb'>
            <ol className='flex items-center space-x-4'>
              <li>
                <Link href='/' className='text-gray-400 hover:text-gray-500'>
                  {t('navigation.home')}
                </Link>
              </li>
              <li>
                <div className='flex items-center'>
                  <ChevronRight className='flex-shrink-0 h-4 w-4 text-gray-300' />
                  <Link href='/catalog' className='ml-4 text-gray-400 hover:text-gray-500'>
                    {t('navigation.catalog')}
                  </Link>
                </div>
              </li>
              {product.categoryName && (
                <li>
                  <div className='flex items-center'>
                    <ChevronRight className='flex-shrink-0 h-4 w-4 text-gray-300' />
                    <span className='ml-4 text-gray-500'>{product.categoryName}</span>
                  </div>
                </li>
              )}
              <li>
                <div className='flex items-center'>
                  <ChevronRight className='flex-shrink-0 h-4 w-4 text-gray-300' />
                  <span className='ml-4 text-gray-500 truncate max-w-xs'>{product.title}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='lg:grid lg:grid-cols-12 lg:gap-8'>
          {/* Product Images - Left Side */}
          <div className='lg:col-span-5'>
            <ImageGallery
              images={product.images}
              productTitle={product.title}
              className='sticky top-8'
            />
          </div>

          {/* Product Information - Right Side */}
          <div className='lg:col-span-7 mt-8 lg:mt-0'>
            <div className='space-y-6'>
              {/* Product Header */}
              <div>
                {/* Vendor */}
                {product.vendor && (
                  <p className='text-sm text-blue-600 font-medium uppercase tracking-wide'>
                    {product.vendor}
                  </p>
                )}

                {/* Title */}
                <h1 className='text-3xl font-bold text-gray-900 mt-2'>{product.title}</h1>

                {/* SKU */}
                <p className='text-sm text-gray-500 mt-2'>
                  {t('product.sku')}: <span className='font-mono'>{product.sku}</span>
                </p>
              </div>

              {/* Price and Availability */}
              <div className='border-t border-gray-200 pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    {formattedPrice ? (
                      <div className='flex items-baseline space-x-2'>
                        <p className='text-3xl font-bold text-gray-900'>{formattedPrice}</p>
                        {product.priceDetails.retailPrice && 
                         product.priceDetails.retailPrice !== product.priceDetails.basePrice && (
                          <p className='text-lg text-gray-500 line-through'>
                            {formatPrice(product.priceDetails.retailPrice)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className='text-lg text-gray-600'>{t('product.priceOnRequest')}</p>
                    )}
                    {product.priceDetails.bulkPricingAvailable && (
                      <p className='text-sm text-blue-600 mt-1'>
                        {t('product.bulkPricingAvailable')}
                      </p>
                    )}
                  </div>

                  <div className='text-right'>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${availabilityStatus.className}`}>
                      <AvailabilityIcon className='h-4 w-4 mr-1' />
                      {availabilityStatus.text}
                    </div>
                    {product.availabilityDetails.leadTime && (
                      <p className='text-sm text-gray-500 mt-1'>
                        {t('product.leadTime')}: {product.availabilityDetails.leadTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Actions */}
              <div className='border-t border-gray-200 pt-6'>
                <div className='space-y-4'>
                  {/* Quantity and Add to Cart */}
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center'>
                      <label htmlFor='quantity' className='block text-sm font-medium text-gray-700 mr-3'>
                        {t('product.quantity')}:
                      </label>
                      <select
                        id='quantity'
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className='border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        {[1, 2, 3, 4, 5, 10, 20, 50].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!product.availabilityDetails.inStock}
                      className={`flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors ${
                        addedToCart
                          ? 'bg-green-600 hover:bg-green-700'
                          : product.availabilityDetails.inStock
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className='h-5 w-5 mr-2' />
                      {addedToCart ? t('product.addedToCart') : t('product.addToCart')}
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className='flex items-center space-x-4'>
                    <button
                      onClick={handleWishlistToggle}
                      className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md transition-colors ${
                        isWishlisted
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                      {isWishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
                    </button>

                    <Link
                      href={`/request-quote?sku=${product.sku}`}
                      className='flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                    >
                      <Quote className='h-4 w-4 mr-2' />
                      {t('product.requestQuote')}
                    </Link>

                    <button
                      onClick={handleShare}
                      className='inline-flex items-center justify-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                    >
                      <Share2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className='border-t border-gray-200 pt-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('product.description')}</h3>
                  <div className='prose prose-sm text-gray-600'>
                    <p>{product.description}</p>
                  </div>
                </div>
              )}

              {/* Quick Info Cards */}
              <div className='border-t border-gray-200 pt-6'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center'>
                      <Truck className='h-5 w-5 text-blue-600 mr-2' />
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{t('product.shipping')}</p>
                        <p className='text-xs text-gray-500'>{t('product.freeShippingOver100')}</p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center'>
                      <BarChart3 className='h-5 w-5 text-blue-600 mr-2' />
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{t('product.volume')}</p>
                        <p className='text-xs text-gray-500'>{t('product.contactForBulk')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className='mt-16'>
          {/* Tab Navigation */}
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('product.overview')}
              </button>
              {Object.keys(product.technicalSpecsByCategory).length > 0 && (
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'specs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('product.technicalSpecs')}
                </button>
              )}
              {product.catalogs.length > 0 && (
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'documents'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className='h-4 w-4 inline mr-1' />
                  {t('product.documents')}
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='mt-8'>
            {activeTab === 'overview' && (
              <div className='space-y-8'>
                {/* Related Products */}
                {product.relatedProducts.length > 0 && (
                  <RelatedProducts
                    products={product.relatedProducts}
                    currentProductSku={product.sku}
                  />
                )}
              </div>
            )}

            {activeTab === 'specs' && Object.keys(product.technicalSpecsByCategory).length > 0 && (
              <TechnicalSpecifications specifications={product.technicalSpecsByCategory} />
            )}

            {activeTab === 'documents' && product.catalogs.length > 0 && (
              <PDFCatalogViewer
                catalogs={product.catalogs}
                productTitle={product.title}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}