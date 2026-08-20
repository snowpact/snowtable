import { describe, expect, it, vi } from 'vitest';

import { render, screen, userEvent, waitFor } from '../test/test-utils';

import { TextFilter } from './TextFilter';
import type { TextFilterConfig } from './filterConfig';

type Item = { email: string };
const filter: TextFilterConfig<Item> = { type: 'text', key: 'email', label: 'Email' };

describe('TextFilter', () => {
  it('shows the label when empty and the query when set', () => {
    const { rerender } = render(<TextFilter filter={filter} onFilterChange={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('Email');

    rerender(<TextFilter filter={filter} selectedValues={['alice']} onFilterChange={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('alice');
  });

  it('commits a debounced query', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<TextFilter filter={filter} onFilterChange={onFilterChange} />);

    await user.click(screen.getByRole('button'));
    await user.type(await screen.findByRole('textbox'), 'alice');

    await waitFor(() => expect(onFilterChange).toHaveBeenCalledWith('email', ['alice']));
  });

  it('commits an empty array when the query is cleared', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<TextFilter filter={filter} selectedValues={['alice']} onFilterChange={onFilterChange} />);

    await user.click(screen.getByRole('button'));
    await user.clear(await screen.findByRole('textbox'));

    await waitFor(() => expect(onFilterChange).toHaveBeenCalledWith('email', []));
  });

  it('commits through the latest handler after a parent re-render (B1)', async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<TextFilter filter={filter} onFilterChange={first} />);

    await user.click(screen.getByRole('button'));
    await user.type(await screen.findByRole('textbox'), 'ali');
    // Parent re-render hands down a new handler identity mid-debounce.
    rerender(<TextFilter filter={filter} onFilterChange={second} />);

    await waitFor(() => expect(second).toHaveBeenCalledWith('email', ['ali']));
    expect(first).not.toHaveBeenCalled();
  });
});
