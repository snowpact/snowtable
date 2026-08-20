/**
 * Date helpers for the date-range filter and its calendar.
 *
 * All comparisons use ISO `'YYYY-MM-DD'` strings, whose lexical order equals
 * chronological order — so the filter needs no `Date` parsing and is immune to
 * timezone drift. The `Date`-based helpers are for the calendar grid only and
 * are careful to stay in LOCAL time (never `new Date('2024-01-01')`, which is
 * parsed as UTC and shifts a day in negative-offset zones).
 */

import type { Row } from '@tanstack/react-table';

/** Parse an ISO `'YYYY-MM-DD'` (or ISO datetime) into a LOCAL `Date`, or `null`. */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a LOCAL `Date` as `'YYYY-MM-DD'` (never `toISOString`, which is UTC). */
export function formatISODate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const dayPart = (raw: string | undefined): string => (raw ?? '').slice(0, 10);

/**
 * TanStack `filterFn` for a date range. `filterValue` is the positional
 * `[from, to]` produced by `encodeDateRange` — always both bounds (a single day
 * is `[day, day]`). Both bounds are inclusive. Reads the RAW value from
 * `row.original` rather than `row.getValue()`, which may be a derived
 * `searchableValue` string.
 */
export function dateRangeFilter<T>(row: Row<T>, columnId: string, filterValue: string[]): boolean {
  if (!Array.isArray(filterValue)) return true;
  const from = dayPart(filterValue[0]);
  const to = dayPart(filterValue[1]);
  if (!from && !to) return true;

  const raw = (row.original as Record<string, unknown>)[columnId];
  if (raw == null) return false;
  const value = String(raw).slice(0, 10); // normalize any datetime to its day; makes the upper bound day-inclusive
  if (value.length < 10) return false;

  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}
