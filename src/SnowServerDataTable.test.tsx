import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SnowServerDataTable } from './SnowServerDataTable';
import { ServerPaginatedResponse, SnowColumnConfig } from './types';

import { renderWithProviders, screen, userEvent, waitFor, within } from './test/test-utils';

// Store the current URL state for mocking
let currentUrl = 'http://localhost:3000/';

// Mock window.history.replaceState to update our URL state
const mockReplaceState = vi.fn((_state, _title, url) => {
  if (url) {
    currentUrl = url.toString();
  }
});

// Set up location mock
const setupLocationMock = (search: string = '') => {
  currentUrl = `http://localhost:3000/${search ? `?${search}` : ''}`;
  Object.defineProperty(window, 'location', {
    value: {
      get href() {
        return currentUrl;
      },
      get search() {
        const url = new URL(currentUrl);
        return url.search;
      },
      get pathname() {
        const url = new URL(currentUrl);
        return url.pathname;
      },
    },
    writable: true,
    configurable: true,
  });
};

// Helper to get URL param from the current URL state
const getUrlParam = (key: string): string | null => {
  const url = new URL(currentUrl);
  return url.searchParams.get(key);
};

type TestItem = {
  id: string;
  name: string;
  status: string;
};

const mockData: TestItem[] = [
  { id: '1', name: 'Server Item 1', status: 'active' },
  { id: '2', name: 'Server Item 2', status: 'inactive' },
  { id: '3', name: 'Server Item 3', status: 'active' },
];

const mockServerResponse: ServerPaginatedResponse<TestItem> = {
  items: mockData,
  totalItemCount: 3,
};

const columnConfig: SnowColumnConfig<TestItem>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

describe('SnowServerDataTable', () => {
  it('renders a subHeader row from the callback (current page items)', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['subheader-server']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        subHeader={({ rows }) => ({ name: 'Total', status: String(rows.length) })}
      />
    );

    await screen.findByText('Server Item 1'); // wait for data to load
    const row = screen.getByTestId('datatable-subheader');
    expect(within(row).getByText('Total')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument(); // items on the current page
  });

  it('should render DataTable with server data', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-items']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
      />
    );

    // Wait for data to load
    expect(await screen.findByText('Server Item 1')).toBeInTheDocument();
    expect(screen.getByText('Server Item 2')).toBeInTheDocument();
    expect(screen.getByText('Server Item 3')).toBeInTheDocument();
  });

  it('should render column headers', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-headers']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
      />
    );

    await screen.findByText('Server Item 1');

    // Headers appear in both desktop and mobile views
    expect(screen.getAllByText('ID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('should show loading state initially', () => {
    const fetchServerEndpoint = vi.fn().mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-loading']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
      />
    );

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should call fetchServerEndpoint with pagination params', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-fetch']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        defaultPageSize={10}
      />
    );

    await screen.findByText('Server Item 1');

    expect(fetchServerEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
      })
    );
  });

  it('should render with prefilters', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All Items' },
      { id: 'active', label: 'Active Only' },
    ];

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-prefilters']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
      />
    );

    await screen.findByText('Server Item 1');

    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('Active Only')).toBeInTheDocument();
  });

  it('should render empty state when no data', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue({
      items: [],
      totalItemCount: 0,
    });

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-empty']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
      />
    );

    expect(await screen.findByTestId('datatable-empty')).toBeInTheDocument();
  });

  it('should hide columns marked as hidden', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const configWithHidden: SnowColumnConfig<TestItem>[] = [
      { key: 'id', label: 'ID', hidden: true },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ];

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-hidden']}
        columnConfig={configWithHidden}
        fetchServerEndpoint={fetchServerEndpoint}
      />
    );

    await screen.findByText('Server Item 1');

    // ID should not be present
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
    // Name and Status should be visible (appear in desktop and mobile views)
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('should pass prefilter to fetchServerEndpoint', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-prefilter-call']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
      />
    );

    await screen.findByText('Server Item 1');

    // First prefilter should be selected by default
    expect(fetchServerEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        prefilter: 'all',
      })
    );
  });
});

describe('SnowServerDataTable with persistState', () => {
  const storageKey = (key: string) => `dt_${key}`;

  beforeEach(() => {
    // Reset URL state
    currentUrl = 'http://localhost:3000/';

    // Mock history.replaceState
    Object.defineProperty(window.history, 'replaceState', {
      value: mockReplaceState,
      writable: true,
      configurable: true,
    });

    // Mock history.state
    Object.defineProperty(window.history, 'state', {
      value: null,
      writable: true,
      configurable: true,
    });

    // Setup location mock
    setupLocationMock();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show reset button when enableGlobalSearch is true', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        persistState
        enableGlobalSearch
      />
    );

    await screen.findByText('Server Item 1');

    // Reset button should always be visible when enableGlobalSearch is true
    expect(screen.getByTestId('datatable-reset-filters')).toBeInTheDocument();
  });

  it('should persist prefilter to URL', async () => {
    const user = userEvent.setup();
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
        persistState
      />
    );

    await screen.findByText('Server Item 1');

    // Click on "Active" prefilter
    await user.click(screen.getByText('Active'));

    // Should be stored in URL
    expect(getUrlParam(storageKey('prefilter'))).toBe('active');
  });

  it('should restore prefilter from URL', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    // Pre-set URL with prefilter
    const params = new URLSearchParams();
    params.set(storageKey('prefilter'), 'active');
    setupLocationMock(params.toString());

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
        persistState
      />
    );

    await screen.findByText('Server Item 1');

    // "Active" tab should be selected
    const activeTab = screen.getByText('Active').closest('button');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('should call fetchServerEndpoint with persisted prefilter', async () => {
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    // Pre-set URL with prefilter
    const params = new URLSearchParams();
    params.set(storageKey('prefilter'), 'active');
    setupLocationMock(params.toString());

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
        persistState
      />
    );

    await screen.findByText('Server Item 1');

    // Should call endpoint with persisted prefilter
    expect(fetchServerEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        prefilter: 'active',
      })
    );
  });

  it('should reset all state when reset button is clicked', async () => {
    const user = userEvent.setup();
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    // Pre-set URL with various values
    const params = new URLSearchParams();
    params.set(storageKey('prefilter'), 'active');
    params.set(storageKey('search'), 'test search');
    params.set(storageKey('page'), '2');
    params.set(storageKey('sortBy'), 'name');
    params.set(storageKey('sortDesc'), 'true');
    setupLocationMock(params.toString());

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={columnConfig}
        fetchServerEndpoint={fetchServerEndpoint}
        prefilters={prefilters}
        persistState
        enableGlobalSearch
      />
    );

    await screen.findByText('Server Item 1');

    // Reset button should be visible because URL has active filters
    const resetButton = screen.getByTestId('datatable-reset-filters');
    await user.click(resetButton);

    // URL params should be cleared
    expect(getUrlParam(storageKey('prefilter'))).toBeNull();
    expect(getUrlParam(storageKey('search'))).toBeNull();
    expect(getUrlParam(storageKey('page'))).toBeNull();
    expect(getUrlParam(storageKey('sortBy'))).toBeNull();
    expect(getUrlParam(storageKey('sortDesc'))).toBeNull();

    // "All" tab should be selected
    const allTab = screen.getByText('All').closest('button');
    expect(allTab).toHaveAttribute('data-state', 'active');
  });

  it('should persist sorting to URL', async () => {
    const user = userEvent.setup();
    const fetchServerEndpoint = vi.fn().mockResolvedValue(mockServerResponse);

    renderWithProviders(
      <SnowServerDataTable<TestItem, void>
        queryKey={['test-server-persist']}
        columnConfig={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name', sortable: true },
          { key: 'status', label: 'Status' },
        ]}
        fetchServerEndpoint={fetchServerEndpoint}
        persistState
        enableSorting
      />
    );

    await screen.findByText('Server Item 1');

    // Click on "Name" header to sort (first one is in table header)
    const nameHeaders = screen.getAllByText('Name');
    await user.click(nameHeaders[0]);

    // Should be stored in URL
    expect(getUrlParam(storageKey('sortBy'))).toBe('name');
    expect(getUrlParam(storageKey('sortDesc'))).toBe('false');
  });
});
