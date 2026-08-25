/**
 * Trailing affix of a filter trigger button: a clear "×" once the filter holds a
 * value, the chevron otherwise. Shared by every filter control so the three
 * trigger buttons stay identical.
 *
 * It renders INSIDE the trigger `<button>`, so the clear control is a
 * `role="button"` span (a nested `<button>` is invalid HTML). Radix triggers open
 * on *pointerdown*, hence stopping propagation there and not only on click —
 * otherwise clearing would also open the panel it sits on.
 */

import type { KeyboardEvent, PointerEvent as ReactPointerEvent, SyntheticEvent } from 'react';

import { ChevronDown, X } from '../icons';
import { getT } from '../registry';

export interface FilterTriggerEndProps {
  isActive: boolean;
  onClear: () => void;
}

export function FilterTriggerEnd({ isActive, onClear }: FilterTriggerEndProps) {
  const t = getT();

  if (!isActive) return <ChevronDown className="snow-size-4 snow-opacity-50 snow-shrink-0" />;

  const clear = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClear();
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={t('dataTable.reset')}
      title={t('dataTable.reset')}
      className="snow-filter-clear"
      data-testid="snow-filter-clear"
      onClick={clear}
      onPointerDown={(e: ReactPointerEvent) => e.stopPropagation()}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        clear(e);
      }}
    >
      <X className="snow-size-4 snow-shrink-0" />
    </span>
  );
}
