/**
 * Search Components Index
 * Task 9.4: Algolia Search Integration
 * 
 * Exports all search-related components for easy importing
 */

export { SearchBox as default } from './SearchBox';
export { SearchResults } from './SearchResults';
export { SearchFilters } from './SearchFilters';
export { SearchStats } from './SearchStats';
export { SearchPagination } from './SearchPagination';
export { BasicSearchFallback } from './BasicSearchFallback';

// Re-export hooks
export { useSearchAnalytics } from '../hooks/useSearchAnalytics';

// Re-export configuration
export { 
  searchClient, 
  isAlgoliaEnabled, 
  algoliaConfig,
  searchConfig,
  searchFacets 
} from '@/lib/algolia-config';