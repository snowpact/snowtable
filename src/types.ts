/**
 * SnowTable types
 */

import type { ComponentType, ReactNode, SVGProps } from 'react';

/**
 * Icon component type - compatible with IconComponent
 * Users can use lucide-react icons or any SVG component with this signature
 */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

import type { TopbarElements } from './core/DataTable';
import type { PreFilter } from './core/PrefilterTabs';
import type { FilterConfig } from './core/SingleFilterDropdown';
import type { SearchMode } from './utils/fuzzyFilter';

// ============================================
// Shared Types
// ============================================

export type ErrorResponse = {
  message: string;
  status: number;
};

/**
 * Column metadata for customizing column appearance and behavior
 */
export type SnowColumnMeta = {
  /** Column width (CSS value, e.g., '200px', '20%', 'auto') - only applied in desktop mode */
  width?: string | number;
  /** Column minimum width (CSS value) - only applied in desktop mode */
  minWidth?: string | number;
  /** Column maximum width (CSS value) - only applied in desktop mode */
  maxWidth?: string | number;
  /** Whether the column is hidden by default in column configuration */
  defaultHidden?: boolean;
  /** Disable row click handler for this column (e.g., for action columns) */
  disableColumnClick?: boolean;
  /** Center the content of this column */
  center?: boolean;
};

export type SnowColumnConfig<T extends object> = {
  key: keyof T | '_extra' | '_extra_' | `_extra_${string}`;
  label?: string;
  hidden?: boolean;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  searchableValue?: (item: T) => string;
  meta?: SnowColumnMeta;
};

/**
 * A sub-header row rendered directly under the column headers: maps a column key to the
 * content shown in that column (columns absent from the map render an empty cell).
 */
export type SnowSubHeader<T> = Partial<Record<keyof T, ReactNode>>;

/**
 * Context passed to the {@link BaseSnowTableProps.subHeader} callback.
 */
export type SnowSubHeaderContext<T> = {
  /**
   * Rows the table currently holds — all filtered rows across pages in client mode, the current
   * page's items in server mode. The table computes nothing: build/format the values yourself.
   */
  rows: T[];
  /** Current filter state, so the sub-header can be recomputed/displayed conditionally. */
  filters: { search: string; columnFilters: Record<string, string[]>; prefilter?: string };
};

// ============================================
// Action Types
// ============================================

export type BaseAction = {
  icon: IconComponent;
  label: string;
  display?: 'button' | 'dropdown';
  hidden?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
};

export type ClickAction<T> = BaseAction & {
  type: 'click';
  onClick: (item: T) => void;
};

export type LinkAction<T> = BaseAction & {
  type: 'link';
  href: (item: T) => string;
  external?: boolean; // true = target="_blank" + rel="noopener noreferrer"
};

export type EndpointAction<T, K> = BaseAction & {
  type: 'endpoint';
  endpoint: (item: T) => Promise<K>;
  /** Optional confirmation - if returns false, endpoint is not called */
  withConfirm?: (item: T) => Promise<boolean> | boolean;
  onSuccess?: (data: K, item: T) => void;
  onError?: (error: ErrorResponse, item: T) => void;
};

export type TableAction<T, K = unknown> =
  | ClickAction<T>
  | LinkAction<T>
  | EndpointAction<T, K>
  | ((item: T) => ClickAction<T> | LinkAction<T> | EndpointAction<T, K>);

// ============================================
// UI Options (passed through to DataTable)
// ============================================

/**
 * UI options that can be passed through to the underlying DataTable
 */
export interface DataTableUIOptions<T extends object> {
  onRowClick?: (data: T) => void;
  activeRowId?: string | number;
  displayTotalNumber?: boolean;
  enableElementLabel?: boolean;
  enableGlobalSearch?: boolean;
  searchMode?: SearchMode;
  enableSorting?: boolean;
  enableColumnConfiguration?: boolean;
  enablePagination?: boolean;
  enableResponsive?: boolean;
  /**
   * How the actions column is displayed:
   * - `'hover'` (default): pinned to the right edge and revealed on row hover (no reserved
   *   column width), so actions stay reachable when the table scrolls horizontally.
   * - `'visible'`: a normal actions column, always shown.
   * No-op in responsive card mode / very narrow tables.
   */
  actionsMode?: 'hover' | 'visible';
  paginationSizes?: number[];
  texts?: {
    searchPlaceholder?: string;
    emptyTitle?: string;
  };
  /** Custom CSS class applied on the root wrapper. Useful for scoped theming. */
  className?: string;
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
   * renderTopbar={({ search, filters, columnConfiguration }) => (
   *   <div className="snow-topbar-right">
   *     {filters}
   *     <MyExportButton />
   *     {search}
   *     {columnConfiguration}
   *   </div>
   * )}
   */
  renderTopbar?: (elements: TopbarElements) => ReactNode;
}

// ============================================
// Base Props (shared between Client and Server)
// ============================================

/**
 * Base props shared between SnowClientDataTable and SnowServerDataTable
 */
export interface BaseSnowTableProps<T extends Record<string, unknown>, K = unknown> extends DataTableUIOptions<T> {
  queryKey: string[];
  columnConfig: SnowColumnConfig<T>[];
  actions?: TableAction<T, K>[];
  filters?: FilterConfig<T>[];
  prefilters?: PreFilter[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  defaultPageSize?: number;
  /**
   * Persist table state (prefilter, pagination, search, filters, sorting) in URL query params.
   */
  persistState?: boolean;
  /**
   * Render a sub-header row directly under the column headers. Receives the rows the table
   * currently holds plus the active filters, and returns a `columnKey -> content` map. The table
   * only places the (aligned) row — you compute and format the values. Omit for no row.
   *
   * @example
   * subHeader={({ rows }) => ({ label: 'Total', amount: eur(rows.reduce((s, r) => s + r.amount, 0)) })}
   */
  subHeader?: (ctx: SnowSubHeaderContext<T>) => SnowSubHeader<T>;
}

// ============================================
// SnowClientDataTable Props (Client Mode)
// ============================================

/**
 * Props for SnowClientDataTable component (client-side filtering/sorting)
 */
export interface SnowClientDataTableProps<T extends Record<string, unknown>, K = unknown> extends BaseSnowTableProps<T, K> {
  fetchAllItemsEndpoint: () => Promise<T[]>;
  /** Optional function to filter items based on active prefilter */
  prefilterFn?: (item: T, prefilterId: string) => boolean;
}

// ============================================
// SnowServerDataTable Props (Server Mode)
// ============================================

/**
 * Response structure for server-side paginated endpoints
 */
export interface ServerPaginatedResponse<T> {
  items: T[];
  totalItemCount: number;
}

/**
 * Parameters sent to the server for pagination, search, and filtering
 */
export interface ServerFetchParams {
  limit: number;
  offset: number;
  search?: string;
  prefilter?: string;
  filters?: Record<string, string[]>;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Props for SnowServerDataTable component (server-side pagination/filtering/sorting)
 */
export interface SnowServerDataTableProps<T extends Record<string, unknown>, K = unknown> extends BaseSnowTableProps<T, K> {
  fetchServerEndpoint: (params: ServerFetchParams) => Promise<ServerPaginatedResponse<T>>;
  filters?: FilterConfig<Record<string, unknown>>[];
}
