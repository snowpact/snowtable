/**
 * SnowServerDataTable - Server-side data table with React Query integration
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';

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
    resetToDefaults,
  } = useTableStatePersist({
    enabled: persistState,
    defaultPrefilter: prefilters?.[0]?.id,
    defaultPageSize,
    defaultSortBy,
    defaultSortOrder,
  });

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
      // Reset
      onResetFilters={resetToDefaults}
      {...restProps}
      // Server mode always requires pagination (must be after restProps to prevent override)
      enablePagination
    />
  );
};
