/**
 * Core DataTable component
 */

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { FunnelX } from '../icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../primitives/Button';
import { Skeleton } from '../primitives/Skeleton';
import { getT } from '../registry';
import type { SearchMode } from '../utils';
import { cn, fuzzyFilter, containsFilter } from '../utils';

import { ColumnConfiguration } from './ColumnConfiguration';
import { PageSizeSelector } from './PageSizeSelector';
import { DEFAULT_PAGE_SIZES, Pagination } from './Pagination';
import { PreFilter, PrefilterTabs } from './PrefilterTabs';
import { SearchBar } from './SearchBar';
import type { FilterConfig } from './SingleFilterDropdown';
import { SingleFilterDropdown } from './SingleFilterDropdown';
import { SortButton } from './SortButton';
import { TableRow } from './TableRow';

/**
 * Pre-rendered topbar elements passed to {@link DataTableProps.renderTopbar}.
 *
 * Each element is already wired with its state and callbacks. An element is
 * `null` when its underlying feature is disabled, so you can render it
 * unconditionally — `null` renders nothing.
 */
export type TopbarElements = {
  /** Prefilter tabs / select (left section by default). `null` if no prefilters. */
  prefilters: ReactNode;
  /** Global search input (center section by default). `null` if search disabled. */
  search: ReactNode;
  /** Column filter dropdowns, one per configured filter. `null` if no filters. */
  filters: ReactNode;
  /** Column visibility configuration button. `null` if disabled. */
  columnConfiguration: ReactNode;
  /** Reset-all-filters button. `null` if there is nothing to reset. */
  resetFilters: ReactNode;
};

export type DataTableProps<T extends object> = {
  // === DATA ===
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  isLoading?: boolean;
  isFetching?: boolean;

  // === MODE ===
  mode?: 'client' | 'server'; // Explicit mode (default: 'client')

  // === PAGINATION (controlled or uncontrolled) ===
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  totalCount?: number; // Total number of items (required when mode='server')

  // === SEARCH (controlled or uncontrolled) ===
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  enableGlobalSearch?: boolean;
  searchMode?: SearchMode;

  // === COLUMN FILTERS (controlled or uncontrolled) ===
  filters?: FilterConfig<T>[];
  columnFilters?: Record<string, string[]>;
  onColumnFiltersChange?: (filters: Record<string, string[]>) => void;

  // === PREFILTERS (controlled) ===
  prefilters?: PreFilter[];
  activePrefilter?: string;
  onPrefilterChange?: (key: string) => void;

  // === SORTING (controlled or uncontrolled) ===
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  enableSorting?: boolean;

  // === COLUMN VISIBILITY (controlled or uncontrolled) ===
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  enableColumnConfiguration?: boolean;

  // === UI OPTIONS ===
  onRowClick?: (data: T) => void;
  activeRowId?: string | number;
  displayTotalNumber?: boolean;
  enableElementLabel?: boolean;
  enablePagination?: boolean;
  paginationSizes?: number[];
  enableResponsive?: boolean;
  texts?: {
    searchPlaceholder?: string;
    emptyTitle?: string;
  };

  // === TOPBAR ===
  /**
   * Customize the topbar layout and element ordering.
   *
   * Receives the pre-rendered topbar elements ({@link TopbarElements}) and must
   * return the topbar content. Use it to reorder elements, regroup them across
   * sections, or interleave your own custom controls (export buttons, etc.).
   *
   * When omitted, the default `left / center / right` layout is used.
   *
   * @example
   * renderTopbar={({ search, filters, columnConfiguration, resetFilters }) => (
   *   <div className="snow-topbar-right">
   *     {filters}
   *     <MyExportButton />
   *     {search}
   *     {columnConfiguration}
   *     {resetFilters}
   *   </div>
   * )}
   */
  renderTopbar?: (elements: TopbarElements) => ReactNode;

  // === RESET ===
  onResetFilters?: () => void;

  // === STYLING ===
  /** Custom CSS class applied on the root wrapper. Useful for scoped theming. */
  className?: string;
};

export function DataTable<Data extends object>({
  // Data
  data,
  columns,
  isLoading,
  isFetching,
  // Mode
  mode = 'client',
  // Pagination (external props with internal fallback)
  pagination: externalPagination,
  onPaginationChange: externalOnPaginationChange,
  totalCount: externalTotalCount,
  // Search (external props with internal fallback)
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange: externalOnGlobalFilterChange,
  enableGlobalSearch = false,
  searchMode = 'fuzzy',
  // Column filters (external props with internal fallback)
  filters,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: externalOnColumnFiltersChange,
  // Prefilters
  prefilters,
  activePrefilter,
  onPrefilterChange,
  // Sorting (external props with internal fallback)
  sorting: externalSorting,
  onSortingChange: externalOnSortingChange,
  enableSorting = true,
  // Column visibility (external props with internal fallback)
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  enableColumnConfiguration = false,
  // UI options
  onRowClick,
  activeRowId,
  displayTotalNumber = true,
  enableElementLabel = true,
  enablePagination = true,
  paginationSizes,
  enableResponsive = true,
  texts,
  // Topbar
  renderTopbar,
  // Reset
  onResetFilters,
  // Styling
  className,
}: DataTableProps<Data>) {
  const t = getT();

  // Internal state (used if external props not provided)
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZES[0],
  });
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('');
  const [internalColumnFilters, setInternalColumnFilters] = useState<Record<string, string[]>>({});
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({});

  // Effective values (external prop OR internal state)
  const pagination = externalPagination ?? internalPagination;
  const onPaginationChange = externalOnPaginationChange ?? setInternalPagination;
  const globalFilter = externalGlobalFilter ?? internalGlobalFilter;
  const onGlobalFilterChange = externalOnGlobalFilterChange ?? setInternalGlobalFilter;
  const columnFilters = externalColumnFilters ?? internalColumnFilters;
  const onColumnFiltersChange = externalOnColumnFiltersChange ?? setInternalColumnFilters;
  const sorting = externalSorting ?? internalSorting;
  const onSortingChange = externalOnSortingChange ?? setInternalSorting;
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const onColumnVisibilityChange = externalOnColumnVisibilityChange ?? setInternalColumnVisibility;

  // Wrapper to reset pagination when globalFilter changes
  const handleGlobalFilterChangeWithReset = useCallback(
    (value: string) => {
      onGlobalFilterChange(value);
      onPaginationChange(prev => ({ ...prev, pageIndex: 0 }));
    },
    [onGlobalFilterChange, onPaginationChange]
  );

  // Track previous values to detect actual changes (not just reference changes)
  const columnFiltersJson = useMemo(() => JSON.stringify(columnFilters), [columnFilters]);

  // Reset pagination when prefilter or columnFilters change
  useEffect(() => {
    onPaginationChange(prev => {
      if (prev.pageIndex === 0) return prev; // Skip if already at 0
      return { ...prev, pageIndex: 0 };
    });
  }, [activePrefilter, columnFiltersJson, onPaginationChange]);

  // Server-side mode: when mode='server', DataTable delegates pagination/filtering/sorting to server
  // When 'client' (default), DataTable handles filtering/sorting internally using data array
  const serverSideMode = mode === 'server';

  // Calculate pageCount from totalCount (only for server mode)
  const pageCount = externalTotalCount !== undefined ? Math.ceil(externalTotalCount / pagination.pageSize) : undefined;

  // Pagination is possible in client mode, or in server mode only if totalCount is provided
  const isPaginationPossible = !serverSideMode || externalTotalCount !== undefined;

  // Build a set of valid column IDs to sanitize state referencing non-existent columns
  const validColumnIds = useMemo(() => {
    const ids = new Set<string>();
    for (const col of columns) {
      const id = (col as unknown as Record<string, unknown>).accessorKey ?? col.id;
      if (typeof id === 'string') ids.add(id);
    }
    return ids;
  }, [columns]);

  // Sanitize sorting state: discard entries referencing columns not in the current table
  const safeSorting = useMemo(() => {
    return sorting.filter(s => validColumnIds.has(s.id));
  }, [sorting, validColumnIds]);

  // Convert Record<string, string[]> to ColumnFiltersState for TanStack Table
  // Also sanitize: discard filters referencing columns not in the current table
  const tanstackColumnFilters = useMemo<ColumnFiltersState>(() => {
    return Object.entries(columnFilters)
      .filter(([id]) => validColumnIds.has(id))
      .map(([id, value]) => ({ id, value }));
  }, [columnFilters, validColumnIds]);

  // Custom filter function for multi-select filters
  const multiSelectFilter = useCallback((row: Row<Data>, columnId: string, filterValue: string[]) => {
    const cellValue = row.getValue(columnId);
    return filterValue.includes(String(cellValue));
  }, []);

  // Stable identity for the row-click handler. Consumers often pass an inline
  // `onRowClick={() => ...}`; without this, every memoized row would see a new
  // prop on each render and re-render. The ref always holds the latest handler.
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const stableOnRowClick = useCallback((rowData: Data) => {
    onRowClickRef.current?.(rowData);
  }, []);

  const table = useReactTable({
    data,
    columns,
    pageCount: serverSideMode ? pageCount : undefined,
    state: {
      pagination,
      sorting: enableSorting ? safeSorting : undefined,
      globalFilter: !serverSideMode && enableGlobalSearch ? globalFilter : undefined,
      columnFilters: !serverSideMode && filters?.length ? tanstackColumnFilters : undefined,
      columnVisibility: enableColumnConfiguration ? columnVisibility : undefined,
    },
    onPaginationChange,
    onSortingChange: enableSorting ? onSortingChange : undefined,
    onColumnVisibilityChange: enableColumnConfiguration ? onColumnVisibilityChange : undefined,
    // Manual modes (when pageCount is provided)
    manualPagination: serverSideMode,
    manualFiltering: serverSideMode,
    manualSorting: serverSideMode,
    // Row models
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    // Client-side filtering (only when not in manual mode)
    ...(!serverSideMode && (filters?.length || enableGlobalSearch)
      ? {
          getFilteredRowModel: getFilteredRowModel(),
          filterFns: {
            multiSelect: multiSelectFilter,
          },
          globalFilterFn: enableGlobalSearch ? (searchMode === 'contains' ? containsFilter : fuzzyFilter) : undefined,
        }
      : {}),
  });

  const handleFilterChange = (key: keyof Data, selectedValues: string[]) => {
    const columnId = String(key);
    const newFilters = { ...columnFilters };

    if (selectedValues.length === 0) {
      delete newFilters[columnId];
    } else {
      newFilters[columnId] = selectedValues;
    }

    onColumnFiltersChange(newFilters);
  };

  const displayAdvancedBar =
    enableGlobalSearch ||
    displayTotalNumber ||
    (filters && filters.length > 0) ||
    enableColumnConfiguration ||
    !!renderTopbar;

  // For client-side, get count from current page rows; for manual mode, just use data length
  const itemCount = useMemo(() => {
    if (serverSideMode) {
      return data.length;
    }
    return table.getRowModel().rows.length;
  }, [serverSideMode, data.length, table, globalFilter, tanstackColumnFilters]);

  // Total count: for server mode use externalTotalCount directly, for client-side use filtered data length
  const totalCount = useMemo(() => {
    if (serverSideMode && externalTotalCount !== undefined) {
      return externalTotalCount;
    }
    return table.getFilteredRowModel().rows.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSideMode, externalTotalCount, table, data.length, globalFilter, tanstackColumnFilters]);

  // Pre-rendered topbar elements, exposed to a custom `renderTopbar` layout and
  // used by the default left/center/right layout. Each is `null` when its
  // underlying feature is disabled.
  const topbarElements: TopbarElements = {
    prefilters:
      prefilters && prefilters.length > 0 && onPrefilterChange ? (
        <PrefilterTabs
          prefilters={prefilters}
          activePrefilter={activePrefilter ?? prefilters[0]?.id ?? ''}
          onPrefilterChange={onPrefilterChange}
        />
      ) : null,
    search: enableGlobalSearch ? (
      <div className="snow-w-full snow-max-w-sm">
        <SearchBar
          value={globalFilter}
          onDebouncedChange={handleGlobalFilterChangeWithReset}
          placeholder={texts?.searchPlaceholder || t('dataTable.search')}
        />
      </div>
    ) : null,
    filters:
      filters && filters.length > 0
        ? filters.map(filter => (
            <SingleFilterDropdown
              key={String(filter.key)}
              filter={filter}
              selectedValues={columnFilters[String(filter.key)]}
              onFilterChange={handleFilterChange}
            />
          ))
        : null,
    columnConfiguration: enableColumnConfiguration ? <ColumnConfiguration table={table} /> : null,
    resetFilters:
      (enableGlobalSearch || (prefilters && prefilters.length > 0) || (filters && filters.length > 0)) &&
      onResetFilters ? (
        <Button
          onClick={onResetFilters}
          title={t('dataTable.resetFilters')}
          data-testid="datatable-reset-filters"
        >
          <FunnelX className="snow-size-4" />
        </Button>
      ) : null,
  };

  return (
    <div className={cn('snow-table-container snow-table-root', className)} data-testid="datatable">
      {/* Loading overlay during fetching (server-side) */}
      {isFetching && !isLoading && <div className="snow-table-loading-overlay" />}

      {displayAdvancedBar && (
        <div className="snow-table-top-bar">
          {renderTopbar ? (
            renderTopbar(topbarElements)
          ) : (
            <>
              {/* Left: Prefilter tabs */}
              <div className="snow-topbar-left">{topbarElements.prefilters}</div>

              {/* Center: Search bar */}
              <div className="snow-topbar-center">{topbarElements.search}</div>

              {/* Right: Filters and actions */}
              <div className="snow-topbar-right">
                {topbarElements.filters}
                {topbarElements.columnConfiguration}
                {topbarElements.resetFilters}
              </div>
            </>
          )}
        </div>
      )}

      <div
        className={cn(
          'snow-table-wrapper',
          enableResponsive && 'snow-responsive-container'
        )}
      >
        <table className="snow-table" data-testid="datatable-table">
          <thead className={cn('snow-table-header', enableResponsive && 'snow-responsive-thead')}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef?.meta;
                  return (
                  <th
                    key={header.id}
                    className={cn('snow-table-header-cell', enableSorting && header.column.getCanSort() && 'snow-cursor-pointer')}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      '--snow-col-width': meta?.width,
                      '--snow-col-min-width': meta?.minWidth,
                      '--snow-col-max-width': meta?.maxWidth,
                    } as React.CSSProperties}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="snow-table-header-cell-content">
                        <h3>{flexRender(header.column.columnDef.header, header.getContext())}</h3>
                        {enableSorting && <SortButton column={header.column} />}
                      </span>
                    )}
                  </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          {isLoading ? (
            <tbody className="snow-divide-y snow-divide-border" data-testid="datatable-loading">
              {Array.from({ length: pagination.pageSize > 10 ? 10 : pagination.pageSize }).map((_, index) => (
                <tr key={index} className={cn({ 'snow-table-row-alternate': index % 2 === 1 })}>
                  {columns.map((_column, colIndex) => (
                    <td key={`skeleton-table-${colIndex}`} className="snow-table-cell">
                      <Skeleton className="snow-h-4 snow-w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : itemCount > 0 ? (
            <tbody
              className={cn('snow-divide-y snow-divide-border', enableResponsive && 'snow-responsive-tbody')}
              data-testid="datatable-body"
            >
              {table.getRowModel().rows.map((row, rowIndex) => {
                const isActive =
                  activeRowId !== undefined && 'id' in row.original && activeRowId === row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    row={row}
                    rowIndex={rowIndex}
                    isActive={isActive}
                    onRowClick={onRowClick ? stableOnRowClick : undefined}
                    enableResponsive={enableResponsive}
                  />
                );
              })}
            </tbody>
          ) : (
            <caption className="snow-table-empty" data-testid="datatable-empty">
              {texts?.emptyTitle || t('dataTable.searchEmpty')}
            </caption>
          )}
        </table>
      </div>

      {/* Bottom bar */}
      <div className="snow-table-bottom-bar">
        {/* Item count - Left */}
        {displayTotalNumber && (
          <div className="snow-table-count" data-testid="datatable-count">
            {totalCount} {t('dataTable.elements')}
          </div>
        )}

        {/* Pagination - Center */}
        <div className="snow-flex snow-justify-center">
          {enablePagination && isPaginationPossible && <Pagination table={table} isLoading={isFetching} />}
        </div>

        {/* Page size selector - Right */}
        {enablePagination && (
          <div className="snow-flex snow-justify-end">
            <PageSizeSelector table={table} enableElementLabel={enableElementLabel} paginationSizes={paginationSizes} />
          </div>
        )}
      </div>
    </div>
  );
}
