/**
 * Filter model for the DataTable topbar.
 *
 * Pure types + serialization helpers (no React), so the data model can be
 * imported anywhere without pulling in the UI components. `SingleFilterDropdown`
 * re-exports {@link FilterConfig} / {@link FilterOption} from here, so existing
 * import paths keep resolving unchanged.
 */

export type FilterOption = {
  label: string;
  value: string;
};

/**
 * Categorical (multi-select) filter — the historical filter shape.
 *
 * `type` is optional and defaults to `'select'`, so every pre-existing
 * `{ key, label, options }` config keeps type-checking with zero changes.
 */
export type CategoricalFilterConfig<T extends object> = {
  type?: 'select';
  key: keyof T;
  label: string;
  options: FilterOption[];
  multipleSelection?: boolean;
};

/**
 * Date-range filter over a column whose values are ISO `'YYYY-MM-DD'` strings
 * (or ISO datetimes starting with that date part).
 */
export type DateRangeFilterConfig<T extends object> = {
  type: 'dateRange';
  key: keyof T;
  label: string;
  /** Earliest selectable date in the calendar, ISO `'YYYY-MM-DD'`. */
  minDate?: string;
  /** Latest selectable date in the calendar, ISO `'YYYY-MM-DD'`. */
  maxDate?: string;
};

/**
 * Free-text "contains" filter (case-insensitive, SQL `LIKE`-style) over a column.
 */
export type TextFilterConfig<T extends object> = {
  type: 'text';
  key: keyof T;
  label: string;
  /** Placeholder shown in the text input; defaults to the label. */
  placeholder?: string;
};

export type FilterConfig<T extends object> =
  | CategoricalFilterConfig<T>
  | DateRangeFilterConfig<T>
  | TextFilterConfig<T>;

/** Runtime narrowing helpers used by the column/topbar wiring. */
export const isDateRangeFilter = <T extends object>(f: FilterConfig<T>): f is DateRangeFilterConfig<T> =>
  f.type === 'dateRange';

export const isTextFilter = <T extends object>(f: FilterConfig<T>): f is TextFilterConfig<T> => f.type === 'text';

// ============================================
// Date-range value serialization
// ============================================

export type DateRangeValue = {
  from?: string;
  to?: string;
};

/**
 * Serialize a date range into the shared `Record<string, string[]>` filter
 * channel as a positional `[from, to]` pair. A date filter always carries both
 * bounds — a single selected day is stored as `[day, day]` (open-ended ranges
 * do not exist). A fully-empty range becomes `[]`, which clears the filter.
 */
export const encodeDateRange = ({ from, to }: DateRangeValue): string[] => {
  const start = from || to;
  const end = to || from;
  return start && end ? [start, end] : [];
};

/** Inverse of {@link encodeDateRange}. */
export const decodeDateRange = (value: string[] | undefined): DateRangeValue => {
  const [from, to] = value ?? [];
  return { from: from || undefined, to: to || undefined };
};
