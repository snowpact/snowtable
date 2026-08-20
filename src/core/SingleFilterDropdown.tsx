/**
 * Single filter dropdown with multi-select support
 */

import { ChevronDown, Filter, ListFilter, Search } from '../icons';
import { useState, useMemo } from 'react';

import { Button } from '../primitives/Button';
import { DropdownMenu } from '../primitives/DropdownMenu';
import { Input } from '../primitives/Input';
import { getT } from '../registry';
import { cn } from '../utils';
import type { CategoricalFilterConfig } from './filterConfig';

export type { FilterConfig, FilterOption } from './filterConfig';

export interface SingleFilterDropdownProps<T extends object> {
  filter: CategoricalFilterConfig<T>;
  selectedValues?: string[];
  onFilterChange: (key: keyof T, selectedValues: string[]) => void;
}

export function SingleFilterDropdown<T extends object>({
  filter,
  selectedValues = [],
  onFilterChange,
}: SingleFilterDropdownProps<T>) {
  const t = getT();

  const [searchTerm, setSearchTerm] = useState('');

  const activeCount = selectedValues.length;

  // Get the labels of selected values (must be before early return for React Hook rules)
  const selectedLabels = useMemo(() => {
    return selectedValues
      .map(value => filter.options.find(opt => opt.value === value)?.label)
      .filter(Boolean) as string[];
  }, [selectedValues, filter.options]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return filter.options;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return filter.options.filter(
      option =>
        option.label.toLowerCase().includes(lowerSearchTerm) || option.value.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filter.options, searchTerm]);

  const handleOptionToggle = (optionValue: string) => {
    const isCurrentlySelected = selectedValues.includes(optionValue);
    const multipleSelection = filter.multipleSelection ?? false;

    let newValues: string[];

    if (multipleSelection) {
      if (isCurrentlySelected) {
        newValues = selectedValues.filter(v => v !== optionValue);
      } else {
        newValues = [...selectedValues, optionValue];
      }
    } else {
      if (isCurrentlySelected) {
        newValues = [];
      } else {
        newValues = [optionValue];
      }
    }

    onFilterChange(filter.key, newValues);
  };

  const handleReset = () => {
    onFilterChange(filter.key, []);
  };

  if (filter.options.length === 0) return null;

  // Build display text for selected filters
  const getDisplayText = () => {
    if (activeCount === 0) return filter.label;
    if (activeCount === 1) return selectedLabels[0];
    if (activeCount === 2) return selectedLabels.join(', ');
    return `${selectedLabels.slice(0, 2).join(', ')} +${activeCount - 2}`;
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button className={cn('snow-filter-btn snow-w-full snow-justify-between', activeCount > 0 && 'snow-state-active')}>
          <div className="snow-filter-btn-content">
            {filter.multipleSelection ? (
              <ListFilter className={cn('snow-size-4 snow-shrink-0', activeCount > 0 && 'snow-state-active-text')} />
            ) : (
              <Filter className={cn('snow-size-4 snow-shrink-0', activeCount > 0 && 'snow-state-active-text')} />
            )}
            <span className="snow-truncate">{getDisplayText()}</span>
          </div>
          <ChevronDown className="snow-size-3\\.5 snow-opacity-50 snow-shrink-0" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" className="snow-w-56">
        {/* Search bar */}
        <div className="snow-p-2">
          <div className="snow-filter-search">
            <Search className="snow-filter-search-icon" />
            <Input
              placeholder={t('dataTable.searchFilters')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                  e.stopPropagation();
                }
              }}
              className="snow-pl-8 snow-h-8"
            />
          </div>
        </div>

        {filteredOptions.length === 0 ? (
          <div className="snow-filter-empty">{t('dataTable.searchEmpty')}</div>
        ) : (
          filteredOptions.map(option => (
            <DropdownMenu.CheckboxItem
              key={option.value}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleOptionToggle(option.value)}
              className="snow-cursor-pointer"
            >
              {option.label}
            </DropdownMenu.CheckboxItem>
          ))
        )}

        {activeCount > 0 && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onClick={handleReset} className="snow-text-xs snow-cursor-pointer snow-text-center snow-text-muted-foreground">
              {t('dataTable.reset')}
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
