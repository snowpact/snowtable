/**
 * SnowServerDataTable - Server-side data table with React Query integration
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { DataTable, DEFAULT_PAGE_SIZES } from './core';
import { useSnowColumns } from './hooks/useSnowColumns';
import { useTableStatePersist } from './hooks/useTableStatePersist';
import { SnowServerDataTableProps } from './types';
import { deriveColumnConfigurationId } from './utils';

export const SnowServerDataTable = <T extends Record<string, unknown>, K = unknown>({
  queryKey,
  columnConfig,
  actions,
  filters,
  prefilters,
  defaultSortBy,
  defaultSortOrder = 'asc',
  defaultPageSize = DEFAULT_PAGE_SIZES[0],
  persistState = false,
  fetchServerEndpoint,
  onFiltersChange,
  ...restProps
}: SnowServerDataTableProps<T, K>) => {
  // ============================================
  // State Management (with optional persistence)
  // ============================================
  const {
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,
    activePrefilter,
    setActivePrefilter,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
  } = useTableStatePersist({
    enabled: persistState,
    defaultPrefilter: prefilters?.[0]?.id,
    defaultPageSize,
    defaultSortBy,
    defaultSortOrder,
  });

  // Expose the filters to the parent: fire on mount (incl. the value restored
  // from the persisted URL) and on every change. The `emitted` ref skips the
  // duplicate call React makes in StrictMode dev (the effect runs twice with the
  // same reference); the callback ref lets its identity change without re-firing;
  // destructuring the prop keeps it out of `restProps` so it never overrides the
  // internal state setter.
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;
  const emittedFiltersRef = useRef<Record<string, string[]> | undefined>(undefined);
  useEffect(() => {
    if (emittedFiltersRef.current === columnFilters) return;
    emittedFiltersRef.current = columnFilters;
    onFiltersChangeRef.current?.(columnFilters);
  }, [columnFilters]);

  // ============================================
  // Server Query
  // ============================================
  const serverQuery = useQuery({
    queryKey: [...queryKey, 'server', pagination, globalFilter, activePrefilter, columnFilters, sorting],
    queryFn: async () => {
      return fetchServerEndpoint({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: globalFilter || undefined,
        prefilter: activePrefilter,
        filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'DESC' : 'ASC',
      });
    },
    placeholderData: keepPreviousData,
  });

  // ============================================
  // Columns & Actions (via shared hook)
  // ============================================
  const { columns } = useSnowColumns<T, K>({
    columnConfig,
    actions,
    filters,
    mode: 'server',
  });

  // ============================================
  // Rendering
  // ============================================
  return (
    <DataTable
      mode="server"
      // `queryKey` is required and unique per table, so two tables never share a config cookie.
      columnConfigCookieSuffix={deriveColumnConfigurationId(queryKey)}
      data={serverQuery.data?.items ?? []}
      columns={columns}
      isLoading={serverQuery.isLoading}
      isFetching={serverQuery.isFetching}
      // Server-side mode - DataTable calculates pageCount internally from totalCount
      totalCount={serverQuery.data?.totalItemCount ?? 0}
      pagination={pagination}
      onPaginationChange={setPagination}
      // Search (DataTable handles pagination reset internally)
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      // Filters
      filters={filters}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      // Prefilters
      prefilters={prefilters}
      activePrefilter={activePrefilter}
      onPrefilterChange={setActivePrefilter}
      // Sorting
      sorting={sorting}
      onSortingChange={setSorting}
      {...restProps}
      // Server mode always requires pagination (must be after restProps to prevent override)
      enablePagination
    />
  );
};
