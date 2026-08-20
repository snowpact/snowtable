import { describe, expect, it } from 'vitest';

import { decodeDateRange, encodeDateRange, isDateRangeFilter, isTextFilter, type FilterConfig } from './filterConfig';

type Row = { createdAt: string; status: string };

describe('filterConfig', () => {
  describe('encodeDateRange', () => {
    it('encodes both bounds positionally', () => {
      expect(encodeDateRange({ from: '2024-01-01', to: '2024-12-31' })).toEqual(['2024-01-01', '2024-12-31']);
    });

    it('mirrors a single bound so the value always carries both ends (single day)', () => {
      expect(encodeDateRange({ from: '2024-01-01' })).toEqual(['2024-01-01', '2024-01-01']);
      expect(encodeDateRange({ to: '2024-12-31' })).toEqual(['2024-12-31', '2024-12-31']);
    });

    it('encodes an empty range as an empty array (clears the filter)', () => {
      expect(encodeDateRange({})).toEqual([]);
    });
  });

  describe('decodeDateRange', () => {
    it('decodes both bounds', () => {
      expect(decodeDateRange(['2024-01-01', '2024-12-31'])).toEqual({ from: '2024-01-01', to: '2024-12-31' });
    });

    it('decodes a single-day range', () => {
      expect(decodeDateRange(['2024-06-15', '2024-06-15'])).toEqual({ from: '2024-06-15', to: '2024-06-15' });
    });

    it('decodes undefined / empty to an empty range', () => {
      expect(decodeDateRange(undefined)).toEqual({ from: undefined, to: undefined });
      expect(decodeDateRange([])).toEqual({ from: undefined, to: undefined });
    });

    it('is the inverse of encodeDateRange for a complete range', () => {
      for (const range of [
        { from: '2024-01-01', to: '2024-12-31' },
        { from: '2024-06-15', to: '2024-06-15' },
      ]) {
        expect(decodeDateRange(encodeDateRange(range))).toEqual(range);
      }
    });
  });

  describe('isDateRangeFilter / isTextFilter', () => {
    it('narrows a dateRange config', () => {
      const filter: FilterConfig<Row> = { type: 'dateRange', key: 'createdAt', label: 'Created' };
      expect(isDateRangeFilter(filter)).toBe(true);
      expect(isTextFilter(filter)).toBe(false);
    });

    it('narrows a text config', () => {
      const filter: FilterConfig<Row> = { type: 'text', key: 'status', label: 'Status' };
      expect(isTextFilter(filter)).toBe(true);
      expect(isDateRangeFilter(filter)).toBe(false);
    });

    it('is false for a categorical config (with or without explicit type)', () => {
      const implicit: FilterConfig<Row> = { key: 'status', label: 'Status', options: [] };
      const explicit: FilterConfig<Row> = { type: 'select', key: 'status', label: 'Status', options: [] };
      expect(isDateRangeFilter(implicit)).toBe(false);
      expect(isTextFilter(explicit)).toBe(false);
    });
  });
});
