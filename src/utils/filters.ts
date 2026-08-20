/**
 * Utilities for encoding/decoding column filters for URL params
 */

import {
  STORAGE_KEY_FILTERS,
  STORAGE_KEY_PAGE,
  STORAGE_KEY_PAGE_SIZE,
  STORAGE_KEY_PREFILTER,
  STORAGE_KEY_SEARCH,
  STORAGE_KEY_SORT_BY,
  STORAGE_KEY_SORT_DESC,
} from '../hooks/useTableStatePersist';

/**
 * Encode column filters into a compact string for URL query params.
 *
 * Format:
 *   key1:v1,v2|key2:v3
 *
 * - keys sans valeurs sont ignorés
 * - valeurs vides sont filtrées
 */
export const encodeFiltersToParam = (filters: Record<string, string[]>): string => {
  const parts: string[] = [];

  for (const [key, values] of Object.entries(filters)) {
    const filteredValues = values.filter(v => v !== '');
    if (!key || filteredValues.length === 0) continue;
    // Encode keys/values so a value containing the `, : |` delimiters (e.g. a
    // free-text filter query) round-trips without corrupting the compact format.
    parts.push(`${encodeURIComponent(key)}:${filteredValues.map(encodeURIComponent).join(',')}`);
  }

  return parts.join('|');
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Decode column filters from the compact string format used in URL query params.
 *
 * Inverse de encodeFiltersToParam.
 */
export const decodeFiltersFromParam = (param: string | null | undefined): Record<string, string[]> => {
  if (!param) return {};

  const result: Record<string, string[]> = {};

  const groups = param
    .split('|')
    .map(g => g.trim())
    .filter(Boolean);
  for (const group of groups) {
    // Split on the FIRST colon only; values are percent-encoded so any `:` they
    // contained is `%3A` and won't be mistaken for the key/values separator.
    const separator = group.indexOf(':');
    if (separator === -1) continue;
    const key = safeDecode(group.slice(0, separator));
    const valuesPart = group.slice(separator + 1);
    if (!key || !valuesPart) continue;

    const values = valuesPart
      .split(',')
      .map(v => safeDecode(v.trim()))
      .filter(Boolean);

    if (values.length > 0) {
      result[key] = values;
    }
  }

  return result;
};

/**
 * Construct a URL with DataTable state parameters.
 *
 * @param baseUrl - Base URL path (e.g., '/isra/travel-reservation')
 * @param tableState - Optional table state parameters (prefilter, search, pagination, filters, sorting)
 * @returns Complete URL with all query parameters
 *
 * @example
 * redirectToPageWithParam('/isra/travel-reservation', { prefilter: 'all' })
 * // Returns: /isra/travel-reservation?dt_prefilter=all
 */
export const redirectToPageWithParam = (
  baseUrl: string,
  tableState?: {
    prefilter?: string;
    search?: string;
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
    filters?: Record<string, string[]>;
    sorting?: {
      id: string;
      desc: boolean;
    }[];
  }
): string => {
  const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  // Add table state parameters if provided
  if (tableState) {
    // Prefilter
    if (tableState.prefilter) {
      url.searchParams.set(STORAGE_KEY_PREFILTER, tableState.prefilter);
    }

    // Search
    if (tableState.search) {
      url.searchParams.set(STORAGE_KEY_SEARCH, tableState.search);
    }

    // Pagination
    if (tableState.pagination) {
      const { pageIndex, pageSize } = tableState.pagination;
      if (pageIndex > 0) {
        url.searchParams.set(STORAGE_KEY_PAGE, String(pageIndex + 1));
      }
      if (pageSize) {
        url.searchParams.set(STORAGE_KEY_PAGE_SIZE, String(pageSize));
      }
    }

    // Filters
    if (tableState.filters && Object.keys(tableState.filters).length > 0) {
      const encoded = encodeFiltersToParam(tableState.filters);
      url.searchParams.set(STORAGE_KEY_FILTERS, encoded);
    }

    // Sorting
    if (tableState.sorting && tableState.sorting.length > 0) {
      const sort = tableState.sorting[0];
      url.searchParams.set(STORAGE_KEY_SORT_BY, sort.id);
      url.searchParams.set(STORAGE_KEY_SORT_DESC, String(sort.desc));
    }
  }

  // Return relative URL (pathname + search)
  return url.pathname + url.search;
};
