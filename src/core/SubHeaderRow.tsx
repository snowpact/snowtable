/**
 * Sub-header row rendered directly under the column headers (e.g. subtotals).
 *
 * Isolates the whole sub-header concern: it resolves the consumer's `columnKey -> content`
 * map from the `subHeader` callback and renders the aligned `<tr>`. The table computes
 * nothing — the callback receives the rows the table holds (all filtered rows pre-pagination
 * in client mode, the current page's items in server mode) plus the active filters, and
 * returns the values to display. Rendered inside `<thead>`, so it follows the header's
 * column order, widths, visibility and responsive behaviour for free.
 */

import type { Table } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';

import { cn } from '../utils';
import type { SnowSubHeader, SnowSubHeaderContext } from '../types';

export type SubHeaderRowProps<Data extends object> = {
  table: Table<Data>;
  subHeader: (ctx: SnowSubHeaderContext<Data>) => SnowSubHeader<Data>;
  /**
   * Server mode: the current page's items, aggregated as-is. Client mode: `undefined`, so the
   * row derives all filtered rows (across pages) from the table's memoized sorted row model.
   */
  serverRows?: Data[];
  filters: SnowSubHeaderContext<Data>['filters'];
};

export function SubHeaderRow<Data extends object>({
  table,
  subHeader,
  serverRows,
  filters,
}: SubHeaderRowProps<Data>) {
  // Read the callback via a ref so an inline `subHeader` doesn't invalidate the memo; the map is
  // recomputed only when the row set or filters actually change (passing `rows` is a reference, O(1)).
  const subHeaderRef = useRef(subHeader);
  subHeaderRef.current = subHeader;

  const sortedRows = serverRows ? undefined : table.getSortedRowModel().rows;
  const { search, columnFilters, prefilter } = filters;

  const content = useMemo<SnowSubHeader<Data>>(() => {
    const rows = serverRows ?? sortedRows!.map(row => row.original);
    return subHeaderRef.current({ rows, filters: { search, columnFilters, prefilter } });
  }, [serverRows, sortedRows, search, columnFilters, prefilter]);

  if (Object.keys(content).length === 0) return null;

  return (
    <tr className="snow-table-subheader-row" data-testid="datatable-subheader">
      {table.getVisibleLeafColumns().map(column => {
        const meta = column.columnDef?.meta;
        return (
          <td
            key={column.id}
            className={cn(
              'snow-table-subheader-cell',
              meta?.center && 'snow-align-middle snow-text-center',
              column.id === 'actions' && 'snow-table-actions-cell'
            )}
          >
            {content[column.id as keyof Data]}
          </td>
        );
      })}
    </tr>
  );
}
