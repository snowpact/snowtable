/**
 * Free-text "contains" filter (case-insensitive, SQL `LIKE`-style).
 */

import type { Row } from '@tanstack/react-table';

/**
 * TanStack `filterFn` for a text filter. `filterValue` is `[query]`. Matches
 * rows whose cell value contains the query (case-insensitive). Reads the RAW
 * value from `row.original` rather than `row.getValue()`, which may be a derived
 * `searchableValue` string.
 */
export function textFilter<T>(row: Row<T>, columnId: string, filterValue: string[]): boolean {
  if (!Array.isArray(filterValue)) return true;
  const query = (filterValue[0] ?? '').trim().toLowerCase();
  if (!query) return true;

  const raw = (row.original as Record<string, unknown>)[columnId];
  if (raw == null) return false;
  return String(raw).toLowerCase().includes(query);
}
