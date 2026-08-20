import type { Row } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { dateRangeFilter, formatISODate, parseISODate } from './dateRange';

type Item = { createdAt: string };

// Build a minimal TanStack Row stub. `getValue` intentionally returns a value
// DIFFERENT from `original` to prove the filterFn reads the raw field.
const rowWith = (createdAt: unknown, derived = 'DERIVED-SEARCH-VALUE'): Row<Item> =>
  ({ original: { createdAt }, getValue: () => derived }) as unknown as Row<Item>;

describe('parseISODate', () => {
  it('parses to a LOCAL date without a UTC day-shift', () => {
    const d = parseISODate('2024-01-01')!;
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0); // January
    expect(d.getDate()).toBe(1); // not 31 Dec of the previous year
  });

  it('reads only the date part of an ISO datetime', () => {
    const d = parseISODate('2024-06-15T23:00:00Z')!;
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  it('returns null for malformed input', () => {
    expect(parseISODate('not-a-date')).toBeNull();
    expect(parseISODate('')).toBeNull();
  });
});

describe('formatISODate', () => {
  it('formats a local date and zero-pads month/day', () => {
    expect(formatISODate(new Date(2024, 0, 1))).toBe('2024-01-01');
    expect(formatISODate(new Date(2024, 2, 5))).toBe('2024-03-05');
  });

  it('round-trips with parseISODate', () => {
    expect(formatISODate(parseISODate('2024-07-09')!)).toBe('2024-07-09');
  });
});

describe('dateRangeFilter', () => {
  const both = ['2024-06-01', '2024-06-30'];

  it('includes a value inside the range', () => {
    expect(dateRangeFilter(rowWith('2024-06-15'), 'createdAt', both)).toBe(true);
  });

  it('is inclusive on both bounds', () => {
    expect(dateRangeFilter(rowWith('2024-06-01'), 'createdAt', both)).toBe(true);
    expect(dateRangeFilter(rowWith('2024-06-30'), 'createdAt', both)).toBe(true);
  });

  it('excludes values outside the range', () => {
    expect(dateRangeFilter(rowWith('2024-05-31'), 'createdAt', both)).toBe(false);
    expect(dateRangeFilter(rowWith('2024-07-01'), 'createdAt', both)).toBe(false);
  });

  it('matches only the single day for a single-day range [A, A]', () => {
    const single = ['2024-06-15', '2024-06-15'];
    expect(dateRangeFilter(rowWith('2024-06-15'), 'createdAt', single)).toBe(true);
    expect(dateRangeFilter(rowWith('2024-06-14'), 'createdAt', single)).toBe(false);
    expect(dateRangeFilter(rowWith('2024-06-16'), 'createdAt', single)).toBe(false);
  });

  it('passes everything when there is no active bound', () => {
    expect(dateRangeFilter(rowWith('2024-06-15'), 'createdAt', [])).toBe(true);
  });

  it('treats a same-day ISO datetime value as within an inclusive upper bound', () => {
    expect(dateRangeFilter(rowWith('2024-06-30T23:00:00Z'), 'createdAt', both)).toBe(true);
  });

  it('excludes missing or malformed values', () => {
    expect(dateRangeFilter(rowWith(null), 'createdAt', both)).toBe(false);
    expect(dateRangeFilter(rowWith(undefined), 'createdAt', both)).toBe(false);
    expect(dateRangeFilter(rowWith('abc'), 'createdAt', both)).toBe(false);
  });

  it('reads the raw original value, not row.getValue()', () => {
    // getValue() would return 'DERIVED-SEARCH-VALUE' (outside any date range);
    // the filter must use row.original.createdAt instead.
    expect(dateRangeFilter(rowWith('2024-06-15'), 'createdAt', both)).toBe(true);
  });
});
