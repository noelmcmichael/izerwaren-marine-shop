/**
 * SearchPagination Component
 * Task 9.4: Algolia Search Integration
 * 
 * Provides pagination controls for search results with accessibility support
 */

'use client';

import React from 'react';
import { usePagination, UsePaginationProps } from 'react-instantsearch';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchPaginationProps extends UsePaginationProps {
  className?: string;
  showLabels?: boolean;
  maxPages?: number;
}

export function SearchPagination({
  className = '',
  showLabels = true,
  maxPages = 7,
  ...props
}: SearchPaginationProps) {
  const t = useTranslations('search.pagination');
  const {
    pages,
    currentRefinement,
    nbPages,
    canRefine,
    refine,
    isFirstPage,
    isLastPage,
  } = usePagination(props);

  // Don't render if there's only one page or no results
  if (!canRefine || nbPages <= 1) {
    return null;
  }

  // Calculate visible pages with ellipsis
  const getVisiblePages = () => {
    const totalPages = Math.min(pages.length, maxPages);
    const current = currentRefinement;
    const half = Math.floor(totalPages / 2);

    let start = Math.max(0, current - half);
    let end = Math.min(pages.length, start + totalPages);

    // Adjust start if end is at the boundary
    if (end === pages.length) {
      start = Math.max(0, end - totalPages);
    }

    const visiblePages = pages.slice(start, end);
    
    return {
      pages: visiblePages,
      showStartEllipsis: start > 0,
      showEndEllipsis: end < pages.length,
      hasFirstPage: start > 0 && !visiblePages.includes(0),
      hasLastPage: end < pages.length && !visiblePages.includes(pages.length - 1),
    };
  };

  const { pages: visiblePages, showStartEllipsis, showEndEllipsis, hasFirstPage, hasLastPage } = getVisiblePages();

  // Button component
  const PageButton = ({
    page,
    isCurrent = false,
    disabled = false,
    children,
    ...buttonProps
  }: {
    page?: number;
    isCurrent?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const baseClasses = "relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    let classes = baseClasses;
    
    if (disabled) {
      classes += " text-gray-300 cursor-not-allowed";
    } else if (isCurrent) {
      classes += " z-10 bg-blue-600 text-white border-blue-600";
    } else {
      classes += " text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-gray-300";
    }

    return (
      <button
        type="button"
        className={classes}
        disabled={disabled}
        aria-current={isCurrent ? 'page' : undefined}
        aria-label={page !== undefined ? t('goToPage', { page: page + 1 }, `Go to page ${page + 1}`) : undefined}
        {...buttonProps}
      >
        {children}
      </button>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label={t('paginationLabel', 'Search results pagination')}
      className={`flex items-center justify-center ${className}`}
    >
      <div className="flex items-center">
        {/* Previous Button */}
        <PageButton
          disabled={isFirstPage}
          onClick={() => !isFirstPage && refine(currentRefinement - 1)}
        >
          <span className="sr-only">{t('previous', 'Previous')}</span>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          {showLabels && (
            <span className="ml-1 hidden sm:inline">
              {t('previous', 'Previous')}
            </span>
          )}
        </PageButton>

        {/* First Page */}
        {hasFirstPage && (
          <>
            <PageButton page={0} onClick={() => refine(0)}>
              1
            </PageButton>
            {showStartEllipsis && (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                <MoreHorizontal className="h-5 w-5" />
              </span>
            )}
          </>
        )}

        {/* Visible Pages */}
        {visiblePages.map((page) => (
          <PageButton
            key={page}
            page={page}
            isCurrent={page === currentRefinement}
            onClick={() => refine(page)}
          >
            {page + 1}
          </PageButton>
        ))}

        {/* Last Page */}
        {hasLastPage && (
          <>
            {showEndEllipsis && (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                <MoreHorizontal className="h-5 w-5" />
              </span>
            )}
            <PageButton page={pages.length - 1} onClick={() => refine(pages.length - 1)}>
              {pages.length}
            </PageButton>
          </>
        )}

        {/* Next Button */}
        <PageButton
          disabled={isLastPage}
          onClick={() => !isLastPage && refine(currentRefinement + 1)}
        >
          {showLabels && (
            <span className="mr-1 hidden sm:inline">
              {t('next', 'Next')}
            </span>
          )}
          <span className="sr-only">{t('next', 'Next')}</span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </PageButton>
      </div>

      {/* Page Info */}
      <div className="ml-6 hidden sm:flex items-center text-sm text-gray-500">
        <span>
          {t('pageInfo', {
            current: currentRefinement + 1,
            total: nbPages
          }, `Page ${currentRefinement + 1} of ${nbPages}`)}
        </span>
      </div>
    </nav>
  );
}

export default SearchPagination;