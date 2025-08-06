'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

import { Product, MediaAsset } from '../../lib/types';

import ProductCard from '@/components/product/ProductCard';
import { resilientProductService } from '@/services/resilient-products';
import { shopifyDirectService } from '@/services/shopify-direct';
import { shopifyLiveService } from '@/services/shopify-live';

// Legacy API interface - removed to reduce unused code
// Will be re-added when backend API is integrated

// Product from resilient service
interface ResilientProduct {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price: string;
  retailPrice: string;
  categoryName: string;
  availability: string;
  imageCount: number;
  primaryImagePath?: string;
  images?: Array<{
    imageUrl?: string;
    localPath?: string;
    isPrimary: boolean;
  }>;
}

// Legacy transform function - removed to fix linting
// Will be re-added when backend API is integrated

// Transform resilient service product to frontend format
function transformResilientProduct(resilientProduct: ResilientProduct): Product {
  return {
    id: parseInt(resilientProduct.id, 10),
    title: resilientProduct.title,
    description: resilientProduct.description || '',
    price: parseFloat(resilientProduct.price),
    category_name: resilientProduct.categoryName,
    manufacturer: 'Unknown', // Not available in resilient format
    sku: resilientProduct.sku,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Extract primary image from resilient service product
function getResilientPrimaryImage(resilientProduct: ResilientProduct): MediaAsset | undefined {
  if (resilientProduct.primaryImagePath || resilientProduct.images?.[0]) {
    const imageUrl =
      resilientProduct.primaryImagePath ||
      resilientProduct.images?.find(img => img.isPrimary)?.imageUrl ||
      resilientProduct.images?.[0]?.imageUrl;

    if (imageUrl) {
      return {
        id: 0, // Temporary ID for display
        local_product_id: parseInt(resilientProduct.id, 10),
        asset_type: 'primary',
        storage_tier: 'local',
        file_url: imageUrl,
        mime_type: 'image/jpeg',
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }
  return undefined;
}

// Legacy image extraction function - removed to fix linting
// Will be re-added when backend API is integrated

interface FeaturedProductsProps {
  className?: string;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ className = '' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [primaryImages, setPrimaryImages] = useState<(MediaAsset | undefined)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsLiveData(false);

        console.log('🔴 Attempting LIVE Shopify connection with enhanced service...');

        // Try our new proven live service first
        try {
          const liveProducts = await shopifyLiveService.getFeaturedProducts();

          if (liveProducts.length > 0) {
            console.log(`✅ SUCCESS! Loaded ${liveProducts.length} LIVE products from Shopify`);

            // Create MediaAsset objects for the first product image (if available)
            const liveImages = liveProducts.map(product => {
              // Check if the product has Shopify images available
              if (product.shopify_id) {
                // For now, return undefined to let ProductCard handle the image gracefully
                // In the future, we could fetch the actual Shopify image URLs here
                return undefined;
              }
              return undefined;
            });

            setProducts(liveProducts);
            setPrimaryImages(liveImages);
            setIsLiveData(true);
            setError(null);
            return;
          }
        } catch (liveError) {
          console.warn('⚠️ Enhanced live service failed, trying direct service...', liveError);
        }

        // Fallback to direct Shopify service
        const connectionTest = await shopifyDirectService.testConnection();

        if (connectionTest.success) {
          console.log('✅ Direct Shopify connection successful!');

          // Get featured products directly from Shopify
          const shopifyFeatured = await shopifyDirectService.getFeaturedProducts();

          if (shopifyFeatured.length > 0) {
            console.log(`✅ Loaded ${shopifyFeatured.length} products from direct Shopify`);

            // Transform Shopify products to our format
            const transformedProducts = shopifyFeatured.slice(0, 3).map(shopifyProduct => {
              const transformed = shopifyDirectService.transformProduct(shopifyProduct);
              return {
                id: transformed.id,
                title: transformed.title,
                description: transformed.description,
                price: transformed.price,
                category_name: transformed.category_name,
                manufacturer: transformed.manufacturer,
                sku: transformed.sku,
                status: transformed.status,
                created_at: transformed.created_at,
                updated_at: transformed.updated_at,
              };
            });

            // Extract primary images
            const transformedImages = shopifyFeatured.slice(0, 3).map(shopifyProduct => {
              const image = shopifyProduct.images?.[0];
              return image
                ? {
                    id: 0,
                    local_product_id: parseInt(
                      shopifyProduct.id.replace('gid://shopify/Product/', ''),
                      10
                    ),
                    asset_type: 'primary' as const,
                    storage_tier: 'shopify' as const,
                    file_url: image.url,
                    mime_type: 'image/jpeg',
                    created_at: new Date(),
                    updated_at: new Date(),
                  }
                : undefined;
            });

            setProducts(transformedProducts);
            setPrimaryImages(transformedImages);
            setIsLiveData(true);
            setError(null);
            return;
          }
        } else {
          console.warn(
            '⚠️ Direct Shopify connection failed, trying resilient service...',
            connectionTest.error
          );
        }

        // Fallback to resilient service
        const categories = ['MARINE LOCKS', 'MARINE GRADE HINGES', 'HATCH AND DECK HARDWARE'];
        const apiProducts = await resilientProductService.getFeaturedProducts(categories);

        if (apiProducts.length > 0) {
          // Transform to frontend format (using resilient service format)
          const transformedProducts = apiProducts.slice(0, 3).map(transformResilientProduct);
          const transformedImages = apiProducts.slice(0, 3).map(getResilientPrimaryImage);

          setProducts(transformedProducts);
          setPrimaryImages(transformedImages);
          setError('Using cached data - live connection unavailable');
        } else {
          throw new Error('No featured products available');
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError('Failed to load featured products');

        // Fallback to sample data
        const fallbackProducts: Product[] = [
          {
            id: 1,
            title: 'Marine Grade Mortise Lock',
            description: 'High-quality stainless steel mortise lock for marine applications.',
            price: 189.99,
            category_name: 'Marine Locks',
            manufacturer: 'GSV',
            sku: 'GSV-ML-55',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 2,
            title: 'Stainless Steel Deck Hinge',
            description: 'Heavy-duty deck hinge with corrosion resistance.',
            price: 45.99,
            category_name: 'Hinges',
            manufacturer: 'Izerwaren',
            sku: 'IZW-DH-316',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: 3,
            title: 'Waterproof Hatch Fastener',
            description: 'Premium waterproof hatch fastener with cam operation.',
            price: 78.5,
            category_name: 'Hatch Hardware',
            manufacturer: 'Marine Pro',
            sku: 'MP-HF-WP',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];

        setProducts(fallbackProducts);
        setPrimaryImages([undefined, undefined, undefined]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className={`py-16 bg-gray-50 ${className}`}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>Featured Products</h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Discover our top-quality marine hardware solutions trusted by professionals worldwide
            </p>
          </div>
          <div className='flex justify-center items-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
            <span className='ml-2 text-gray-600'>Loading featured products...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>Featured Products</h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Discover our top-quality marine hardware solutions trusted by professionals worldwide
          </p>
          {error ? (
            <p className='text-sm text-amber-600 mt-2'>* {error}</p>
          ) : isLiveData ? (
            <p className='text-sm text-green-600 mt-2 font-semibold animate-pulse'>
              🔴 LIVE - Connected to izerw-marine.myshopify.com (956+ products available)
            </p>
          ) : (
            <p className='text-sm text-blue-600 mt-2'>Loading live data from Shopify...</p>
          )}
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryImage={primaryImages[index]}
              className='h-full'
              showAddToQuote={false}
            />
          ))}

          {/* Placeholder for more products */}
          <div className='bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500'>
            <div className='text-4xl mb-2'>📦</div>
            <p className='text-center font-medium mb-2'>1000+ More Products</p>
            <p className='text-sm text-center text-gray-400 mb-4'>Available in our catalog</p>
            <Link
              href='/catalog'
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200'
            >
              Browse Catalog
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </div>
        </div>

        <div className='text-center'>
          <Link
            href='/catalog'
            className='inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200'
          >
            View All Products
            <ArrowRight className='ml-2 h-5 w-5' />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
