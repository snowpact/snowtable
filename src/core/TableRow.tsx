/**
 * Memoized table row.
 *
 * Isolates re-renders: a parent re-render (unrelated prop change, activeRowId
 * switch, etc.) only re-renders the rows whose props actually changed, instead
 * of every visible row. Relies on TanStack's row model returning stable `row`
 * references across renders when the underlying data/columns/state are unchanged.
 */

import { flexRender, type Row } from '@tanstack/react-table';
import { memo, type CSSProperties } from 'react';

import { cn } from '../utils';

export type TableRowProps<Data extends object> = {
  row: Row<Data>;
  rowIndex: number;
  /** Computed by the parent so only rows whose active state flips re-render. */
  isActive: boolean;
  /** Stable identity expected — see DataTable's stableOnRowClick. */
  onRowClick?: (data: Data) => void;
  enableResponsive: boolean;
};

function TableRowInner<Data extends object>({
  row,
  rowIndex,
  isActive,
  onRowClick,
  enableResponsive,
}: TableRowProps<Data>) {
  const cells = row.getVisibleCells();

  return (
    <tr
      className={cn(
        'snow-table-row snow-transition-all snow-duration-300 snow-ease-in-out',
        {
          'snow-table-row-alternate': rowIndex % 2 === 1,
          'snow-table-row-active': isActive,
        },
        enableResponsive && 'snow-responsive-row'
      )}
      data-testid={`datatable-row-${row.id}`}
    >
      {cells.map((cell, cellIndex) => {
        const headerLabel =
          typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id;
        const isLastCell = cellIndex === cells.length - 1;
        const meta = cell.column.columnDef?.meta;

        return (
          <td
            key={cell.id}
            onClick={() => onRowClick && !meta?.disableColumnClick && onRowClick(row.original)}
            className={cn(
              onRowClick && !meta?.disableColumnClick && 'snow-cursor-pointer',
              meta?.center && 'snow-align-middle snow-text-center',
              meta?.maxWidth !== undefined && 'snow-cell-truncate',
              enableResponsive
                ? cn('snow-responsive-cell', isLastCell && 'snow-responsive-cell-last')
                : 'snow-table-cell'
            )}
            style={
              {
                '--snow-col-width': meta?.width,
                '--snow-col-min-width': meta?.minWidth,
                '--snow-col-max-width': meta?.maxWidth,
              } as CSSProperties
            }
          >
            {enableResponsive && <span className="snow-responsive-cell-label">{headerLabel}</span>}
            <span className={cn(enableResponsive && 'snow-responsive-cell-content')}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

// memo() erases the generic call signature; the cast restores it.
export const TableRow = memo(TableRowInner) as typeof TableRowInner;
