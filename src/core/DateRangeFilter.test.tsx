import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen, userEvent, within } from '../test/test-utils';

import { DateRangeFilter } from './DateRangeFilter';
import type { DateRangeFilterConfig } from './filterConfig';

type Item = { createdAt: string };

const filter: DateRangeFilterConfig<Item> = { type: 'dateRange', key: 'createdAt', label: 'Created at' };

describe('DateRangeFilter', () => {
  it('shows the fallback label and no active state when empty', () => {
    renderWithProviders(<DateRangeFilter filter={filter} onFilterChange={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Created at');
    expect(btn.className).not.toContain('snow-state-active');
  });

  it('shows the formatted range and active state when a value is set', () => {
    renderWithProviders(
      <DateRangeFilter filter={filter} selectedValues={['2024-01-01', '2024-12-31']} onFilterChange={vi.fn()} />
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('snow-state-active');
    expect(btn).toHaveTextContent('2024');
  });

  it('opens the calendar popover with weekday headers and days on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DateRangeFilter filter={filter} onFilterChange={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    const calendar = await screen.findByTestId('snow-calendar');
    expect(within(calendar).getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('commits a two-click range on Apply, sorted ascending', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    renderWithProviders(<DateRangeFilter filter={filter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button'));
    const calendar = await screen.findByTestId('snow-calendar');
    await user.click(within(calendar).getByText('10'));
    await user.click(within(calendar).getByText('20'));
    await user.click(screen.getByText('Apply'));

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    const [key, value] = onFilterChange.mock.calls[0];
    expect(key).toBe('createdAt');
    expect(value[0]).toMatch(/-10$/);
    expect(value[1]).toMatch(/-20$/);
  });

  it('auto-sorts when the second click precedes the first', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    renderWithProviders(<DateRangeFilter filter={filter} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button'));
    const calendar = await screen.findByTestId('snow-calendar');
    await user.click(within(calendar).getByText('20'));
    await user.click(within(calendar).getByText('10'));
    await user.click(screen.getByText('Apply'));

    const [, value] = onFilterChange.mock.calls[0];
    expect(value[0]).toMatch(/-10$/);
    expect(value[1]).toMatch(/-20$/);
  });

  it('selects a single day when the same day is clicked twice', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    renderWithProviders(<DateRangeFilter filter={filter} onFilterChange={onFilterChange} />);

    await user.click(screen.getByRole('button'));
    const calendar = await screen.findByTestId('snow-calendar');
    await user.click(within(calendar).getByText('12'));
    await user.click(within(calendar).getByText('12'));
    await user.click(screen.getByText('Apply'));

    const [, value] = onFilterChange.mock.calls[0];
    expect(value[0]).toBe(value[1]); // single day => from === to
    expect(value[0]).toMatch(/-12$/);
  });

  it('clears the range on Reset', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    renderWithProviders(
      <DateRangeFilter filter={filter} selectedValues={['2024-01-01', '2024-12-31']} onFilterChange={onFilterChange} />
    );
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Reset'));
    expect(onFilterChange).toHaveBeenCalledWith('createdAt', []);
  });

  it('disables days outside the min/max bounds', async () => {
    const user = userEvent.setup();
    const bounded: DateRangeFilterConfig<Item> = {
      type: 'dateRange',
      key: 'createdAt',
      label: 'Created at',
      minDate: '2024-06-05',
      maxDate: '2024-06-25',
    };
    renderWithProviders(
      <DateRangeFilter filter={bounded} selectedValues={['2024-06-10', '2024-06-20']} onFilterChange={vi.fn()} />
    );
    await user.click(screen.getByRole('button'));
    const calendar = await screen.findByTestId('snow-calendar');
    expect(within(calendar).getByText('3')).toBeDisabled(); // before minDate
    expect(within(calendar).getByText('28')).toBeDisabled(); // after maxDate
    expect(within(calendar).getByText('10')).not.toBeDisabled();
  });
});
