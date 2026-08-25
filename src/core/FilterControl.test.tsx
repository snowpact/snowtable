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

    await user.click(screen.getByTestId('snow-filter-trigger'));
    expect(await screen.findByTestId('snow-calendar')).toBeInTheDocument();
  });

  it('renders a multi-select dropdown for a categorical filter and sets the value', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderWithProviders(
      <FilterControl filter={selectFilter} columnFilters={{}} onColumnFiltersChange={onColumnFiltersChange} />
    );

    await user.click(screen.getByTestId('snow-filter-trigger')); // open the dropdown
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

    await user.click(screen.getByTestId('snow-filter-trigger')); // open
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Active' })); // deselect -> []

    expect(onColumnFiltersChange).toHaveBeenCalledWith({ other: ['x'] });
  });

  it('renders a text input for a text filter and commits the query', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderWithProviders(
      <FilterControl filter={textFilterCfg} columnFilters={{}} onColumnFiltersChange={onColumnFiltersChange} />
    );

    await user.click(screen.getByTestId('snow-filter-trigger')); // open the popover
    await user.type(await screen.findByRole('textbox'), 'alice');

    await waitFor(() => expect(onColumnFiltersChange).toHaveBeenCalledWith({ email: ['alice'] }));
  });

  describe('clear affordance', () => {
    it('has no clear button while the filter is empty', () => {
      renderWithProviders(<FilterControl filter={selectFilter} columnFilters={{}} onColumnFiltersChange={vi.fn()} />);
      expect(screen.queryByTestId('snow-filter-clear')).not.toBeInTheDocument();
    });

    it('clears the filter from the trigger without opening the panel', async () => {
      const user = userEvent.setup();
      const onColumnFiltersChange = vi.fn();
      renderWithProviders(
        <FilterControl
          filter={selectFilter}
          columnFilters={{ status: ['active'], other: ['x'] }}
          onColumnFiltersChange={onColumnFiltersChange}
        />
      );

      await user.click(screen.getByTestId('snow-filter-clear'));

      expect(onColumnFiltersChange).toHaveBeenCalledWith({ other: ['x'] });
      // The × must not bubble to the trigger (Radix opens on pointerdown).
      expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument();
    });

    it('clears a date-range filter too', async () => {
      const user = userEvent.setup();
      const onColumnFiltersChange = vi.fn();
      renderWithProviders(
        <FilterControl
          filter={dateFilter}
          columnFilters={{ createdAt: ['2024-01-01', '2024-12-31'] }}
          onColumnFiltersChange={onColumnFiltersChange}
        />
      );

      await user.click(screen.getByTestId('snow-filter-clear'));
      expect(onColumnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('multiple selection', () => {
    const multi: FilterConfig<Item> = {
      key: 'status',
      label: 'Status',
      multipleSelection: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    };

    it('keeps the list open while picking values, and flags multi-select', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FilterControl filter={multi} columnFilters={{}} onColumnFiltersChange={vi.fn()} />);

      await user.click(screen.getByTestId('snow-filter-trigger'));
      expect(await screen.findByText('Multiple selection')).toBeInTheDocument();

      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Active' }));

      // Still open, so a second value can be picked without re-opening.
      expect(screen.getByRole('menuitemcheckbox', { name: 'Inactive' })).toBeInTheDocument();
    });

    it('closes the list after a single-choice pick', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FilterControl filter={selectFilter} columnFilters={{}} onColumnFiltersChange={vi.fn()} />);

      await user.click(screen.getByTestId('snow-filter-trigger'));
      await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Active' }));

      await waitFor(() => expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument());
      expect(screen.queryByText('Multiple selection')).not.toBeInTheDocument();
    });
  });
});
