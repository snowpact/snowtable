import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SnowClientDataTable } from './SnowClientDataTable';
import { SnowColumnConfig } from './types';
import { deriveColumnConfigurationId } from './utils';

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
  email: string;
};

const mockData: TestItem[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
];

const columnConfig: SnowColumnConfig<TestItem>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

describe('SnowClientDataTable', () => {
  it('renders a subHeader row from the callback', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['subheader-client']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        subHeader={({ rows }) => ({ name: 'Total', email: String(rows.length) })}
      />
    );

    await screen.findByText('John Doe'); // wait for data to load
    const row = screen.getByTestId('datatable-subheader');
    expect(within(row).getByText('Total')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument(); // rows.length across all filtered rows
  });

  it('should render DataTable with data', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    // Wait for data to load
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('should render column headers', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    // Wait for data to load
    await screen.findByText('John Doe');

    // Check headers (using getAllByText as headers appear in desktop and mobile views)
    const idHeaders = screen.getAllByText('ID');
    const nameHeaders = screen.getAllByText('Name');
    const emailHeaders = screen.getAllByText('Email');

    expect(idHeaders.length).toBeGreaterThan(0);
    expect(nameHeaders.length).toBeGreaterThan(0);
    expect(emailHeaders.length).toBeGreaterThan(0);
  });

  it('should show loading state initially', () => {
    const fetchAllItemsEndpoint = vi.fn().mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-loading']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    // Should show skeleton or loading state (table with empty rows)
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should render with prefilters', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-prefilter']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        prefilters={prefilters}
      />
    );

    await screen.findByText('John Doe');

    // Prefilter tabs should be visible
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should call fetchAllItemsEndpoint on mount', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-fetch']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    await screen.findByText('John Doe');

    expect(fetchAllItemsEndpoint).toHaveBeenCalledTimes(1);
  });

  it('should render empty state when no data', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue([]);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-empty']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    // Should show empty state
    expect(await screen.findByTestId('datatable-empty')).toBeInTheDocument();
  });

  it('should hide columns marked as hidden', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);
    const configWithHidden: SnowColumnConfig<TestItem>[] = [
      { key: 'id', label: 'ID', hidden: true },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ];

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-hidden']}
        columnConfig={configWithHidden}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
      />
    );

    await screen.findByText('John Doe');

    // ID column should not be visible
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
    // But Name and Email should be (using getAllByText as they appear in desktop and mobile views)
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
  });

  it('should filter data when typing in search bar with enableGlobalSearch', async () => {
    const user = userEvent.setup();
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-items-search']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        enableGlobalSearch
        enablePagination={false}
      />
    );

    // Wait for data to load
    await screen.findByText('John Doe');

    // All items should be visible initially
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Type in search bar
    const searchInput = screen.getByTestId('data-table-search-bar');
    await user.type(searchInput, 'John');

    // Wait for debounce (500ms) + filtering
    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});

describe('SnowClientDataTable queryKey change', () => {
  it('should not freeze when queryKey changes at runtime', async () => {
    const dataA: TestItem[] = [
      { id: 'a1', name: 'Alice', email: 'alice@example.com' },
    ];
    const dataB: TestItem[] = [
      { id: 'b1', name: 'Bob', email: 'bob@example.com' },
    ];

    const fetchEndpoint = vi.fn().mockResolvedValue(dataA);

    const { rerender } = renderWithProviders(
      <SnowClientDataTable
        queryKey={['items', 'a']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchEndpoint}
        enablePagination
      />
    );

    // First render — data A loads
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    // Change queryKey — simulates user picking a different category
    fetchEndpoint.mockResolvedValue(dataB);
    rerender(
      <SnowClientDataTable
        queryKey={['items', 'b']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchEndpoint}
        enablePagination
      />
    );

    // Should render data B without freezing
    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});

describe('SnowClientDataTable with persistState', () => {
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
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-persist']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        persistState
        enableGlobalSearch
      />
    );

    await screen.findByText('John Doe');

    // Reset button should always be visible when enableGlobalSearch is true
    expect(screen.getByTestId('datatable-reset-filters')).toBeInTheDocument();
  });

  it('should persist prefilter to URL', async () => {
    const user = userEvent.setup();
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-persist']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        prefilters={prefilters}
        persistState
      />
    );

    await screen.findByText('John Doe');

    // Click on "Active" prefilter
    await user.click(screen.getByText('Active'));

    // Should be stored in URL
    expect(getUrlParam(storageKey('prefilter'))).toBe('active');
  });

  it('should restore prefilter from URL', async () => {
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    // Pre-set URL with prefilter
    const params = new URLSearchParams();
    params.set(storageKey('prefilter'), 'active');
    setupLocationMock(params.toString());

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-persist']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        prefilters={prefilters}
        persistState
      />
    );

    await screen.findByText('John Doe');

    // "Active" tab should be selected (has data-state="active")
    const activeTab = screen.getByText('Active').closest('button');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('should reset all state when reset button is clicked', async () => {
    const user = userEvent.setup();
    const fetchAllItemsEndpoint = vi.fn().mockResolvedValue(mockData);
    const prefilters = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
    ];

    // Pre-set URL with various values (use 'John' as search to match 'John Doe')
    const params = new URLSearchParams();
    params.set(storageKey('prefilter'), 'active');
    params.set(storageKey('search'), 'John');
    params.set(storageKey('page'), '2');
    setupLocationMock(params.toString());

    renderWithProviders(
      <SnowClientDataTable
        queryKey={['test-persist']}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={fetchAllItemsEndpoint}
        prefilters={prefilters}
        persistState
        enableGlobalSearch
      />
    );

    await screen.findByText('John Doe');

    // Reset button should be visible because URL has active filters
    const resetButton = screen.getByTestId('datatable-reset-filters');
    await user.click(resetButton);

    // URL params should be cleared
    expect(getUrlParam(storageKey('prefilter'))).toBeNull();
    expect(getUrlParam(storageKey('search'))).toBeNull();
    expect(getUrlParam(storageKey('page'))).toBeNull();

    // "All" tab should be selected (first prefilter = default)
    const allTab = screen.getByText('All').closest('button');
    expect(allTab).toHaveAttribute('data-state', 'active');
  });
});

describe('SnowClientDataTable column configuration cookie', () => {
  // Two tables can legitimately share the very same columns for different resources (e.g. the
  // checkout-session tables in ditib-si), so the cookie is scoped by queryKey, not by columns.
  const plantConfigCookie = (queryKey: string[], visibility: Record<string, boolean>) => {
    const cookieId = deriveColumnConfigurationId(queryKey);
    document.cookie = `datatable-config-${cookieId}=${encodeURIComponent(JSON.stringify(visibility))}; path=/`;
  };

  beforeEach(() => {
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  const renderTable = (queryKey: string[]) =>
    renderWithProviders(
      <SnowClientDataTable
        queryKey={queryKey}
        columnConfig={columnConfig}
        fetchAllItemsEndpoint={vi.fn().mockResolvedValue(mockData)}
        enableColumnConfiguration
      />
    );

  // The responsive layout also renders column labels, so target the real `<th>`.
  const emailHeaders = () => screen.queryAllByRole('columnheader', { name: 'Email' });

  it('applies the configuration saved under its own queryKey', async () => {
    plantConfigCookie(['table-a'], { email: false });

    renderTable(['table-a']);

    await screen.findByTestId('datatable');
    await waitFor(() => expect(emailHeaders()).toHaveLength(0));
  });

  it('does not share the cookie with a table that has identical columns but another queryKey', async () => {
    plantConfigCookie(['table-a'], { email: false });

    renderTable(['table-b']);

    await screen.findByTestId('datatable');
    await waitFor(() => expect(emailHeaders().length).toBeGreaterThan(0));
  });
});
