/**
 * Hook for persisting table state (in the URL query by default).
 */

import { PaginationState, SortingState } from '@tanstack/react-table';
import { useCallback, useMemo, useRef, useState } from 'react';

import { decodeFiltersFromParam, encodeFiltersToParam } from '../utils';

// Storage key constants for URL params
export const STORAGE_KEY_PREFILTER = 'dt_prefilter';
export const STORAGE_KEY_SEARCH = 'dt_search';
export const STORAGE_KEY_PAGE = 'dt_page';
export const STORAGE_KEY_PAGE_SIZE = 'dt_pageSize';
export const STORAGE_KEY_FILTERS = 'dt_filters';
export const STORAGE_KEY_SORT_BY = 'dt_sortBy';
export const STORAGE_KEY_SORT_DESC = 'dt_sortDesc';

/**
 * Where the table reads/writes its persisted state (`dt_*` keys).
 *
 * Provide your own to let **your router** own the URL. The built-in default
 * writes with `history.replaceState`, which a client-side router doesn't observe:
 * its next navigation then serializes a location that predates the table's
 * writes and drops the `dt_*` params. Routed apps should pass a router-backed
 * storage (see `SnowClientDataTableProps.persistStorage`).
 */
export interface TableStateStorage {
  /** Return the persisted value for `key`, or `null`. */
  getItem: (key: string) => string | null;
  /** Persist `value` for `key` — or remove it when `value` is `null`. */
  setItem: (key: string, value: string | null) => void;
}

/** Default storage: the URL query string, written with `history.replaceState`. */
export const urlStateStorage: TableStateStorage = {
  getItem: key => {
    if (typeof window === 'undefined') return null;
    try {
      return new URL(window.location.href).searchParams.get(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;

    // Skip if value hasn't changed
    const currentValue = new URL(window.location.href).searchParams.get(key);
    if (currentValue === value) return;

    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }

    window.history.replaceState(window.history.state, '', url.toString());
  },
};

interface UseTableStatePersistOptions {
  enabled: boolean;
  defaultPrefilter?: string;
  defaultPageSize: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  storage?: TableStateStorage;
}

export const useTableStatePersist = ({
  enabled,
  defaultPrefilter,
  defaultPageSize,
  defaultSortBy,
  defaultSortOrder = 'asc',
  storage,
}: UseTableStatePersistOptions) => {
  const enabledRef = useRef(enabled);
  const defaultPageSizeRef = useRef(defaultPageSize);
  // Assigned during render (before the state initializers below read from it) so
  // an inline `persistStorage={{…}}` object doesn't have to be memoized.
  const storageRef = useRef<TableStateStorage>(storage ?? urlStateStorage);
  storageRef.current = storage ?? urlStateStorage;

  const getStoredValue = (key: string) => storageRef.current.getItem(key);
  const setStoredValue = (key: string, value: string | null) => storageRef.current.setItem(key, value);

  // ============================================
  // Prefilter
  // ============================================
  const [activePrefilter, setActivePrefilterState] = useState<string | undefined>(() => {
    if (enabled) {
      const stored = getStoredValue(STORAGE_KEY_PREFILTER);
      if (stored) return stored;
    }
    return defaultPrefilter;
  });

  const setActivePrefilter = useCallback((value: string | undefined) => {
    setActivePrefilterState(value);
    if (enabledRef.current) setStoredValue(STORAGE_KEY_PREFILTER, value ?? null);
  }, []);

  // ============================================
  // Search
  // ============================================
  const [globalFilter, setGlobalFilterState] = useState(() => {
    if (enabled) {
      return getStoredValue(STORAGE_KEY_SEARCH) ?? '';
    }
    return '';
  });

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value);
    if (enabledRef.current) setStoredValue(STORAGE_KEY_SEARCH, value || null);
  }, []);

  // ============================================
  // Pagination
  // ============================================
  const [pagination, setPaginationState] = useState<PaginationState>(() => {
    if (enabled) {
      const page = getStoredValue(STORAGE_KEY_PAGE);
      const size = getStoredValue(STORAGE_KEY_PAGE_SIZE);
      return {
        pageIndex: page ? parseInt(page, 10) - 1 : 0,
        pageSize: size ? parseInt(size, 10) : defaultPageSize,
      };
    }
    return { pageIndex: 0, pageSize: defaultPageSize };
  });

  const setPagination = useCallback((value: PaginationState | ((prev: PaginationState) => PaginationState)) => {
    setPaginationState(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      // Only update URL if values actually changed
      if (enabledRef.current && (prev.pageIndex !== newValue.pageIndex || prev.pageSize !== newValue.pageSize)) {
        setStoredValue(STORAGE_KEY_PAGE, newValue.pageIndex > 0 ? String(newValue.pageIndex + 1) : null);
        setStoredValue(
          STORAGE_KEY_PAGE_SIZE,
          newValue.pageSize !== defaultPageSizeRef.current ? String(newValue.pageSize) : null
        );
      }
      return newValue;
    });
  }, []);

  // ============================================
  // Column Filters
  // ============================================
  const [columnFilters, setColumnFiltersState] = useState<Record<string, string[]>>(() => {
    if (enabled) {
      const stored = getStoredValue(STORAGE_KEY_FILTERS);
      if (stored) {
        return decodeFiltersFromParam(stored);
      }
    }
    return {};
  });

  const setColumnFilters = useCallback((value: Record<string, string[]>) => {
    setColumnFiltersState(value);
    if (enabledRef.current) {
      const hasFilters = Object.keys(value).length > 0;
      const encoded = hasFilters ? encodeFiltersToParam(value) : null;
      setStoredValue(STORAGE_KEY_FILTERS, encoded);
    }
  }, []);

  // ============================================
  // Sorting
  // ============================================
  const [sorting, setSortingState] = useState<SortingState>(() => {
    if (enabled) {
      const sortBy = getStoredValue(STORAGE_KEY_SORT_BY);
      const sortDesc = getStoredValue(STORAGE_KEY_SORT_DESC);
      if (sortBy) {
        return [{ id: sortBy, desc: sortDesc === 'true' }];
      }
    }
    return defaultSortBy ? [{ id: defaultSortBy, desc: defaultSortOrder === 'desc' }] : [];
  });

  const setSorting = useCallback((value: SortingState | ((prev: SortingState) => SortingState)) => {
    setSortingState(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      if (enabledRef.current) {
        if (newValue.length > 0) {
          setStoredValue(STORAGE_KEY_SORT_BY, newValue[0].id);
          setStoredValue(STORAGE_KEY_SORT_DESC, String(newValue[0].desc));
        } else {
          setStoredValue(STORAGE_KEY_SORT_BY, null);
          setStoredValue(STORAGE_KEY_SORT_DESC, null);
        }
      }
      return newValue;
    });
  }, []);

  // ============================================
  // Has active filters (any state differs from defaults)
  // ============================================

  const hasActiveFilters = useMemo(() => {
    const defaultSorting = defaultSortBy ? [{ id: defaultSortBy, desc: defaultSortOrder === 'desc' }] : [];

    // Search is active
    if (globalFilter !== '') return true;
    // Prefilter differs from default
    if (activePrefilter !== defaultPrefilter) return true;
    // Column filters are active
    if (Object.keys(columnFilters).length > 0) return true;
    // Sorting differs from default
    if (sorting.length !== defaultSorting.length) return true;
    if (sorting.length > 0 && defaultSorting.length > 0) {
      if (sorting[0].id !== defaultSorting[0].id || sorting[0].desc !== defaultSorting[0].desc) return true;
    }
    return false;
  }, [globalFilter, activePrefilter, defaultPrefilter, columnFilters, sorting, defaultSortBy, defaultSortOrder]);

  // ============================================
  // Reset to defaults (keeps pageSize unchanged)
  // ============================================
  const resetToDefaults = useCallback(() => {
    // Clear storage (except pageSize)
    if (enabledRef.current) {
      setStoredValue(STORAGE_KEY_PREFILTER, null);
      setStoredValue(STORAGE_KEY_SEARCH, null);
      setStoredValue(STORAGE_KEY_PAGE, null);
      // Don't clear pageSize - user preference should be preserved
      setStoredValue(STORAGE_KEY_FILTERS, null);
      setStoredValue(STORAGE_KEY_SORT_BY, null);
      setStoredValue(STORAGE_KEY_SORT_DESC, null);
    }
    // Reset states to defaults (preserve current pageSize)
    setActivePrefilterState(defaultPrefilter);
    setGlobalFilterState('');
    setPaginationState(prev => ({ pageIndex: 0, pageSize: prev.pageSize }));
    setColumnFiltersState({});
    setSortingState(defaultSortBy ? [{ id: defaultSortBy, desc: defaultSortOrder === 'desc' }] : []);
  }, [defaultPrefilter, defaultSortBy, defaultSortOrder]);

  return {
    activePrefilter,
    setActivePrefilter,
    globalFilter,
    setGlobalFilter,
    pagination,
    setPagination,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    resetToDefaults,
    hasActiveFilters,
  };
};
