import { ColumnDef } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';

import { useSnowColumns } from './useSnowColumns';
import type { FilterConfig } from '../core/filterConfig';
import { SnowColumnConfig, TableAction, IconComponent } from '../types';

import { renderHookWithProviders } from '../test/test-utils';

// Simple mock icon component
const MockIcon: IconComponent = props => <svg {...props} data-testid="mock-icon" />;

type TestData = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type InternalColumnDef<T extends object> = ColumnDef<T, unknown> & { accessorKey: string };

describe('useSnowColumns', () => {
  const baseColumnConfig: SnowColumnConfig<TestData>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  describe('column transformation', () => {
    it('should transform columnConfig into ColumnDef array', () => {
      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: baseColumnConfig,
          mode: 'client',
        })
      );

      const columns = result.current.columns as InternalColumnDef<TestData>[];
      expect(columns).toHaveLength(3);
      expect(columns[0].accessorKey).toBe('id');
      expect(columns[1].accessorKey).toBe('name');
      expect(columns[2].accessorKey).toBe('email');
    });

    it('should filter out hidden columns', () => {
      const configWithHidden: SnowColumnConfig<TestData>[] = [
        { key: 'id', label: 'ID', hidden: true },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configWithHidden,
          mode: 'client',
        })
      );

      const columns = result.current.columns as InternalColumnDef<TestData>[];

      expect(result.current.columns).toHaveLength(2);
      expect(columns[0].accessorKey).toBe('name');
      expect(columns[1].accessorKey).toBe('email');
    });

    it('should use label from config or fallback to translation key', () => {
      const configMixed: SnowColumnConfig<TestData>[] = [
        { key: 'id', label: 'Custom ID Label' },
        { key: 'name' }, // No label, should use t('data.name')
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configMixed,
          mode: 'client',
        })
      );

      expect(result.current.columns[0].header).toBe('Custom ID Label');
      expect(result.current.columns[1].header).toBe('data.name');
    });

    it('should enable sorting by default', () => {
      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: baseColumnConfig,
          mode: 'client',
        })
      );

      expect(result.current.columns[0].enableSorting).toBe(true);
    });

    it('should disable sorting when sortable is false', () => {
      const configWithSortable: SnowColumnConfig<TestData>[] = [
        { key: 'id', label: 'ID', sortable: false },
        { key: 'name', label: 'Name', sortable: true },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configWithSortable,
          mode: 'client',
        })
      );

      expect(result.current.columns[0].enableSorting).toBe(false);
      expect(result.current.columns[1].enableSorting).toBe(true);
    });
  });

  describe('global filter behavior', () => {
    it('should enable global filter for all columns in client mode', () => {
      const configWithSearch: SnowColumnConfig<TestData>[] = [
        { key: 'name', label: 'Name', searchableValue: row => row.name },
        { key: 'email', label: 'Email' },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configWithSearch,
          mode: 'client',
        })
      );

      // All columns should have global filter enabled in client mode
      expect(result.current.columns[0].enableGlobalFilter).toBe(true);
      expect(result.current.columns[1].enableGlobalFilter).toBe(true);
    });

    it('should disable global filter in server mode regardless of searchableValue', () => {
      const configWithSearch: SnowColumnConfig<TestData>[] = [
        { key: 'name', label: 'Name', searchableValue: row => row.name },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configWithSearch,
          mode: 'server',
        })
      );

      expect(result.current.columns[0].enableGlobalFilter).toBe(false);
    });
  });

  describe('actions column', () => {
    it('should add actions column when actions are provided', () => {
      const actions: TableAction<TestData, void>[] = [
        {
          type: 'click',
          icon: MockIcon,
          label: 'Edit',
          onClick: vi.fn(),
        },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: baseColumnConfig,
          actions,
          mode: 'client',
        })
      );

      expect(result.current.columns).toHaveLength(4);
      const columns = result.current.columns as InternalColumnDef<TestData>[];
      expect(columns[3].accessorKey).toBe('actions');
      expect(columns[3].enableSorting).toBe(false);
      expect(columns[3].enableHiding).toBe(false);
    });

    it('should not add actions column when no actions provided', () => {
      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: baseColumnConfig,
          mode: 'client',
        })
      );

      const columns = result.current.columns as InternalColumnDef<TestData>[];
      expect(columns).toHaveLength(3);
      expect(columns.find(c => c.accessorKey === 'actions')).toBeUndefined();
    });
  });

  describe('column filters', () => {
    it('should enable column filter when filter config matches column key', () => {
      const filters = [{ key: 'status' as keyof TestData, label: 'Status', options: [] }];
      const configWithStatus: SnowColumnConfig<TestData>[] = [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: configWithStatus,
          filters,
          mode: 'client',
        })
      );

      expect(result.current.columns[0].enableColumnFilter).toBe(false);
      expect(result.current.columns[1].enableColumnFilter).toBe(true);
    });

    it('should select the filterFn based on the filter type', () => {
      const filters: FilterConfig<TestData>[] = [
        { type: 'dateRange', key: 'name', label: 'Created' },
        { key: 'status', label: 'Status', options: [] },
        { type: 'text', key: 'email', label: 'Email' },
      ];
      const config: SnowColumnConfig<TestData>[] = [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'email', label: 'Email' },
      ];

      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({ columnConfig: config, filters, mode: 'client' })
      );

      const columns = result.current.columns as (InternalColumnDef<TestData> & { filterFn?: string })[];
      expect(columns[0].filterFn).toBe('dateRange'); // 'name' matched by the dateRange filter
      expect(columns[1].filterFn).toBe('multiSelect'); // 'status' matched by the categorical filter
      expect(columns[2].filterFn).toBe('text'); // 'email' matched by the text filter
    });
  });

  describe('handleAction', () => {
    it('should be a function', () => {
      const { result } = renderHookWithProviders(() =>
        useSnowColumns<TestData, void>({
          columnConfig: baseColumnConfig,
          mode: 'client',
        })
      );

      expect(typeof result.current.handleAction).toBe('function');
    });
  });
});
