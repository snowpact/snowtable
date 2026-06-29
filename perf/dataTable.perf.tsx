/**
 * SnowTable render-perf scenarios — covers A (many rows) + B (frequent re-renders).
 *
 * Run: `pnpm perf` (delta vs baseline) | `pnpm perf:baseline` (reset baseline).
 *
 * Each scenario measures a single interaction and reports:
 *   commits | cellRenders | rowRenders | reactMs | wallMs
 *
 * Workflow to prove a gain:
 *   1. `pnpm perf:baseline` on the current code  → freezes the reference
 *   2. apply an optimization (guarded by `pnpm test`)
 *   3. `pnpm perf`  → prints before → after delta
 */

import { afterAll, describe, it } from 'vitest';
import { render } from '@testing-library/react';

import { DataTable } from '../src/core/DataTable';
import { Measured, makeColumns, makeRows, measure, report, type PerfResult } from './harness';

const COLS = 6;
const results: PerfResult[] = [];

describe('SnowTable perf', () => {
  afterAll(() => report(results));

  // --- A: many rows ----------------------------------------------------------

  it('A1 — mount 500 rows', () => {
    const ROWS = 500;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS);
    const m = measure(() => {
      render(
        <Measured>
          <DataTable data={data} columns={columns} enablePagination={false} />
        </Measured>
      );
    });
    results.push({ scenario: 'A1 mount, 500 rows', rows: ROWS, cols: COLS, ...m });
  });

  it('A2 — re-render parent w/ unrelated prop, 500 rows (THE row-memo lever)', () => {
    const ROWS = 500;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS); // stable refs
    const tree = (className: string) => (
      <Measured>
        <DataTable data={data} columns={columns} enablePagination={false} className={className} />
      </Measured>
    );
    const { rerender } = render(tree('a'));
    // Only `className` changes — no row data changes. Ideal target after row memo: 0 cell re-renders.
    const m = measure(() => rerender(tree('b')));
    results.push({ scenario: 'A2 re-render unrelated prop, 500 rows', rows: ROWS, cols: COLS, ...m });
  });

  // --- B: frequent re-renders on normal pages --------------------------------

  it('B1 — activeRowId switch, 25 rows (THE B lever)', () => {
    const ROWS = 25;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS);
    const tree = (activeRowId: string) => (
      <Measured>
        <DataTable data={data} columns={columns} enablePagination={false} activeRowId={activeRowId} />
      </Measured>
    );
    const { rerender } = render(tree('5'));
    // Switch active row 5 → 10. Target after memo: only 2 rows re-render.
    const m = measure(() => rerender(tree('10')));
    results.push({ scenario: 'B1 activeRowId switch, 25 rows', rows: ROWS, cols: COLS, ...m });
  });

  it('B2 — global filter change, 500 rows (filtering cost; not a memo win)', () => {
    const ROWS = 500;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS);
    const tree = (globalFilter: string) => (
      <Measured>
        <DataTable
          data={data}
          columns={columns}
          enablePagination={false}
          enableGlobalSearch
          searchMode="contains"
          globalFilter={globalFilter}
        />
      </Measured>
    );
    const { rerender } = render(tree(''));
    const m = measure(() => rerender(tree('r1')));
    results.push({ scenario: 'B2 global filter change, 500 rows', rows: ROWS, cols: COLS, ...m });
  });

  it('B3 — next page, 500 rows / pageSize 25', () => {
    const ROWS = 500;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS);
    const tree = (pageIndex: number) => (
      <Measured>
        <DataTable data={data} columns={columns} pagination={{ pageIndex, pageSize: 25 }} onPaginationChange={() => {}} />
      </Measured>
    );
    const { rerender } = render(tree(0));
    const m = measure(() => rerender(tree(1)));
    results.push({ scenario: 'B3 next page, pageSize 25', rows: ROWS, cols: COLS, ...m });
  });

  // --- Referential stability -------------------------------------------------

  it('S1 — re-render with UNSTABLE columns ref, 100 rows', () => {
    const ROWS = 100;
    const data = makeRows(ROWS, COLS);
    // makeColumns() returns a NEW array each render → TanStack recomputes.
    const tree = () => (
      <Measured>
        <DataTable data={data} columns={makeColumns(COLS)} enablePagination={false} />
      </Measured>
    );
    const { rerender } = render(tree());
    const m = measure(() => rerender(tree()));
    results.push({ scenario: 'S1 unstable columns ref, 100 rows', rows: ROWS, cols: COLS, ...m });
  });

  it('S2 — re-render with STABLE columns ref, 100 rows', () => {
    const ROWS = 100;
    const data = makeRows(ROWS, COLS);
    const columns = makeColumns(COLS); // stable ref reused across renders
    const tree = (className: string) => (
      <Measured>
        <DataTable data={data} columns={columns} enablePagination={false} className={className} />
      </Measured>
    );
    const { rerender } = render(tree('a'));
    const m = measure(() => rerender(tree('b')));
    results.push({ scenario: 'S2 stable columns ref, 100 rows', rows: ROWS, cols: COLS, ...m });
  });
});
