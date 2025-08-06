/**
 * Enhanced Search Page with Algolia InstantSearch Integration
 * Task 9.4: Algolia Search Integration
 * 
 * Provides advanced search capabilities with real-time results,
 * faceted filtering, and comprehensive analytics tracking
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { InstantSearch } from 'react-instantsearch';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Algolia configuration and components
import { searchClient, isAlgoliaEnabled, algoliaConfig } from '@/lib/algolia-config';
import SearchBox from './components/SearchBox';
import SearchResults from './components/SearchResults';
import SearchFilters from './components/SearchFilters';
import SearchStats from './components/SearchStats';
import SearchPagination from './components/SearchPagination';
import { useSearchAnalytics } from './hooks/useSearchAnalytics';
import RecentlyViewed from '@/components/RecentlyViewed';

// Fallback to basic search if Algolia is not configured
import { BasicSearchFallback } from './components/BasicSearchFallback';

interface SearchPageContentProps {
  initialQuery?: string;
}

function SearchPageContent({ initialQuery = '' }: SearchPageContentProps) {
  const t = useTranslations('search');
  const [showFilters, setShowFilters] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  
  // Initialize search analytics
  const { trackClick } = useSearchAnalytics({
    enabled: isAlgoliaEnabled(),
  });

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    setCurrentQuery(query);
    // Update URL without page reload
    const newUrl = query 
      ? `/search?q=${encodeURIComponent(query)}` 
      : '/search';
    window.history.pushState({}, '', newUrl);
  };

  // Handle product click with analytics
  const handleProductClick = (hit: { objectID: string; __position?: number }) => {
    trackClick(hit.objectID, hit.__position || 0, currentQuery);
  };

  // If Algolia is not configured, show fallback
  if (!isAlgoliaEnabled()) {
    return <BasicSearchFallback initialQuery={initialQuery} />;
  }

  return (
    <InstantSearch
      searchClient={searchClient!}
      indexName={algoliaConfig.indexName}
      initialUiState={{
        [algoliaConfig.indexName]: {
          query: initialQuery,
        },
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Link 
                href="/" 
                className="hover:text-gray-700 transition-colors duration-200"
              >
                {t('navigation.home', 'Home')}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">
                {t('results.searchResults', 'Search Results')}
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex gap-4 items-start">
              <div className="flex-1 max-w-3xl">
                <SearchBox
                  placeholder={t('placeholder')}
                  showRecentSearches={true}
                  onSearchSubmit={handleSearchSubmit}
                />
              </div>
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t('filters.filters', 'Filters')}
                </span>
              </button>
            </div>

            {/* Search Stats */}
            <div className="mt-4">
              <SearchStats
                showTiming={true}
                showQuery={true}
                query={currentQuery}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className={`
              ${showFilters ? 'block' : 'hidden'} lg:block
              w-full lg:w-80 flex-shrink-0
              ${showFilters ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:relative lg:bg-transparent' : ''}
            `}>
              {/* Mobile Filter Overlay */}
              {showFilters && (
                <div 
                  className="lg:hidden absolute inset-0"
                  onClick={() => setShowFilters(false)}
                />
              )}
              
              {/* Filter Panel */}
              <div className={`
                bg-white lg:bg-transparent h-full lg:h-auto
                ${showFilters ? 'w-80 p-0 lg:p-0' : ''}
                ${showFilters ? 'ml-auto lg:ml-0' : ''}
                lg:sticky lg:top-32
              `}>
                <SearchFilters
                  isOpen={true}
                  onToggle={() => setShowFilters(false)}
                  className="h-full lg:h-auto"
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 min-w-0">
              <SearchResults
                defaultView="grid"
                showViewToggle={true}
                onProductClick={handleProductClick}
                className="mb-8"
              />
              
              {/* Recently Viewed Products */}
              <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                <RecentlyViewed
                  maxItems={8}
                  showTitle={true}
                  showClearButton={true}
                  className=""
                />
              </div>
              
              {/* Pagination */}
              <div className="flex justify-center">
                <SearchPagination
                  showLabels={true}
                  maxPages={7}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstantSearch>
  );
}



function SearchPageWithParams() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return <SearchPageContent initialQuery={initialQuery} />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchPageWithParams />
    </Suspense>
  );
}
