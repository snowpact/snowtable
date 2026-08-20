/**
 * Date-range filter button for the DataTable topbar.
 *
 * Mirrors {@link SingleFilterDropdown}'s call shape (`filter` / `selectedValues`
 * / `onFilterChange`) so it drops into the same `filters.map`. Holds a draft
 * range while the popover is open and commits it on "Apply", so the two-click
 * range selection doesn't fire intermediate filter changes (each of which would
 * reset pagination).
 */

import { useState } from 'react';

import { Calendar as CalendarIcon, ChevronDown } from '../icons';
import { Button } from '../primitives/Button';
import { Popover } from '../primitives/Popover';
import { getT } from '../registry';
import { cn, parseISODate } from '../utils';

import { Calendar } from './Calendar';
import { decodeDateRange, encodeDateRange, type DateRangeFilterConfig, type DateRangeValue } from './filterConfig';

export interface DateRangeFilterProps<T extends object> {
  filter: DateRangeFilterConfig<T>;
  selectedValues?: string[];
  onFilterChange: (key: keyof T, selectedValues: string[]) => void;
}

const formatTriggerLabel = (value: DateRangeValue, fallback: string, locale?: string): string => {
  const { from, to } = value;
  if (!from && !to) return fallback;
  const fmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  const one = (iso: string) => {
    const d = parseISODate(iso);
    return d ? fmt.format(d) : iso;
  };
  // A committed value always carries both bounds; equal bounds = a single day.
  return from === to ? one(from!) : `${one(from!)} – ${one(to!)}`;
};

export function DateRangeFilter<T extends object>({ filter, selectedValues, onFilterChange }: DateRangeFilterProps<T>) {
  const t = getT();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(() => decodeDateRange(selectedValues));

  const committed = decodeDateRange(selectedValues);
  const isActive = !!(committed.from || committed.to);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(decodeDateRange(selectedValues)); // reseed from the committed value each open
    setOpen(next);
  };

  const apply = () => {
    onFilterChange(filter.key, encodeDateRange(draft));
    setOpen(false);
  };

  const clear = () => {
    setDraft({});
    onFilterChange(filter.key, []);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button className={cn('snow-filter-btn snow-w-full snow-justify-between', isActive && 'snow-state-active')}>
          <div className="snow-filter-btn-content">
            <CalendarIcon className={cn('snow-size-4 snow-shrink-0', isActive && 'snow-state-active-text')} />
            <span className="snow-truncate">{formatTriggerLabel(committed, filter.label)}</span>
          </div>
          <ChevronDown className="snow-size-4 snow-opacity-50 snow-shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Content align="start">
        <Calendar value={draft} onChange={setDraft} minDate={filter.minDate} maxDate={filter.maxDate} />
        <div className="snow-calendar-footer">
          <Button onClick={clear}>{t('dataTable.reset')}</Button>
          <Button className="snow-calendar-apply" onClick={apply}>
            {t('dataTable.apply')}
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
