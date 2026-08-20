import { ColumnDef } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { DataTable } from './DataTable';

import { renderWithProviders, screen, within } from '../test/test-utils';

type TestItem = { id: string; name: string };

const mockData: TestItem[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
];

const columns: ColumnDef<TestItem>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'actions', header: '', cell: () => <button>act</button> },
];

const wrapper = () => screen.getByTestId('datatable-table').closest('.snow-table-wrapper') as HTMLElement;

describe('DataTable sticky actions', () => {
  it('marks the wrapper for hover actions by default', () => {
    renderWithProviders(<DataTable data={mockData} columns={columns} />);

    expect(wrapper()).toHaveClass('snow-sticky-actions');
  });

  it('does not mark the wrapper in visible mode', () => {
    renderWithProviders(<DataTable data={mockData} columns={columns} actionsMode="visible" />);

    expect(wrapper()).not.toHaveClass('snow-sticky-actions');
  });

  it('marks the actions cell so the CSS can target it', () => {
    renderWithProviders(<DataTable data={mockData} columns={columns} actionsMode="visible" />);

    const firstRow = screen.getByTestId('datatable-row-0');
    const cells = within(firstRow).getAllByRole('cell');
    expect(cells[cells.length - 1]).toHaveClass('snow-table-actions-cell');
  });
});
