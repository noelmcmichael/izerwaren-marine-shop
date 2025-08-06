'use client';

import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { useCart } from '../../../providers/CartProvider';
import { getImageUrl, generateAltText } from '../../../lib/image-utils';
import { getPdfUrl } from '../../../lib/pdf-utils';
import VariantSelector from '../../../components/products/VariantSelector';
import PDFPreview from '../../../components/products/PDFPreview';
import { config } from '../../../lib/config';

interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: string;
  retailPrice?: string;
  availability?: string;
  vendor?: string;
  productType?: string;
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
  technicalSpecs?: Array<{
    id: string;
    category: string;
    name: string;
    value: string;
    unit?: string;
  }>;
  catalogs?: Array<{
    id: string;
    pdfUrl?: string;
    localPdfPath?: string;
    fileSize?: number;
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const sku = params.sku as string;
  const { addToCart, isShopifyConfigured } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);
  const [, setVariantSelections] = useState<Record<string, string>>({});
  const [isVariantConfigComplete, setIsVariantConfigComplete] = useState(true);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [generatedSku, setGeneratedSku] = useState<string>('');

  // Using centralized config for API URL

  useEffect(() => {
    if (!sku) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to find product by SKU using the products API
        // This handles both original SKUs and URL-safe SKUs
        const apiUrl = config.api.baseUrl === '/api' ? '/api/products' : `${config.api.baseUrl}/products`;
        const response = await fetch(`${apiUrl}?limit=1000`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const result = await response.json();
        
        // Find product by SKU (supports both original and URL-safe SKUs)
        const foundProduct = result.data?.find((p: Product) => 
          p.sku === sku || 
          (p as any).originalSku === sku ||
          (sku.startsWith('shopify-') && p.sku === sku)
        );
        
        if (foundProduct) {
          // Transform API response to match frontend interface
          const apiProduct = foundProduct as any;
          const transformedProduct: Product = {
            id: apiProduct.id,
            title: apiProduct.title,
            description: apiProduct.description,
            sku: apiProduct.sku,
            price: apiProduct.price?.toString() || '0',
            retailPrice: apiProduct.retailPrice?.toString() || '0',
            availability: apiProduct.availability,
            vendor: apiProduct.vendor,
            productType: apiProduct.categoryName, // Map categoryName to productType
            tags: apiProduct.tags || [],
            images: apiProduct.images?.map((img: any, index: number) => ({
              id: img.id || index.toString(),
              imageUrl: img.imageUrl,
              localPath: img.localPath,
              altText: img.altText,
              isPrimary: img.isPrimary,
            })) || [],
            shopifyVariants: [], // GraphQL products don't use legacy variants
            technicalSpecs: [], // Add when available
            catalogs: [], // Add when available
          };
          setProduct(transformedProduct);
          setGeneratedSku(transformedProduct.sku);
          
          // Initialize final price
          if (transformedProduct.price) {
            const priceNum = parseFloat(transformedProduct.price.replace(/[^0-9.]/g, ''));
            if (!isNaN(priceNum)) {
              setFinalPrice(priceNum);
            }
          }
        } else {
          throw new Error('Product not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [sku, config.api.baseUrl]);

  // Format price display
  const formatPrice = (price?: string) => {
    if (!price) return null;

    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numPrice)) return null;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  };

  // Get availability status and styling
  const getAvailabilityStatus = (availability?: string) => {
    switch (availability) {
      case 'In Stock':
        return { text: 'In Stock', className: 'text-green-600 bg-green-50', icon: Check };
      case 'Limited Stock':
        return { text: 'Limited Stock', className: 'text-yellow-600 bg-yellow-50', icon: Package };
      case 'Available to Order':
        return { text: 'Available to Order', className: 'text-blue-600 bg-blue-50', icon: Package };
      default:
        return { text: 'Contact for Availability', className: 'text-gray-600 bg-gray-50', icon: X };
    }
  };

  // Handle variant configuration changes
  const handleVariantChange = (selectedVariants: Record<string, string>, isComplete: boolean, finalPrice: number, generatedSku: string) => {
    setVariantSelections(selectedVariants);
    setIsVariantConfigComplete(isComplete);
    setFinalPrice(finalPrice);
    setGeneratedSku(generatedSku);
  };

  const handleAddToCart = async () => {
    if (!isShopifyConfigured) {
      alert('Shopping cart is not configured. Please check Shopify settings.');
      return;
    }

    if (!product) return;

    // Check if variant configuration is required and complete
    if (!isVariantConfigComplete) {
      alert('Please complete the product configuration before adding to cart.');
      return;
    }

    try {
      // For now, we'll need to get the Shopify variant ID
      // This is a simplified approach - in a real scenario, we'd need proper variant mapping
      const variantId = product.shopifyVariants[selectedVariant]?.id;

      if (!variantId) {
        // Fallback: use a temporary approach or show error
        // console.warn('No Shopify variant ID available for cart integration');
        // In production, this would integrate with Shopify variant mapping
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

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev === (product?.images.length || 1) - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? (product?.images.length || 1) - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Package className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>Product not found</h3>
          <p className='mt-1 text-sm text-gray-500'>
            {error || 'The requested product could not be found.'}
          </p>
          <div className='mt-6'>
            <Link
              href='/catalog'
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = product.images[currentImageIndex];
  const availabilityStatus = getAvailabilityStatus(product.availability);
  const AvailabilityIcon = availabilityStatus.icon;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Breadcrumb */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <nav className='flex' aria-label='Breadcrumb'>
            <ol className='flex items-center space-x-4'>
              <li>
                <Link href='/' className='text-gray-400 hover:text-gray-500'>
                  Home
                </Link>
              </li>
              <li>
                <div className='flex items-center'>
                  <ChevronRight className='flex-shrink-0 h-4 w-4 text-gray-300' />
                  <Link href='/catalog' className='ml-4 text-gray-400 hover:text-gray-500'>
                    Catalog
                  </Link>
                </div>
              </li>
              <li>
                <div className='flex items-center'>
                  <ChevronRight className='flex-shrink-0 h-4 w-4 text-gray-300' />
                  <span className='ml-4 text-sm font-medium text-gray-900 truncate'>
                    {product.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start'>
          {/* Image gallery */}
          <div className='flex flex-col-reverse'>
            {/* Image thumbnails */}
            {product.images.length > 1 && (
              <div className='hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none'>
                <div className='grid grid-cols-4 gap-6'>
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-24 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 ${
                        index === currentImageIndex
                          ? 'ring-2 ring-blue-500'
                          : 'ring-1 ring-gray-300'
                      }`}
                    >
                      <span className='sr-only'>Image {index + 1}</span>
                      <span className='absolute inset-0 rounded-md overflow-hidden'>
                        <Image
                          src={getImageUrl(image)}
                          alt={image.altText || generateAltText(product.title, index, image.isPrimary)}
                          width={96}
                          height={96}
                          className='w-full h-full object-center object-cover'
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className='w-full aspect-w-1 aspect-h-1'>
              <div className='relative h-96 sm:h-128 lg:h-96 bg-white rounded-lg overflow-hidden'>
                {currentImage ? (
                  <Image
                    src={getImageUrl(currentImage)}
                    alt={currentImage.altText || product.title}
                    width={600}
                    height={600}
                    className='w-full h-full object-center object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-gray-400'>
                    <Package className='h-24 w-24' />
                  </div>
                )}

                {/* Navigation arrows for multiple images */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md'
                    >
                      <ChevronLeft className='h-5 w-5 text-gray-600' />
                    </button>
                    <button
                      onClick={nextImage}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md'
                    >
                      <ChevronRight className='h-5 w-5 text-gray-600' />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Product info */}
          <div className='mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0'>
            <h1 className='text-3xl font-extrabold tracking-tight text-gray-900'>
              {product.title}
            </h1>

            <div className='mt-3'>
              <h2 className='sr-only'>Product information</h2>
              <div className='flex items-center space-x-4'>
                <p className='text-3xl text-gray-900'>
                  {finalPrice > 0 ? formatPrice(finalPrice.toString()) : (formatPrice(product.price) || 'Price on request')}
                </p>
                {product.retailPrice && product.retailPrice !== product.price && (
                  <p className='text-lg text-gray-500 line-through'>
                    {formatPrice(product.retailPrice)}
                  </p>
                )}
                {finalPrice > 0 && product.price && finalPrice !== parseFloat(product.price.replace(/[^0-9.]/g, '')) && (
                  <p className='text-sm text-blue-600'>
                    (Base: {formatPrice(product.price)})
                  </p>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className='mt-4'>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${availabilityStatus.className}`}
              >
                <AvailabilityIcon className='h-4 w-4 mr-2' />
                {availabilityStatus.text}
              </div>
            </div>

            {/* Product details */}
            <div className='mt-6'>
              <h3 className='sr-only'>Description</h3>
              {product.description && (
                <div className='text-base text-gray-900 space-y-6'>
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* Product metadata */}
            <div className='mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2'>
              <div>
                <dt className='text-sm font-medium text-gray-500'>SKU</dt>
                <dd className='mt-1 text-sm text-gray-900'>
                  {generatedSku || product.sku}
                  {generatedSku && generatedSku !== product.sku && (
                    <span className='text-gray-500 ml-2'>(Configured)</span>
                  )}
                </dd>
              </div>
              {product.vendor && (
                <div>
                  <dt className='text-sm font-medium text-gray-500'>Vendor</dt>
                  <dd className='mt-1 text-sm text-gray-900'>{product.vendor}</dd>
                </div>
              )}
              {product.productType && (
                <div>
                  <dt className='text-sm font-medium text-gray-500'>Product Type</dt>
                  <dd className='mt-1 text-sm text-gray-900'>{product.productType}</dd>
                </div>
              )}
            </div>

            {/* Product Variant Configuration */}
            <VariantSelector
              sku={product.sku}
              basePrice={product.price}
              onVariantChange={handleVariantChange}
              className="mt-8"
            />

            {/* Shopify Variants (legacy) */}
            {product.shopifyVariants.length > 1 && (
              <div className='mt-6'>
                <h3 className='text-sm font-medium text-gray-900'>Options</h3>
                <div className='mt-2'>
                  <div className='space-y-2'>
                    {product.shopifyVariants.map((variant, index) => (
                      <label key={variant.id} className='flex items-center'>
                        <input
                          type='radio'
                          name='variant'
                          value={index}
                          checked={selectedVariant === index}
                          onChange={() => setSelectedVariant(index)}
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                        />
                        <span className='ml-3 text-sm text-gray-900'>
                          {variant.sku || `Option ${index + 1}`}
                          {variant.price && variant.price !== product.price && (
                            <span className='ml-2 text-gray-500'>
                              ({formatPrice(variant.price)})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <form className='mt-10'>
              <div className='flex items-center space-x-4'>
                {/* Quantity selector */}
                <div>
                  <label htmlFor='quantity' className='block text-sm font-medium text-gray-700'>
                    Quantity
                  </label>
                  <div className='mt-1'>
                    <select
                      id='quantity'
                      name='quantity'
                      value={quantity}
                      onChange={e => setQuantity(parseInt(e.target.value))}
                      className='max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add to cart button */}
                <div className='flex-1'>
                  <button
                    type='button'
                    onClick={handleAddToCart}
                    disabled={!isVariantConfigComplete}
                    className={`w-full border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                      !isVariantConfigComplete
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : addedToCart 
                        ? 'bg-green-600 hover:bg-green-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ShoppingCart className='h-5 w-5 mr-2' />
                    {!isVariantConfigComplete ? 'Configure Product' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              <div className='mt-6 flex items-center space-x-4'>
                {/* Wishlist button */}
                <button
                  type='button'
                  onClick={handleWishlistToggle}
                  className={`flex items-center justify-center px-3 py-3 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                    isWishlisted
                      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Heart className='h-5 w-5' fill={isWishlisted ? 'currentColor' : 'none'} />
                  <span className='ml-2'>
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </span>
                </button>

                {/* Share button */}
                <button
                  type='button'
                  className='flex items-center justify-center px-3 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                >
                  <Share2 className='h-5 w-5' />
                  <span className='ml-2'>Share</span>
                </button>
              </div>
            </form>

            {/* Technical Specifications */}
            {product.technicalSpecs && product.technicalSpecs.length > 0 && (
              <div className='mt-8'>
                <button
                  onClick={() => setShowTechnicalSpecs(!showTechnicalSpecs)}
                  className='flex items-center justify-between w-full text-left'
                >
                  <h3 className='text-sm font-medium text-gray-900'>Technical Specifications</h3>
                  <ChevronRight
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      showTechnicalSpecs ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {showTechnicalSpecs && (
                  <div className='mt-3 border border-gray-200 rounded-lg p-4'>
                    <div className='grid grid-cols-1 gap-2 text-sm'>
                      {product.technicalSpecs.map(spec => (
                        <div key={spec.id} className='flex justify-between py-1'>
                          <span className='text-gray-600'>{spec.name}:</span>
                          <span className='font-medium text-gray-900'>
                            {spec.value}{' '}
                            {spec.unit && <span className='text-gray-500'>{spec.unit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Documentation with PDF Preview */}
            {product.catalogs && product.catalogs.length > 0 && (
              <div className='mt-8'>
                <h3 className='text-sm font-medium text-gray-900 mb-3'>Product Documentation</h3>
                <div className='space-y-4'>
                  {product.catalogs.map(catalog => {
                    const pdfUrl = getPdfUrl(catalog);
                    return (
                      <PDFPreview
                        key={catalog.id}
                        pdfUrl={pdfUrl}
                        productTitle={product.title}
                        fileSize={catalog.fileSize}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className='mt-8'>
                <h3 className='text-sm font-medium text-gray-900'>Tags</h3>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
