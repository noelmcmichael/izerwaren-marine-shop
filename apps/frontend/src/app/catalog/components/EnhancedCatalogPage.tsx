'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  Grid3X3,
  List,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';

import { ProductCard } from './ProductCard';
import { CatalogSEO } from './CatalogSEO';
import CategoryFilter from '../../../components/catalog/CategoryFilter';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { useToast } from '../../../components/shared/Toast';
import { apiClient } from '../../../lib/api-client';
import { resilientProductService } from '../../../services/resilient-products';

interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: string;
  availability?: string;
  categoryName?: string;
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

interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function CatalogContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { showToast } = useToast();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const subcategories = searchParams.get('subcategories');

  const fetchProducts = async (
    page = 1,
    search = '',
    categoryFilter = '',
    subCategoryFilter = ''
  ) => {
    try {
      setLoading(true);
      setError(null);

      let data: ProductsResponse;

      // Handle special categories
      if (categoryFilter === 'VARIANT_PRODUCTS' || categoryFilter === 'PDF_PRODUCTS') {
        data = await resilientProductService.getProductsByCategory(categoryFilter, page, 20);
      } else {
        // Regular products fetch with subcategory support
        const category = categoryFilter && categoryFilter !== 'ALL' ? categoryFilter : undefined;
        data = await resilientProductService.getProducts(
          page,
          20,
          search,
          category,
          subCategoryFilter
        );
      }

      // Transform products to match ProductCard interface
      const transformedProducts = data.data.map(product => ({
        ...product,
        images: product.images || [],
        shopifyVariants: product.shopifyVariants || [],
      }));

      setProducts(transformedProducts);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load products:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.failedToLoad');
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const subCategoryFilter = subcategories ? subcategories.split(',').join(',') : '';
    fetchProducts(1, searchQuery, category || '', subCategoryFilter);
  }, [category, subcategories, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const subCategoryFilter = subcategories ? subcategories.split(',').join(',') : '';
    fetchProducts(1, searchQuery, category || '', subCategoryFilter);
  };

  const handlePageChange = (page: number) => {
    const subCategoryFilter = subcategories ? subcategories.split(',').join(',') : '';
    fetchProducts(page, searchQuery, category || '', subCategoryFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    const subCategoryFilter = subcategories ? subcategories.split(',').join(',') : '';
    fetchProducts(currentPage, searchQuery, category || '', subCategoryFilter);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='bg-white border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex items-center text-sm text-gray-500 mb-4'>
              <Link href='/' className='hover:text-gray-700'>
                {tCommon('home')}
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>{t('title')}</span>
            </div>
            <div className='h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse'></div>
            <div className='h-4 bg-gray-200 rounded w-2/3 animate-pulse'></div>
          </div>
        </div>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>{t('errors.failedToLoad')}</h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={handleRetry}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            {tCommon('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CatalogSEO 
        products={products} 
        category={category} 
        totalProducts={pagination?.total || products.length} 
      />
      <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {/* Breadcrumb */}
          <div className='flex items-center text-sm text-gray-500 mb-4'>
            <Link href='/' className='hover:text-gray-700'>
              {tCommon('home')}
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>{t('title')}</span>
          </div>

          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                {category ? `${category}` : t('title')}
              </h1>
              <p className='text-gray-600 mb-4 lg:mb-0'>
                {category
                  ? `Browse our ${category.toLowerCase()} products`
                  : 'Browse our complete selection of marine hardware and supplies'}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className='flex-shrink-0'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </form>
          </div>

          {/* Filters and Controls */}
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mt-6 gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0'>
              <p className='text-gray-600 flex-shrink-0'>
                {pagination ? 
                  t('showing', {
                    start: (pagination.page - 1) * pagination.limit + 1,
                    end: Math.min(pagination.page * pagination.limit, pagination.total),
                    total: pagination.total
                  }) : 
                  t('resultsFound', { count: products.length })
                }
              </p>

              {/* Category Filter */}
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='lg:hidden flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
                >
                  <Filter className='h-4 w-4 mr-2' />
                  {t('filterBy')}
                </button>
                <div className='hidden lg:block'>
                  <CategoryFilter
                    onCategoryChange={() => {
                      // The CategoryFilter component handles URL updates
                      // We don't need to do anything here since useEffect will trigger fetchProducts
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='flex rounded-md border border-gray-300'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={t('gridView')}
                >
                  <Grid3X3 className='h-5 w-5' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={t('listView')}
                >
                  <List className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      {showFilters && (
        <div className='lg:hidden bg-white border-b border-gray-200 p-4'>
          <CategoryFilter
            onCategoryChange={() => setShowFilters(false)}
            disabled={loading}
          />
        </div>
      )}

      {/* Products */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {products.length === 0 ? (
          <div className='text-center py-12'>
            <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>{t('noResults')}</h3>
            <p className='text-gray-600'>{t('errors.tryAgain')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {products.map(product => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className='space-y-4'>
            {products.map(product => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='mt-8 flex items-center justify-center space-x-2'>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                pagination.hasPreviousPage
                  ? 'bg-white border text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className='h-4 w-4' />
              <span>{t('previousPage')}</span>
            </button>

            <div className='flex space-x-1'>
              {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
                let pageNum;
                if (pagination.totalPages <= 7) {
                  pageNum = i + 1;
                } else if (pagination.page <= 4) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 3) {
                  pageNum = pagination.totalPages - 6 + i;
                } else {
                  pageNum = pagination.page - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                pagination.hasNextPage
                  ? 'bg-white border text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{t('nextPage')}</span>
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default function EnhancedCatalogPage() {
  const tCommon = useTranslations('common');
  
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <LoadingSpinner size="large" />
            <p className='text-gray-600 mt-4'>{tCommon('loading')}</p>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}