import { describe, expect, it, vi } from 'vitest';

import { render, screen, userEvent } from '../test/test-utils';

import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('shows no clear button when the field is empty', () => {
    render(<SearchBar value="" onDebouncedChange={vi.fn()} />);
    expect(screen.queryByTestId('data-table-search-clear')).not.toBeInTheDocument();
  });

  it('shows a clear button when there is text', () => {
    render(<SearchBar value="john" onDebouncedChange={vi.fn()} />);
    expect(screen.getByTestId('data-table-search-clear')).toBeInTheDocument();
  });

  it('clears the input and emits an empty value when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onDebouncedChange = vi.fn();
    render(<SearchBar value="john" onDebouncedChange={onDebouncedChange} />);

    await user.click(screen.getByTestId('data-table-search-clear'));

    expect(onDebouncedChange).toHaveBeenCalledWith('');
    expect(screen.getByTestId('data-table-search-bar')).toHaveValue('');
  });
});
