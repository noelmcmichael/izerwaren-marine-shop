/**
 * Algolia Search Configuration
 * Task 9.4: Algolia Search Integration
 * 
 * This module provides Algolia client configuration and search utilities
 * for the Izerwaren B2B platform product search functionality.
 */

import algoliasearch from 'algoliasearch/lite';

// Environment validation
const requiredEnvVars = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  searchKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME,
} as const;

// Validate environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(
    `[Algolia Config] Missing environment variables: ${missingVars.join(', ')}. ` +
    'Search functionality will be limited to basic API search.'
  );
}

// Algolia client configuration
export const algoliaConfig = {
  appId: requiredEnvVars.appId || '',
  searchKey: requiredEnvVars.searchKey || '',
  indexName: requiredEnvVars.indexName || 'products_production',
  isConfigured: missingVars.length === 0,
} as const;

// Create Algolia search client (only if properly configured)
export const searchClient = algoliaConfig.isConfigured 
  ? algoliasearch(algoliaConfig.appId, algoliaConfig.searchKey)
  : null;

// Search index reference
export const productsIndex = searchClient?.initIndex(algoliaConfig.indexName) ?? null;

// Search configuration constants
export const searchConfig = {
  // Search UI settings
  hitsPerPage: 20,
  maxFacetValues: 10,
  
  // Search behavior
  typoTolerance: 'min',
  queryType: 'prefixLast',
  removeWordsIfNoResults: 'lastWords',
  
  // Facet configuration
  facetFilters: [],
  numericFilters: [],
  
  // Response configuration
  attributesToHighlight: ['title', 'description', 'sku'],
  attributesToSnippet: ['description:50'],
  
  // Performance settings
  timeout: 5000,
  
  // Pagination
  maxPages: 50,
} as const;

// Search facets configuration for B2B filtering
export const searchFacets = {
  // Category facets
  hierarchicalCategories: ['categoryName', 'subcategoryName'],
  
  // Product attributes
  refinementList: [
    'vendor',
    'availability',
    'specifications.material',
    'specifications.size',
    'specifications.type',
  ],
  
  // Numeric ranges
  numericMenu: [
    {
      attribute: 'price',
      items: [
        { label: 'Under $50', end: 50 },
        { label: '$50 - $100', start: 50, end: 100 },
        { label: '$100 - $500', start: 100, end: 500 },
        { label: '$500 - $1000', start: 500, end: 1000 },
        { label: 'Over $1000', start: 1000 },
      ],
    },
  ],
  
  // Range sliders
  rangeInput: ['price'],
} as const;

// Helper function to check if Algolia is available
export const isAlgoliaEnabled = (): boolean => {
  return algoliaConfig.isConfigured && searchClient !== null;
};

// Helper function to build search state
export const buildSearchState = (query: string, filters: Record<string, unknown> = {}) => {
  const searchState: Record<string, unknown> = {
    query,
    page: 0,
    hitsPerPage: searchConfig.hitsPerPage,
  };

  // Add facet filters
  if (filters.categories?.length) {
    searchState.hierarchicalMenu = {
      'categoryName': filters.categories,
    };
  }

  if (filters.vendors?.length) {
    searchState.refinementList = {
      vendor: filters.vendors,
    };
  }

  if (filters.availability?.length) {
    searchState.refinementList = {
      ...searchState.refinementList,
      availability: filters.availability,
    };
  }

  // Add numeric filters
  if (filters.priceRange) {
    searchState.range = {
      price: `${filters.priceRange.min}:${filters.priceRange.max}`,
    };
  }

  return searchState;
};

// Search analytics helper
export const trackSearch = (query: string, results: number) => {
  if (typeof window !== 'undefined' && isAlgoliaEnabled()) {
    // Track search analytics (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Search Analytics] Query: "${query}", Results: ${results}`);
    }
    
    // In production, this would send to analytics service
    // Example: analytics.track('search', { query, results });
  }
};

// Search error handler
export const handleSearchError = (error: Error, query: string) => {
  console.error(`[Algolia Search] Error searching for "${query}":`, error);
  
  // In production, this would report to error monitoring
  // Example: errorMonitoring.captureException(error, { query });
  
  return {
    error: 'Search temporarily unavailable. Please try again.',
    fallbackToBasicSearch: true,
  };
};

// Type definitions for search results
export interface SearchHit {
  objectID: string;
  title: string;
  description?: string;
  sku: string;
  price: number;
  categoryName: string;
  subcategoryName?: string;
  vendor: string;
  availability: string;
  specifications: Record<string, unknown>;
  images?: Array<{
    imageUrl: string;
    isPrimary: boolean;
  }>;
  _highlightResult?: {
    title?: { value: string; matchLevel: string };
    description?: { value: string; matchLevel: string };
    sku?: { value: string; matchLevel: string };
  };
}

export interface SearchState {
  query: string;
  page: number;
  hitsPerPage: number;
  filters?: Record<string, unknown>;
  sortBy?: string;
}

export interface SearchResponse {
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  facets?: Record<string, Record<string, number>>;
}

const algoliaUtils = {
  searchClient,
  productsIndex,
  algoliaConfig,
  searchConfig,
  searchFacets,
  isAlgoliaEnabled,
  buildSearchState,
  trackSearch,
  handleSearchError,
};

export default algoliaUtils;