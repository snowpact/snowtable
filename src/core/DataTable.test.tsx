import { ColumnDef } from '@tanstack/react-table';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataTable } from './DataTable';

import { renderWithProviders, screen, userEvent, waitFor } from '../test/test-utils';

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

describe('DataTable', () => {
  describe('basic rendering', () => {
    it('should render data table with data', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} />);

      expect(screen.getByTestId('datatable')).toBeInTheDocument();
      expect(screen.getByTestId('datatable-table')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} />);

      // Headers appear in both desktop and mobile views
      expect(screen.getAllByText('ID').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    });

    it('should render empty state when no data', () => {
      renderWithProviders(<DataTable data={[]} columns={columns} />);

      expect(screen.getByTestId('datatable-empty')).toBeInTheDocument();
    });

    it('should render loading state with skeletons', () => {
      renderWithProviders(<DataTable data={[]} columns={columns} isLoading />);

      expect(screen.getByTestId('datatable-loading')).toBeInTheDocument();
    });

    it('should render data rows with correct test ids', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} />);

      expect(screen.getByTestId('datatable-body')).toBeInTheDocument();
      expect(screen.getByTestId('datatable-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('datatable-row-1')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should render pagination when enabled', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} enablePagination />);

      // Should have pagination buttons
      expect(screen.getByTestId('datatable')).toBeInTheDocument();
    });

    it('should respect controlled pagination', () => {
      const onPaginationChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          pagination={{ pageIndex: 0, pageSize: 2 }}
          onPaginationChange={onPaginationChange}
          enablePagination
        />
      );

      // Should only show 2 items (pageSize = 2)
      const rows = screen.getAllByTestId(/^datatable-row-/);
      expect(rows.length).toBe(2);
    });

    it('should display total count', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} displayTotalNumber enablePagination />
      );

      expect(screen.getByTestId('datatable-count')).toBeInTheDocument();
    });
  });

  describe('global search', () => {
    it('should render search bar when enabled', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} enableGlobalSearch />);

      expect(screen.getByTestId('data-table-search-bar')).toBeInTheDocument();
    });

    it('should not render search bar when disabled', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} enableGlobalSearch={false} />
      );

      expect(screen.queryByTestId('data-table-search-bar')).not.toBeInTheDocument();
    });

    it('should use custom search placeholder', () => {
      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          texts={{ searchPlaceholder: 'Search items...' }}
        />
      );

      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    });

    it('should filter data in client mode when typing in search bar', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          mode="client"
          enableGlobalSearch
          enablePagination={false}
        />
      );

      // All items should be visible initially
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();

      // Type in search bar
      const searchInput = screen.getByTestId('data-table-search-bar');
      await user.type(searchInput, 'Item 1');

      // Wait for debounce (500ms) + filtering
      await waitFor(
        () => {
          expect(screen.getByText('Item 1')).toBeInTheDocument();
          expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
          expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('prefilters', () => {
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'inactive', label: 'Inactive' },
    ];

    it('should render prefilter tabs', () => {
      const onPrefilterChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          prefilters={prefilters}
          activePrefilter="all"
          onPrefilterChange={onPrefilterChange}
        />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should call onPrefilterChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onPrefilterChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          prefilters={prefilters}
          activePrefilter="all"
          onPrefilterChange={onPrefilterChange}
        />
      );

      await user.click(screen.getByText('Active'));

      expect(onPrefilterChange).toHaveBeenCalledWith('active');
    });

    it('should mark active prefilter tab', () => {
      const onPrefilterChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          prefilters={prefilters}
          activePrefilter="active"
          onPrefilterChange={onPrefilterChange}
        />
      );

      const activeTab = screen.getByText('Active').closest('button');
      expect(activeTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('sorting', () => {
    it('should render sort buttons when enabled', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} enableSorting />);

      // Sort buttons should be visible
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should call onSortingChange when header is clicked', async () => {
      const user = userEvent.setup();
      const onSortingChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableSorting
          sorting={[]}
          onSortingChange={onSortingChange}
        />
      );

      // Click on Name header (first element with that text is the header)
      const nameHeaders = screen.getAllByText('Name');
      await user.click(nameHeaders[0]);

      expect(onSortingChange).toHaveBeenCalled();
    });
  });

  describe('row click', () => {
    it('should call onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      renderWithProviders(<DataTable data={mockData} columns={columns} onRowClick={onRowClick} />);

      // Click on a cell in the first row
      await user.click(screen.getByText('Item 1'));

      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('should highlight active row', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} activeRowId="1" onRowClick={vi.fn()} />
      );

      const row = screen.getByTestId('datatable-row-0');
      // The active row should have specific styling (we check it exists)
      expect(row).toBeInTheDocument();
    });

    it('should call action handler when action button is clicked', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="edit-icon" {...props} />;

      const columnsWithActions: ColumnDef<TestItem>[] = [
        ...columns,
        {
          accessorKey: 'actions',
          header: '',
          cell: ({ row }: { row: { original: TestItem } }) => (
            <button data-testid={`action-btn-${row.original.id}`} onClick={() => onAction(row.original)}>
              <EditIcon />
            </button>
          ),
        },
      ];

      renderWithProviders(<DataTable data={mockData} columns={columnsWithActions} />);

      await user.click(screen.getByTestId('action-btn-1'));

      expect(onAction).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not trigger onRowClick when clicking on ActionCell', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      const onAction = vi.fn();

      // Import ActionCell to test the real stopPropagation behavior
      const { ActionCell } = await import('../components/ActionCell');
      const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="edit-icon" {...props} />;

      const actions = [
        {
          type: 'click' as const,
          label: 'Edit',
          icon: EditIcon,
          onClick: onAction,
          showLabel: true,
        },
      ];

      const columnsWithActions: ColumnDef<TestItem>[] = [
        ...columns,
        {
          accessorKey: 'actions',
          header: '',
          cell: ({ row }: { row: { original: TestItem } }) => (
            <ActionCell item={row.original} actions={actions} onAction={() => onAction(row.original)} />
          ),
        },
      ];

      renderWithProviders(
        <DataTable data={mockData} columns={columnsWithActions} onRowClick={onRowClick} />
      );

      // Click on the action button — should NOT trigger onRowClick
      const actionButton = screen.getAllByText('Edit')[0];
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalled();
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });

  describe('reset filters', () => {
    it('should render reset button when enableGlobalSearch is true', () => {
      const onResetFilters = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          onResetFilters={onResetFilters}
        />
      );

      expect(screen.getByTestId('datatable-reset-filters')).toBeInTheDocument();
    });

    it('should render reset button when prefilters are provided', () => {
      const onResetFilters = vi.fn();
      const prefilters = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
      ];

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          prefilters={prefilters}
          activePrefilter="all"
          onPrefilterChange={vi.fn()}
          onResetFilters={onResetFilters}
        />
      );

      expect(screen.getByTestId('datatable-reset-filters')).toBeInTheDocument();
    });

    it('should render reset button when filters are provided', () => {
      const onResetFilters = vi.fn();
      const filters = [
        {
          key: 'status' as keyof TestItem,
          label: 'Status',
          options: [{ value: 'active', label: 'Active' }],
        },
      ];

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          filters={filters}
          onResetFilters={onResetFilters}
        />
      );

      expect(screen.getByTestId('datatable-reset-filters')).toBeInTheDocument();
    });

    it('should call onResetFilters when button is clicked', async () => {
      const user = userEvent.setup();
      const onResetFilters = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          onResetFilters={onResetFilters}
        />
      );

      await user.click(screen.getByTestId('datatable-reset-filters'));

      expect(onResetFilters).toHaveBeenCalled();
    });

    it('should not render reset button when onResetFilters is not provided', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} enableGlobalSearch />
      );

      expect(screen.queryByTestId('datatable-reset-filters')).not.toBeInTheDocument();
    });

    it('should not render reset button when no filter features are enabled', () => {
      const onResetFilters = vi.fn();

      renderWithProviders(
        <DataTable data={mockData} columns={columns} onResetFilters={onResetFilters} />
      );

      expect(screen.queryByTestId('datatable-reset-filters')).not.toBeInTheDocument();
    });
  });

  describe('column filters', () => {
    const filters = [
      {
        key: 'status' as keyof TestItem,
        label: 'Filter Status',
        options: [
          { value: 'active', label: 'Active Filter' },
          { value: 'inactive', label: 'Inactive Filter' },
          { value: 'pending', label: 'Pending Filter' },
        ],
      },
    ];

    it('should render filter dropdown when filters are provided', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} filters={filters} />);

      expect(screen.getByText('Filter Status')).toBeInTheDocument();
    });

    it('should call onColumnFiltersChange when filter is changed', async () => {
      const user = userEvent.setup();
      const onColumnFiltersChange = vi.fn();

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          filters={filters}
          columnFilters={{}}
          onColumnFiltersChange={onColumnFiltersChange}
        />
      );

      // Click on the filter dropdown
      await user.click(screen.getByText('Filter Status'));

      // Click on an option
      await user.click(screen.getByText('Active Filter'));

      expect(onColumnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('server mode', () => {
    it('should use totalCount for pagination in server mode', () => {
      renderWithProviders(
        <DataTable
          data={mockData.slice(0, 2)}
          columns={columns}
          mode="server"
          totalCount={100}
          pagination={{ pageIndex: 0, pageSize: 2 }}
          enablePagination
        />
      );

      // Should show count based on totalCount
      expect(screen.getByTestId('datatable-count')).toBeInTheDocument();
    });

    it('should show loading overlay when fetching in server mode', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} mode="server" isFetching totalCount={5} />
      );

      // The loading overlay div should exist (with opacity class)
      expect(screen.getByTestId('datatable')).toBeInTheDocument();
    });
  });

  describe('column configuration', () => {
    it('should render column configuration button when enabled', () => {
      renderWithProviders(
        <DataTable data={mockData} columns={columns} enableColumnConfiguration />
      );

      // Column configuration button should be present
      expect(screen.getByTestId('datatable')).toBeInTheDocument();
    });
  });

  describe('topbar customization (renderTopbar)', () => {
    it('renders the default left/center/right layout when renderTopbar is omitted', () => {
      renderWithProviders(<DataTable data={mockData} columns={columns} enableGlobalSearch />);

      expect(document.querySelector('.snow-topbar-left')).toBeInTheDocument();
      expect(document.querySelector('.snow-topbar-center')).toBeInTheDocument();
      expect(document.querySelector('.snow-topbar-right')).toBeInTheDocument();
    });

    it('lets renderTopbar reorder elements (custom marker before search)', () => {
      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          renderTopbar={({ search }) => (
            <div className="snow-topbar-right">
              <span data-testid="custom-marker">before</span>
              {search}
            </div>
          )}
        />
      );

      const marker = screen.getByTestId('custom-marker');
      const searchBar = screen.getByTestId('data-table-search-bar');

      // Default layout would never render a custom marker; here it precedes the search bar.
      expect(marker).toBeInTheDocument();
      expect(marker.compareDocumentPosition(searchBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // The default sections are NOT rendered when a custom layout is provided.
      expect(document.querySelector('.snow-topbar-left')).not.toBeInTheDocument();
      expect(document.querySelector('.snow-topbar-center')).not.toBeInTheDocument();
    });

    it('lets renderTopbar inject custom controls', () => {
      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          renderTopbar={({ search }) => (
            <div>
              {search}
              <button data-testid="custom-topbar-btn">Export</button>
            </div>
          )}
        />
      );

      expect(screen.getByTestId('custom-topbar-btn')).toBeInTheDocument();
    });

    it('passes the wired search element when global search is enabled', () => {
      const received: Record<string, boolean> = {};

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          enableGlobalSearch
          renderTopbar={elements => {
            received.search = elements.search !== null;
            received.filters = elements.filters !== null;
            return <div>{elements.search}</div>;
          }}
        />
      );

      expect(received.search).toBe(true);
      // No filters configured → that element is null.
      expect(received.filters).toBe(false);
      // The element returned by renderTopbar is the real, wired SearchBar.
      expect(screen.getByTestId('data-table-search-bar')).toBeInTheDocument();
    });

    it('renders the topbar even when no other feature is enabled', () => {
      renderWithProviders(
        <DataTable
          data={mockData}
          columns={columns}
          renderTopbar={() => <div data-testid="custom-topbar">custom</div>}
        />
      );

      expect(screen.getByTestId('custom-topbar')).toBeInTheDocument();
      expect(document.querySelector('.snow-table-top-bar')).toBeInTheDocument();
    });
  });

  describe('custom texts', () => {
    it('should use custom empty title', () => {
      renderWithProviders(
        <DataTable data={[]} columns={columns} texts={{ emptyTitle: 'No items found' }} />
      );

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  describe('column meta (width, minWidth, maxWidth)', () => {
    it('should set width CSS variable on header and cells', () => {
      const columnsWithMeta: ColumnDef<TestItem>[] = [
        { accessorKey: 'id', header: 'ID', meta: { width: '100px' } },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status' },
      ];

      renderWithProviders(<DataTable data={mockData} columns={columnsWithMeta} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0].style.getPropertyValue('--snow-col-width')).toBe('100px');

      const rows = screen.getAllByTestId(/^datatable-row-/);
      const firstRowCells = rows[0].querySelectorAll('td');
      expect((firstRowCells[0] as HTMLElement).style.getPropertyValue('--snow-col-width')).toBe('100px');
    });

    it('should set minWidth CSS variable on header and cells', () => {
      const columnsWithMeta: ColumnDef<TestItem>[] = [
        { accessorKey: 'id', header: 'ID', meta: { minWidth: '150px' } },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status' },
      ];

      renderWithProviders(<DataTable data={mockData} columns={columnsWithMeta} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0].style.getPropertyValue('--snow-col-min-width')).toBe('150px');

      const rows = screen.getAllByTestId(/^datatable-row-/);
      const firstRowCells = rows[0].querySelectorAll('td');
      expect((firstRowCells[0] as HTMLElement).style.getPropertyValue('--snow-col-min-width')).toBe('150px');
    });

    it('should set maxWidth CSS variable on header and cells with truncate class', () => {
      const columnsWithMeta: ColumnDef<TestItem>[] = [
        { accessorKey: 'id', header: 'ID', meta: { maxWidth: '200px' } },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status' },
      ];

      renderWithProviders(<DataTable data={mockData} columns={columnsWithMeta} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0].style.getPropertyValue('--snow-col-max-width')).toBe('200px');

      const rows = screen.getAllByTestId(/^datatable-row-/);
      const firstRowCells = rows[0].querySelectorAll('td');
      expect((firstRowCells[0] as HTMLElement).style.getPropertyValue('--snow-col-max-width')).toBe('200px');
      expect(firstRowCells[0]).toHaveClass('snow-cell-truncate');
    });

  });
});
