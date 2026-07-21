/**
 * SnowClientDataTable - Client-side data table with React Query integration
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

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
    resetToDefaults,
  } = useTableStatePersist({
    enabled: persistState,
    defaultPrefilter: prefilters?.[0]?.id,
    defaultPageSize,
    defaultSortBy,
    defaultSortOrder,
  });

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
      // Reset
      onResetFilters={resetToDefaults}
      {...restProps}
    />
  );
};
