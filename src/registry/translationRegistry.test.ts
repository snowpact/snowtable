import { describe, expect, it } from 'vitest';

import type { SetupSnowTableOptions } from './index';
import { getTranslationKeys } from './translationRegistry';

/**
 * Compile-time regression guard (checked by `pnpm typecheck`).
 *
 * The v2 filter panel + calendar added `dataTable.reset` / `filters` / `apply` /
 * `prevMonth` / `nextMonth`, but the public `translations` override type once
 * hardcoded only the older keys — so consumers could not localize the new
 * strings (TS2353 on the override object). The override type now DERIVES from
 * `defaultTranslations`, so this object must stay assignable. If a new default
 * key is added and the derivation breaks, `satisfies` fails right here.
 */
const _overrideAcceptsV2Keys = {
  'dataTable.reset': 'x',
  'dataTable.filters': 'x',
  'dataTable.apply': 'x',
  'dataTable.prevMonth': 'x',
  'dataTable.nextMonth': 'x',
} satisfies NonNullable<SetupSnowTableOptions['translations']>;

describe('translationRegistry', () => {
  it('exposes the v2 filter-panel / calendar keys among the defaults', () => {
    expect(getTranslationKeys()).toEqual(
      expect.arrayContaining([
        'dataTable.reset',
        'dataTable.filters',
        'dataTable.apply',
        'dataTable.prevMonth',
        'dataTable.nextMonth',
      ])
    );
  });

  it('keeps the override type in sync with the runtime defaults', () => {
    void _overrideAcceptsV2Keys; // consume the compile-time guard
    expect(getTranslationKeys().length).toBeGreaterThanOrEqual(14);
  });
});
