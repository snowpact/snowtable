/**
 * Range calendar — headless logic from `@rehookify/datepicker`, rendered
 * entirely with snowtable's own `snow-calendar-*` classes/tokens (no foreign
 * calendar CSS). Controlled by a {@link DateRangeValue} draft; the hook handles
 * grid math, range selection and hover preview, we own the markup.
 */

import { useMemo, useState } from 'react';
import { useDatePicker } from '@rehookify/datepicker';

import { ChevronLeft, ChevronRight } from '../icons';
import { getT } from '../registry';
import { cn, formatISODate, parseISODate } from '../utils';

import type { DateRangeValue } from './filterConfig';

export interface CalendarProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Earliest selectable date, ISO `'YYYY-MM-DD'`. */
  minDate?: string;
  /** Latest selectable date, ISO `'YYYY-MM-DD'`. */
  maxDate?: string;
  /** 0 = Sunday, 1 = Monday (default). */
  weekStartsOn?: 0 | 1;
  /** Intl locale tag; defaults to the runtime locale. */
  locale?: string;
}

export function Calendar({ value, onChange, minDate, maxDate, weekStartsOn = 1, locale }: CalendarProps) {
  const t = getT();

  const selectedDates = useMemo(() => {
    const dates: Date[] = [];
    const from = value.from ? parseISODate(value.from) : null;
    const to = value.to ? parseISODate(value.to) : null;
    if (from) dates.push(from);
    if (to) dates.push(to);
    return dates;
  }, [value.from, value.to]);

  // Which month is shown. Seeded from the current range so the popover opens on
  // it; kept controlled so month navigation updates it. Re-seeded on remount
  // (the popover unmounts the calendar when it closes).
  const [offsetDate, setOffsetDate] = useState<Date>(() => parseISODate(value.from || value.to || '') ?? new Date());

  const {
    data: { calendars, weekDays },
    propGetters: { dayButton, subtractOffset, addOffset },
  } = useDatePicker({
    selectedDates,
    onDatesChange: dates => {
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      onChange({
        from: sorted[0] ? formatISODate(sorted[0]) : undefined,
        to: sorted[1] ? formatISODate(sorted[1]) : undefined,
      });
    },
    offsetDate,
    onOffsetChange: setOffsetDate,
    dates: {
      mode: 'range',
      // toggle off + selectSameDate so a second click on the same day sets
      // end = start (a single-day range [A, A]) instead of deselecting.
      toggle: false,
      selectSameDate: true,
      minDate: minDate ? (parseISODate(minDate) ?? undefined) : undefined,
      maxDate: maxDate ? (parseISODate(maxDate) ?? undefined) : undefined,
    },
    calendar: { startDay: weekStartsOn, mode: 'fluid' },
    locale: { locale, weekday: 'short', monthName: 'long', day: 'numeric' },
  });

  const { month, year, days } = calendars[0];

  return (
    <div className="snow-calendar" data-testid="snow-calendar">
      <div className="snow-calendar-header">
        <button type="button" className="snow-btn snow-btn-icon" title={t('dataTable.prevMonth')} {...subtractOffset({ months: 1 })}>
          <ChevronLeft className="snow-size-4" />
        </button>
        <span className="snow-calendar-title">
          {month} {year}
        </span>
        <button type="button" className="snow-btn snow-btn-icon" title={t('dataTable.nextMonth')} {...addOffset({ months: 1 })}>
          <ChevronRight className="snow-size-4" />
        </button>
      </div>

      <div className="snow-calendar-weekdays">
        {weekDays.map((w, i) => (
          <span key={i} className="snow-calendar-weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="snow-calendar-grid">
        {days.map(day => {
          // Adjacent-month days render as inert blanks (matches the summary look
          // and keeps day numbers unique in the grid).
          if (!day.inCurrentMonth) return <span key={day.$date.toISOString()} className="snow-calendar-day-blank" />;
          const r = day.range;
          return (
            <button
              key={day.$date.toISOString()}
              {...dayButton(day)}
              className={cn(
                'snow-calendar-day',
                day.now && 'snow-calendar-day-today',
                (r === 'in-range' || r === 'will-be-in-range') && 'snow-calendar-day-in-range',
                day.selected && 'snow-calendar-day-selected',
                r.includes('range-start') && 'snow-calendar-day-range-start',
                r.includes('range-end') && 'snow-calendar-day-range-end'
              )}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
