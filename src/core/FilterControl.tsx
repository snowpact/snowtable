/**
 * Renders the right control for a single column filter — a date-range calendar
 * or a categorical multi-select — and owns reading/writing that filter's value
 * in the shared `columnFilters` record. Keeps the per-filter read/write logic
 * out of DataTable, which only hands down the record and its setter.
 */

import { DateRangeFilter } from './DateRangeFilter';
import { isDateRangeFilter, isTextFilter, type FilterConfig } from './filterConfig';
import { SingleFilterDropdown } from './SingleFilterDropdown';
import { TextFilter } from './TextFilter';

export interface FilterControlProps<T extends object> {
  filter: FilterConfig<T>;
  columnFilters: Record<string, string[]>;
  onColumnFiltersChange: (filters: Record<string, string[]>) => void;
}

export function FilterControl<T extends object>({
  filter,
  columnFilters,
  onColumnFiltersChange,
}: FilterControlProps<T>) {
  const selectedValues = columnFilters[String(filter.key)];

  const handleFilterChange = (key: keyof T, values: string[]) => {
    const columnId = String(key);
    const next = { ...columnFilters };
    if (values.length === 0) {
      delete next[columnId];
    } else {
      next[columnId] = values;
    }
    onColumnFiltersChange(next);
  };

  if (isDateRangeFilter(filter)) {
    return <DateRangeFilter filter={filter} selectedValues={selectedValues} onFilterChange={handleFilterChange} />;
  }
  if (isTextFilter(filter)) {
    return <TextFilter filter={filter} selectedValues={selectedValues} onFilterChange={handleFilterChange} />;
  }
  return <SingleFilterDropdown filter={filter} selectedValues={selectedValues} onFilterChange={handleFilterChange} />;
}
