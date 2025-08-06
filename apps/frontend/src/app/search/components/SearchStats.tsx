/**
 * SearchStats Component
 * Task 9.4: Algolia Search Integration
 * 
 * Displays search statistics, timing, and result counts
 */

'use client';

import React from 'react';
import { useStats, UseStatsProps } from 'react-instantsearch';
import { Clock, Search, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchStatsProps extends UseStatsProps {
  className?: string;
  showTiming?: boolean;
  showQuery?: boolean;
  query?: string;
}

export function SearchStats({
  className = '',
  showTiming = true,
  showQuery = true,
  query,
  ...props
}: SearchStatsProps) {
  const t = useTranslations('search.stats');
  const { nbHits, processingTimeMS, nbSortedHits, areHitsSorted } = useStats(props);

  // Format processing time
  const formatTime = (timeMs: number) => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  // Format hit count
  const formatHitCount = (count: number) => {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(1)}M`;
    }
  };

  // Get the appropriate hit count (sorted vs total)
  const displayHits = areHitsSorted ? nbSortedHits : nbHits;
  const totalHits = nbHits;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      {/* Results Information */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {/* Query Display */}
        {showQuery && query && (
          <div className="flex items-center gap-2 text-gray-600">
            <Search className="h-4 w-4" />
            <span>
              {t('searchResults', 'Results for')} &quot;
              <span className="font-medium text-gray-900">{query}</span>&quot;
            </span>
          </div>
        )}

        {/* Hit Count */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-gray-700">
            {displayHits === totalHits ? (
              <>
                <span className="font-semibold text-gray-900">
                  {formatHitCount(totalHits)}
                </span>{' '}
                {totalHits === 1 
                  ? t('resultSingular', 'result') 
                  : t('resultPlural', 'results')
                }
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {formatHitCount(displayHits)}
                </span>{' '}
                {t('of', 'of')}{' '}
                <span className="font-semibold text-gray-900">
                  {formatHitCount(totalHits)}
                </span>{' '}
                {totalHits === 1 
                  ? t('resultSingular', 'result') 
                  : t('resultPlural', 'results')
                }
              </>
            )}
          </span>
        </div>

        {/* Processing Time */}
        {showTiming && (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs">
              {t('searchTime', 'Found in')} {formatTime(processingTimeMS)}
            </span>
          </div>
        )}
      </div>

      {/* Additional Statistics */}
      {areHitsSorted && displayHits !== totalHits && (
        <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
          {t('filtered', 'Filtered results')}
        </div>
      )}
    </div>
  );
}

export default SearchStats;