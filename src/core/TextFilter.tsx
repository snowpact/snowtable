/**
 * Free-text "contains" filter button for the DataTable topbar. A trigger button
 * (mirroring the other filters) opens a popover with a debounced text input;
 * the query is stored as `[query]` in the shared filter-state record.
 */

import { useEffect, useRef, useState } from 'react';

import { ChevronDown, Search } from '../icons';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Popover } from '../primitives/Popover';
import { cn } from '../utils';

import type { TextFilterConfig } from './filterConfig';

const DEBOUNCE_MS = 400;

export interface TextFilterProps<T extends object> {
  filter: TextFilterConfig<T>;
  selectedValues?: string[];
  onFilterChange: (key: keyof T, selectedValues: string[]) => void;
}

export function TextFilter<T extends object>({ filter, selectedValues, onFilterChange }: TextFilterProps<T>) {
  const committed = selectedValues?.[0] ?? '';
  const [text, setText] = useState(committed);
  const isActive = committed.length > 0;

  // Keep the input in sync when the committed value changes externally (reset, URL…).
  useEffect(() => setText(committed), [committed]);

  // Latest change handler in a ref so a parent re-render (which recreates
  // `onFilterChange`) doesn't reset the debounce timer and starve the commit.
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  // Debounce commits so we don't filter (or refetch, in server mode) on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== committed) onFilterChangeRef.current(filter.key, text ? [text] : []);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, committed, filter.key]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button className={cn('snow-filter-btn snow-w-full snow-justify-between', isActive && 'snow-state-active')}>
          <div className="snow-filter-btn-content">
            <Search className={cn('snow-size-4 snow-shrink-0', isActive && 'snow-state-active-text')} />
            <span className="snow-truncate">{isActive ? committed : filter.label}</span>
          </div>
          <ChevronDown className="snow-size-4 snow-opacity-50 snow-shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Content align="start" className="snow-w-56">
        <div className="snow-p-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={filter.placeholder ?? filter.label}
            isActive={text.length > 0}
          />
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
