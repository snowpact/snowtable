import type { Row } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { textFilter } from './textFilter';

type Item = { email: string };

// `getValue` intentionally differs from `original` to prove the filter reads the raw field.
const rowWith = (email: unknown, derived = 'DERIVED-SEARCH-VALUE'): Row<Item> =>
  ({ original: { email }, getValue: () => derived }) as unknown as Row<Item>;

describe('textFilter', () => {
  it('matches case-insensitive substrings', () => {
    expect(textFilter(rowWith('Alice@Example.com'), 'email', ['example'])).toBe(true);
    expect(textFilter(rowWith('alice@example.com'), 'email', ['ALICE'])).toBe(true);
  });

  it('excludes non-matching rows', () => {
    expect(textFilter(rowWith('bob@example.com'), 'email', ['alice'])).toBe(false);
  });

  it('passes everything for an empty or blank query', () => {
    expect(textFilter(rowWith('x'), 'email', [])).toBe(true);
    expect(textFilter(rowWith('x'), 'email', [''])).toBe(true);
    expect(textFilter(rowWith('x'), 'email', ['   '])).toBe(true);
  });

  it('excludes missing values', () => {
    expect(textFilter(rowWith(null), 'email', ['a'])).toBe(false);
    expect(textFilter(rowWith(undefined), 'email', ['a'])).toBe(false);
  });

  it('reads the raw original value, not row.getValue()', () => {
    expect(textFilter(rowWith('alice@example.com'), 'email', ['alice'])).toBe(true);
    expect(textFilter(rowWith('alice@example.com'), 'email', ['DERIVED'])).toBe(false);
  });
});
