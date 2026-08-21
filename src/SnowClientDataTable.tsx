/**
 * SnowClientDataTable - Client-side data table with React Query integration
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { DataTable, DEFAULT_PAGE_SIZES } from './core';
import { useSnowColumns } from './hooks/useSnowColumns';
import { useTableStatePersist } from './hooks/useTableStatePersist';
import { SnowClientDataTableProps } from './types';
import { deriveColumnConfigurationId } from './utils';

const EMPTY_ITEMS: never[] = [];

export const SnowClientDataTable = <T extends Record<string, unknown>, K = unknown>({
  queryKey,
  columnConfig,
  actions,
  filters,
  prefilters,
  prefilterFn,
  defaultSortBy,
  defaultSortOrder = 'asc',
  defaultPageSize = DEFAULT_PAGE_SIZES[0],
  persistState = false,
  fetchAllItemsEndpoint,
  onFiltersChange,
  ...restProps
}: SnowClientDataTableProps<T, K>) => {
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
  // Data Query
  // ============================================
  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchAllItemsEndpoint(),
    placeholderData: keepPreviousData,
  });
  const items = data ?? EMPTY_ITEMS;

  // ============================================
  // Prefilter Data (client-side filtering)
  // ============================================
  const prefilteredData = useMemo(() => {
    if (!items || !activePrefilter || !prefilterFn) return items;
    return items.filter(item => prefilterFn(item, activePrefilter));
  }, [items, activePrefilter, prefilterFn]);

  // ============================================
  // Columns & Actions (via shared hook)
  // ============================================
  const { columns } = useSnowColumns<T, K>({
    columnConfig,
    actions,
    filters,
    mode: 'client',
  });

  // ============================================
  // Rendering
  // ============================================
  return (
    <DataTable
      mode="client"
      // `queryKey` is required and unique per table, so two tables never share a config cookie.
      columnConfigCookieSuffix={deriveColumnConfigurationId(queryKey)}
      data={prefilteredData}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching && !isLoading}
      // Pagination
      pagination={pagination}
      onPaginationChange={setPagination}
      // Search
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
    />
  );
};
