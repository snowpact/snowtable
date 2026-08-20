import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen, userEvent, waitFor } from '../test/test-utils';

import { FilterControl } from './FilterControl';
import type { DateRangeFilterConfig, FilterConfig, TextFilterConfig } from './filterConfig';

type Item = { createdAt: string; status: string; email: string };

const dateFilter: DateRangeFilterConfig<Item> = { type: 'dateRange', key: 'createdAt', label: 'Created at' };
const selectFilter: FilterConfig<Item> = {
  key: 'status',
  label: 'Status',
  options: [{ value: 'active', label: 'Active' }],
};
const textFilterCfg: TextFilterConfig<Item> = { type: 'text', key: 'email', label: 'Email' };

describe('FilterControl', () => {
  it('renders the date-range calendar for a dateRange filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterControl filter={dateFilter} columnFilters={{}} onColumnFiltersChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));
    expect(await screen.findByTestId('snow-calendar')).toBeInTheDocument();
  });

  it('renders a multi-select dropdown for a categorical filter and sets the value', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderWithProviders(
      <FilterControl filter={selectFilter} columnFilters={{}} onColumnFiltersChange={onColumnFiltersChange} />
    );

    await user.click(screen.getByRole('button')); // open the dropdown
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Active' })); // select

    expect(onColumnFiltersChange).toHaveBeenCalledWith({ status: ['active'] });
  });

  it('removes only its own key from the record when its value is cleared', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderWithProviders(
      <FilterControl
        filter={selectFilter}
        columnFilters={{ status: ['active'], other: ['x'] }}
        onColumnFiltersChange={onColumnFiltersChange}
      />
    );

    await user.click(screen.getByRole('button')); // open
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Active' })); // deselect -> []

    expect(onColumnFiltersChange).toHaveBeenCalledWith({ other: ['x'] });
  });

  it('renders a text input for a text filter and commits the query', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderWithProviders(
      <FilterControl filter={textFilterCfg} columnFilters={{}} onColumnFiltersChange={onColumnFiltersChange} />
    );

    await user.click(screen.getByRole('button')); // open the popover
    await user.type(await screen.findByRole('textbox'), 'alice');

    await waitFor(() => expect(onColumnFiltersChange).toHaveBeenCalledWith({ email: ['alice'] }));
  });
});
