/**
 * Perf harness — render-count + timing measurement for SnowTable.
 *
 * NOT part of the CI test run (see vitest.perf.config.ts). Run with `pnpm perf`.
 *
 * How it measures:
 * - render count: each instrumented `cell` increments a counter on every render.
 *   `flexRender` invokes the cell fn on every React render of its row, so the
 *   counter == number of cells React re-rendered. Reliable in jsdom, zero lib
 *   changes needed to measure. `rows` Set tracks distinct rows that re-rendered.
 * - delay: React's <Profiler> `actualDuration` (reconciliation time) + a
 *   wall-clock `performance.now()` around the interaction.
 *
 * Honesty note: jsdom has no layout/paint, so timings are JS-reconciliation only.
 * Read them as RELATIVE before/after deltas, not absolute browser performance.
 */

import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type PerfRow = { id: string; [key: string]: string };

// ============================================
// Counters (render count)
// ============================================

export const counters = {
  cellRenders: 0,
  rows: new Set<string>(),
};

export function resetCounters() {
  counters.cellRenders = 0;
  counters.rows.clear();
}

// ============================================
// Profiler (reconciliation timing + commit count)
// ============================================

export const profiler = {
  commits: 0,
  reactMs: 0,
};

export const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
  profiler.commits += 1;
  profiler.reactMs += actualDuration;
};

export function resetProfiler() {
  profiler.commits = 0;
  profiler.reactMs = 0;
}

export function Measured({ children }: { children: ReactNode }) {
  return (
    <Profiler id="snowtable" onRender={onRender}>
      {children}
    </Profiler>
  );
}

// ============================================
// Data + column factories
// ============================================

export function makeRows(numRows: number, numCols: number): PerfRow[] {
  const rows: PerfRow[] = [];
  for (let r = 0; r < numRows; r++) {
    const row: PerfRow = { id: String(r) };
    for (let c = 0; c < numCols; c++) row[`col${c}`] = `r${r}c${c}`;
    rows.push(row);
  }
  return rows;
}

/** Instrumented columns: each cell render bumps the counter. */
export function makeColumns(numCols: number): ColumnDef<PerfRow, unknown>[] {
  const cols: ColumnDef<PerfRow, unknown>[] = [];
  for (let c = 0; c < numCols; c++) {
    cols.push({
      accessorKey: `col${c}`,
      header: `Col ${c}`,
      cell: ({ row, getValue }) => {
        counters.cellRenders += 1;
        counters.rows.add(row.id);
        return <span>{String(getValue())}</span>;
      },
    });
  }
  return cols;
}

// ============================================
// Measurement
// ============================================

export type PerfMetrics = {
  commits: number;
  cellRenders: number;
  rowRenders: number;
  reactMs: number;
  wallMs: number;
};

export type PerfResult = { scenario: string; rows: number; cols: number } & PerfMetrics;

const round = (n: number) => Math.round(n * 100) / 100;

/** Reset counters, run the interaction, return the measured metrics. */
export function measure(action: () => void): PerfMetrics {
  resetCounters();
  resetProfiler();
  const t0 = performance.now();
  action();
  const wallMs = performance.now() - t0;
  return {
    commits: profiler.commits,
    cellRenders: counters.cellRenders,
    rowRenders: counters.rows.size,
    reactMs: round(profiler.reactMs),
    wallMs: round(wallMs),
  };
}

// ============================================
// Reporting (console table + JSON + delta vs baseline)
// ============================================

const RESULTS_DIR = path.resolve(process.cwd(), 'perf/results');
const LATEST = path.join(RESULTS_DIR, 'latest.json');
const BASELINE = path.join(RESULTS_DIR, 'baseline.json');

function pct(before: number, after: number): string {
  if (before === 0) return after === 0 ? '0%' : '+∞';
  const delta = ((after - before) / before) * 100;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta)}%`;
}

function printDelta(baseline: PerfResult[], latest: PerfResult[]) {
  const byScenario = new Map(baseline.map(r => [r.scenario, r]));
  const rows = latest.map(cur => {
    const base = byScenario.get(cur.scenario);
    if (!base) return { scenario: cur.scenario, note: 'new scenario (no baseline)' };
    return {
      scenario: cur.scenario,
      cellRenders: `${base.cellRenders} → ${cur.cellRenders} (${pct(base.cellRenders, cur.cellRenders)})`,
      reactMs: `${base.reactMs} → ${cur.reactMs} (${pct(base.reactMs, cur.reactMs)})`,
      wallMs: `${base.wallMs} → ${cur.wallMs} (${pct(base.wallMs, cur.wallMs)})`,
    };
  });
  // eslint-disable-next-line no-console
  console.log('\n=== DELTA vs baseline (before → after) ===');
  // eslint-disable-next-line no-console
  console.table(rows);
}

export function report(results: PerfResult[]) {
  // eslint-disable-next-line no-console
  console.log('\n=== SnowTable perf — current run ===');
  // eslint-disable-next-line no-console
  console.table(results);

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(LATEST, JSON.stringify(results, null, 2));

  const force = process.env.PERF_SAVE_BASELINE === '1';
  if (force || !existsSync(BASELINE)) {
    writeFileSync(BASELINE, JSON.stringify(results, null, 2));
    // eslint-disable-next-line no-console
    console.log(`\n📌 Baseline ${force ? 'overwritten' : 'captured (first run)'} → perf/results/baseline.json`);
    // eslint-disable-next-line no-console
    console.log('   Apply your optimizations, then `pnpm perf` again to see the delta.');
  } else {
    const baseline: PerfResult[] = JSON.parse(readFileSync(BASELINE, 'utf8'));
    printDelta(baseline, results);
  }
}
