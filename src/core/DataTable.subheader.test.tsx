import { ColumnDef } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from './DataTable';
import type { SnowSubHeaderContext } from '../types';

import { renderWithProviders, screen, within } from '../test/test-utils';

type TestItem = {
  id: string;
  name: string;
  status: string;
};

const mockData: TestItem[] = [
  { id: '1', name: 'Item 1', status: 'active' },
  { id: '2', name: 'Item 2', status: 'inactive' },
  { id: '3', name: 'Item 3', status: 'active' },
  { id: '4', name: 'Item 4', status: 'pending' },
  { id: '5', name: 'Item 5', status: 'active' },
];

const columns: ColumnDef<TestItem>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

describe('DataTable subHeader row', () => {
  it('renders no subheader row when subHeader is not provided', () => {
    renderWithProviders(<DataTable data={mockData} columns={columns} />);

    expect(screen.queryByTestId('datatable-subheader')).not.toBeInTheDocument();
  });

  it('renders a subheader row with values aligned to their columns', () => {
    renderWithProviders(
      <DataTable data={mockData} columns={columns} subHeader={() => ({ name: 'Total', status: '42' })} />
    );

    const row = screen.getByTestId('datatable-subheader');
    const cells = within(row).getAllByRole('cell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent(''); // id column: no value
    expect(cells[1]).toHaveTextContent('Total'); // name column
    expect(cells[2]).toHaveTextContent('42'); // status column
  });

  it('passes the rows and current filters to the callback (client)', () => {
    const spy = vi.fn((_ctx: SnowSubHeaderContext<TestItem>) => ({ name: 'Total' }));

    renderWithProviders(<DataTable data={mockData} columns={columns} subHeader={spy} />);

    const ctx = spy.mock.calls.at(-1)![0];
    expect(ctx.rows).toHaveLength(5);
    expect(ctx.filters).toEqual({ search: '', columnFilters: {}, prefilter: undefined });
  });

  it('recomputes over the filtered rows when the global filter changes (client)', () => {
    const spy = vi.fn((ctx: SnowSubHeaderContext<TestItem>) => ({ name: String(ctx.rows.length) }));

    const { rerender } = renderWithProviders(
      <DataTable
        data={mockData}
        columns={columns}
        enableGlobalSearch
        searchMode="contains"
        globalFilter=""
        onGlobalFilterChange={() => {}}
        subHeader={spy}
      />
    );

    expect(within(screen.getByTestId('datatable-subheader')).getByText('5')).toBeInTheDocument();

    rerender(
      <DataTable
        data={mockData}
        columns={columns}
        enableGlobalSearch
        searchMode="contains"
        globalFilter="Item 1"
        onGlobalFilterChange={() => {}}
        subHeader={spy}
      />
    );

    expect(within(screen.getByTestId('datatable-subheader')).getByText('1')).toBeInTheDocument();
  });

  it('passes the current page items to the callback (server)', () => {
    const spy = vi.fn((_ctx: SnowSubHeaderContext<TestItem>) => ({ name: 'Total' }));

    renderWithProviders(
      <DataTable data={mockData} columns={columns} mode="server" totalCount={100} subHeader={spy} />
    );

    expect(spy.mock.calls.at(-1)![0].rows).toHaveLength(mockData.length);
  });
});
