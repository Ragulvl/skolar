import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import DataTable from './DataTable'

/**
 * PaginatedDataPage — reusable wrapper combining server-side search,
 * usePaginatedAPI integration, DataTable display, and Load More button.
 *
 * Usage:
 *   <PaginatedDataPage
 *     title="All Students"
 *     subtitle="Students across all departments."
 *     columns={columns}
 *     items={items}
 *     loading={loading}
 *     loadingMore={loadingMore}
 *     hasMore={hasMore}
 *     total={total}
 *     onLoadMore={loadMore}
 *     search={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Search students..."
 *     emptyIcon={GraduationCap}
 *     onRowClick={(row) => navigate(`/detail/${row.id}`)}
 *   />
 */
export default function PaginatedDataPage({
  // Header
  title,
  subtitle,
  headerActions,
  // Data
  items = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  total = 0,
  onLoadMore,
  // Search
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  // Table
  columns,
  onRowClick,
  pageSize = 20,
  // Customization
  emptyIcon: EmptyIcon,
  emptyTitle = 'No results found',
  emptyMessage = 'Try adjusting your search or filters.',
  children,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || headerActions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-extrabold font-heading">{title}</h1>}
            {subtitle && (
              <p className="text-sm text-dark-200 mt-1.5">
                {loading ? 'Loading...' : subtitle}
                {!loading && total > 0 && (
                  <span className="text-dark-400 ml-2">({total} total)</span>
                )}
              </p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Search bar */}
      {onSearchChange && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-dark-700/60 border border-dark-500/25
              text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:border-brand-500/50
              focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>
      )}

      {/* Extra children (filters, etc.) */}
      {children}

      {/* Loading skeleton */}
      {loading ? (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-8">
          <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-dark-600/40 rounded-xl" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-dark-600/30 rounded-lg" />
            ))}
          </div>
        </div>
      ) : items.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={items}
            searchable={false}
            onRowClick={onRowClick}
            pageSize={pageSize}
          />

          {/* Load More button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl bg-dark-700/60 border border-dark-500/25
                  text-sm font-medium text-dark-200 hover:bg-brand-500/10 hover:border-brand-500/30
                  hover:text-brand-400 transition-all duration-200 disabled:opacity-50
                  flex items-center gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading more...</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Load More</>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-dark-700/60 border border-dark-500/25 rounded-2xl p-12 text-center">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 text-dark-500 mx-auto mb-4" />}
          <h3 className="text-lg font-semibold text-dark-200">{emptyTitle}</h3>
          <p className="text-sm text-dark-400 mt-2">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
