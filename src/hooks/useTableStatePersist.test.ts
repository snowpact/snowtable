import { renderHook } from '@testing-library/react';
import { act, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTableStatePersist, type TableStateStorage } from './useTableStatePersist';

import { renderHookWithProviders } from '../test/test-utils';

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

describe('useTableStatePersist', () => {
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

  it('should initialize with defaults when persistence is disabled', () => {
    const { result } = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: false,
        defaultPrefilter: 'all',
        defaultPageSize: 25,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.activePrefilter).toBe('all');
    expect(result.current.globalFilter).toBe('');
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 25 });
    expect(result.current.columnFilters).toEqual({});
    expect(result.current.sorting).toEqual([{ id: 'createdAt', desc: false }]);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should read persisted values from URL when enabled', () => {
    // Prepare URL with persisted state
    const params = new URLSearchParams();
    params.set('dt_prefilter', 'active');
    params.set('dt_search', 'john');
    params.set('dt_page', '2');
    params.set('dt_pageSize', '50');
    params.set('dt_sortBy', 'updatedAt');
    params.set('dt_sortDesc', 'true');
    params.set('dt_filters', 'status:approved,canceled');

    setupLocationMock(params.toString());

    const { result } = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: true,
        defaultPrefilter: 'all',
        defaultPageSize: 25,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.activePrefilter).toBe('active');
    expect(result.current.globalFilter).toBe('john');
    expect(result.current.pagination).toEqual({ pageIndex: 1, pageSize: 50 }); // page=2 -> index=1
    expect(result.current.columnFilters).toEqual({ status: ['approved', 'canceled'] });
    expect(result.current.sorting).toEqual([{ id: 'updatedAt', desc: true }]);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should persist values to URL when setters are called', () => {
    const { result } = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: true,
        defaultPrefilter: 'all',
        defaultPageSize: 10,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    // Call all setters
    act(() => {
      result.current.setActivePrefilter('active');
      result.current.setGlobalFilter('search term');
      result.current.setPagination({ pageIndex: 2, pageSize: 20 });
      result.current.setColumnFilters({ travelId: ['id1', 'id2'] });
      result.current.setSorting([{ id: 'updatedAt', desc: true }]);
    });

    // Check the final URL state
    const url = new URL(currentUrl);
    const searchParams = url.searchParams;

    expect(searchParams.get('dt_prefilter')).toBe('active');
    expect(searchParams.get('dt_search')).toBe('search term');
    // pageIndex 2 -> page 3
    expect(searchParams.get('dt_page')).toBe('3');
    // pageSize 20 (different from default 10) should be stored
    expect(searchParams.get('dt_pageSize')).toBe('20');
    // filters encoded into single param
    expect(searchParams.get('dt_filters')).toBe('travelId:id1,id2');
    expect(searchParams.get('dt_sortBy')).toBe('updatedAt');
    expect(searchParams.get('dt_sortDesc')).toBe('true');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should restore persisted filters on new hook instance', () => {
    // First render: set some filters and let them be persisted
    const first = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: true,
        defaultPrefilter: 'all',
        defaultPageSize: 10,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    act(() => {
      first.result.current.setColumnFilters({
        status: ['ACTIVE', 'CLOSED'],
        travelId: ['t1'],
      });
    });

    // Use the updated currentUrl (which was updated by mockReplaceState)
    const newUrl = new URL(currentUrl);
    setupLocationMock(newUrl.search.substring(1)); // Remove leading '?'

    // Second render: new instance should read from URL
    const second = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: true,
        defaultPrefilter: 'all',
        defaultPageSize: 10,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    expect(second.result.current.columnFilters).toEqual({
      status: ['ACTIVE', 'CLOSED'],
      travelId: ['t1'],
    });
  });

  it('should reset to defaults and clear URL parameters (except pageSize)', () => {
    const { result } = renderHookWithProviders(() =>
      useTableStatePersist({
        enabled: true,
        defaultPrefilter: 'all',
        defaultPageSize: 10,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'asc',
      })
    );

    // Set values
    act(() => {
      result.current.setActivePrefilter('active');
      result.current.setGlobalFilter('search');
      result.current.setPagination({ pageIndex: 1, pageSize: 20 });
      result.current.setColumnFilters({ status: ['ACTIVE'] });
      result.current.setSorting([{ id: 'updatedAt', desc: true }]);
    });

    act(() => {
      result.current.resetToDefaults();
    });

    // Check the final URL state (pageSize should be preserved)
    const url = new URL(currentUrl);
    const searchParams = url.searchParams;

    expect(searchParams.get('dt_prefilter')).toBeNull();
    expect(searchParams.get('dt_search')).toBeNull();
    expect(searchParams.get('dt_page')).toBeNull();
    expect(searchParams.get('dt_pageSize')).toBe('20'); // pageSize preserved
    expect(searchParams.get('dt_filters')).toBeNull();
    expect(searchParams.get('dt_sortBy')).toBeNull();
    expect(searchParams.get('dt_sortDesc')).toBeNull();

    expect(result.current.activePrefilter).toBe('all');
    expect(result.current.globalFilter).toBe('');
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 20 }); // pageSize preserved
    expect(result.current.columnFilters).toEqual({});
    expect(result.current.sorting).toEqual([{ id: 'createdAt', desc: false }]);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  describe('custom storage', () => {
    const makeStore = (seed: [string, string][] = []) => {
      const store = new Map(seed);
      const storage: TableStateStorage = {
        getItem: key => store.get(key) ?? null,
        setItem: (key, value) => {
          if (value === null) store.delete(key);
          else store.set(key, value);
        },
      };
      return { store, storage };
    };

    it('reads and writes through the given storage, leaving the URL alone', () => {
      const { store, storage } = makeStore([['dt_search', 'seeded']]);

      const { result } = renderHookWithProviders(() =>
        useTableStatePersist({ enabled: true, defaultPageSize: 10, storage })
      );

      expect(result.current.globalFilter).toBe('seeded');

      act(() => result.current.setColumnFilters({ status: ['active'] }));

      expect(store.get('dt_filters')).toBe('status:active');
      // The whole point: no write behind the router's back.
      expect(mockReplaceState).not.toHaveBeenCalled();
    });

    it('persists once per change under StrictMode (state updaters stay pure)', () => {
      // React double-invokes state updaters in StrictMode. Persisting from inside
      // one would write twice — and, with a router-backed storage, navigate twice.
      const setItem = vi.fn();
      const storage: TableStateStorage = { getItem: () => null, setItem };

      const { result } = renderHook(() => useTableStatePersist({ enabled: true, defaultPageSize: 10, storage }), {
        wrapper: StrictMode,
      });

      act(() => result.current.setPagination({ pageIndex: 2, pageSize: 10 }));
      expect(setItem.mock.calls.filter(([key]) => key === 'dt_page')).toHaveLength(1);

      setItem.mockClear();
      act(() => result.current.setSorting([{ id: 'name', desc: true }]));
      expect(setItem.mock.calls.filter(([key]) => key === 'dt_sortBy')).toHaveLength(1);
    });
  });
});
