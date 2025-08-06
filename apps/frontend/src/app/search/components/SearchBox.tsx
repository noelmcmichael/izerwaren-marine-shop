/**
 * Enhanced SearchBox Component with Algolia InstantSearch
 * Task 9.4: Algolia Search Integration
 * 
 * Provides real-time search with autocomplete, keyboard navigation,
 * and seamless integration with InstantSearch.js
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchBox, UseSearchBoxProps } from 'react-instantsearch';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchBoxProps extends UseSearchBoxProps {
  placeholder?: string;
  className?: string;
  showRecentSearches?: boolean;
  maxRecentSearches?: number;
  onSearchSubmit?: (query: string) => void;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

export function SearchBox({
  placeholder,
  className = '',
  showRecentSearches = true,
  maxRecentSearches = 5,
  onSearchSubmit,
  ...props
}: SearchBoxProps) {
  const t = useTranslations('search');
  const { query, refine, isSearchStalled } = useSearchBox(props);
  
  const [inputValue, setInputValue] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && showRecentSearches) {
      try {
        const stored = localStorage.getItem('izerwaren_recent_searches');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecentSearches(parsed.slice(0, maxRecentSearches));
        }
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }
  }, [maxRecentSearches, showRecentSearches]);

  // Save search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim() || !showRecentSearches) return;

    try {
      const newSearch: RecentSearch = {
        query: searchQuery.trim(),
        timestamp: Date.now(),
      };

      // Remove duplicate if exists
      const filtered = recentSearches.filter(
        (search) => search.query.toLowerCase() !== newSearch.query.toLowerCase()
      );

      // Add to beginning and limit
      const updated = [newSearch, ...filtered].slice(0, maxRecentSearches);
      setRecentSearches(updated);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('izerwaren_recent_searches', JSON.stringify(updated));
      }
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('izerwaren_recent_searches');
    }
  };

  // Handle input change with debounced search
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    refine(newValue);
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim()) {
      saveRecentSearch(inputValue.trim());
      onSearchSubmit?.(inputValue.trim());
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Handle recent search selection
  const handleRecentSearchClick = (searchQuery: string) => {
    setInputValue(searchQuery);
    refine(searchQuery);
    saveRecentSearch(searchQuery);
    onSearchSubmit?.(searchQuery);
    setIsFocused(false);
  };

  // Clear search
  const handleClear = () => {
    setInputValue('');
    refine('');
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external query changes
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const showDropdown = isFocused && (recentSearches.length > 0 || inputValue.length === 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search 
            className={`h-5 w-5 transition-colors duration-200 ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`} 
          />
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={`
            block w-full pl-10 pr-12 py-3 border rounded-lg leading-5 bg-white
            placeholder-gray-500 transition-all duration-200 text-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${isFocused 
              ? 'border-blue-300 shadow-lg' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          placeholder={placeholder || t('placeholder', 'Search for products...')}
          aria-label={t('searchLabel', 'Search products')}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Loading Indicator / Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isSearchStalled ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          ) : inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label={t('clearSearch', 'Clear search')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Recent Searches Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {t('recentSearches', 'Recent Searches')}
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  {t('clearAll', 'Clear All')}
                </button>
              </div>
              
              <div className="py-2">
                {recentSearches.map((search) => (
                  <button
                    key={`${search.query}-${search.timestamp}`}
                    onClick={() => handleRecentSearchClick(search.query)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-900 truncate">{search.query}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {recentSearches.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              {t('noRecentSearches', 'No recent searches')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBox;