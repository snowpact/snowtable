/**
 * @snowpact/react-tanstack-table-react
 * Ultra-light, registry-based data table for React + TanStack Table
 *
 * Setup:
 * ```
 * import { setupSnowTable } from '@snowpact/react-tanstack-table-react';
 *
 * setupSnowTable({
 *   t: (key) => i18n.t(key),
 *   LinkComponent: Link,
 * });
 * ```
 */

// Main components
export { SnowClientDataTable } from './SnowClientDataTable';
export { SnowServerDataTable } from './SnowServerDataTable';

// Core DataTable (for advanced usage)
export { DataTable, DEFAULT_PAGE_SIZES } from './core';
export type { DataTableProps, TopbarElements } from './core';

// Core sub-components (for advanced usage)
export {
  ColumnConfiguration,
  PageSizeSelector,
  Pagination,
  PrefilterTabs,
  SearchBar,
  SingleFilterDropdown,
  SortButton,
} from './core';
export type {
  ColumnConfigurationProps,
  PageSizeSelectorProps,
  PaginationProps,
  PreFilter,
  PrefilterTabsProps,
  SearchBarProps,
  FilterOption,
  FilterConfig,
  SingleFilterDropdownProps,
  SortButtonProps,
} from './core';

// Types
export type {
  IconComponent,
  SnowColumnConfig,
  SnowColumnMeta,
  SnowClientDataTableProps,
  SnowServerDataTableProps,
  ServerPaginatedResponse,
  ServerFetchParams,
  TableAction,
  ClickAction,
  LinkAction,
  EndpointAction,
  BaseAction,
  ErrorResponse,
  DataTableUIOptions,
  BaseSnowTableProps,
} from './types';
export type { SearchMode } from './utils';

// Hooks
export { useSnowColumns, useTableStatePersist } from './hooks';
export { useTooltip, Tooltip } from './hooks/useTooltip';
export type { UseSnowColumnsOptions, UseSnowColumnsReturn } from './hooks';
export type { TooltipState } from './hooks/useTooltip';

// Utils
export { redirectToPageWithParam } from './utils';

// Registry (for setup)
export { setupSnowTable, resetSnowTable, isSnowTableSetup } from './registry';
export type { SetupSnowTableOptions } from './registry';

// Internal (for customization)
export { ActionCell } from './components';
