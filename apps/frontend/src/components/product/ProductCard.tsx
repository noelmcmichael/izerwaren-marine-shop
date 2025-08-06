import { Product, MediaAsset, formatPrice } from '../../lib/types';
import Link from 'next/link';

import { ProductCardImage } from '../shared/ShopifyImage';

interface ProductCardProps {
  product: Product;
  primaryImage?: MediaAsset;
  className?: string;
  showAddToQuote?: boolean; // Controls whether to show "Add to Quote" button
}

export default function ProductCard({
  product,
  primaryImage,
  className = '',
  showAddToQuote = true,
}: ProductCardProps) {
  const productUrl = `/product/${product.sku}`;

  return (
    <div
      className={`border border-marine-200 rounded-lg overflow-hidden hover:shadow-luxury transition-all duration-300 hover:border-marine-300 bg-white ${className}`}
    >
      <Link href={productUrl}>
        <div className='aspect-square relative bg-yacht-100'>
          <ProductCardImage
            src={primaryImage?.file_url || ''}
            alt={product.title}
            className='object-cover'
          />
        </div>
      </Link>

      <div className='p-4'>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1'>
            <Link href={productUrl}>
              <h3 className='font-medium text-navy-900 hover:text-marine-600 transition-colors'>
                {product.title}
              </h3>
            </Link>
            <p className='text-sm text-gray-500'>{product.sku}</p>
          </div>
          <div className='ml-4'>
            <p className='text-lg font-semibold text-gray-900'>{formatPrice(product.price)}</p>
          </div>
        </div>

        {product.description && (
          <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{product.description}</p>
        )}

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-marine-100 text-marine-800'>
              {product.category_name}
            </span>
            {product.manufacturer && (
              <span className='text-xs text-gray-500'>{product.manufacturer}</span>
            )}
          </div>

          <div className='flex items-center space-x-1'>
            {product.status === 'active' ? (
              <span className='inline-flex items-center text-xs text-green-700 font-medium'>
                <div className='w-2 h-2 bg-green-500 rounded-full mr-1'></div>
                In Stock
              </span>
            ) : (
              <span className='inline-flex items-center text-xs text-navy-500 font-medium'>
                <div className='w-2 h-2 bg-navy-400 rounded-full mr-1'></div>
                {product.status === 'draft' ? 'Coming Soon' : 'Unavailable'}
              </span>
            )}
          </div>
        </div>

        <div className='mt-4 flex space-x-2'>
          <Link
            href={productUrl}
            className={`${showAddToQuote ? 'flex-1' : 'w-full'} bg-marine-gradient text-white text-center py-2.5 px-4 rounded-md text-sm font-semibold hover:from-marine-600 hover:to-marine-700 transition-all duration-200 shadow-marine`}
          >
            View Details
          </Link>
          {showAddToQuote && (
            <button className='px-4 py-2.5 border border-marine-300 rounded-md text-sm font-semibold text-marine-700 hover:bg-marine-50 hover:border-marine-400 transition-all duration-200'>
              Add to Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
