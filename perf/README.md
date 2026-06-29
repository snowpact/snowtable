# SnowTable perf harness

Render-perf measurement for the table. **Not part of CI** (the default `pnpm test`
only matches `src` test files; these `.perf.tsx` files live here and run via a
dedicated config).

## Commands

```bash
pnpm perf            # measure + print delta vs the saved baseline
pnpm perf:baseline   # measure + (re)write perf/results/baseline.json
```

## Workflow — "does this change actually gain?"

1. `pnpm perf:baseline` on the current code → freezes the reference.
2. Make a change (keep it green with `pnpm test`).
3. `pnpm perf` → prints `before → after (Δ%)` for every scenario.

## Metrics

| column        | meaning                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `cellRenders` | how many cells React re-rendered (instrumented `cell` fn). **Reliable.** |
| `rowRenders`  | distinct rows that re-rendered.                                          |
| `commits`     | React commit count for the interaction.                                 |
| `reactMs`     | React `<Profiler>` `actualDuration` (reconciliation time).              |
| `wallMs`      | wall-clock around the interaction.                                      |

**Read timings as relative before/after deltas, not absolute browser numbers** —
jsdom has no layout/paint, so `reactMs`/`wallMs` are JS-reconciliation only.
`cellRenders` is deterministic and machine-independent — it's the metric to trust.

## Scenarios

- **A1** mount, 500 rows — baseline cost.
- **A2** re-render parent with an unrelated prop, 500 rows — the row-memoization lever.
- **B1** `activeRowId` switch, 25 rows — selection lever.
- **B2** global filter change, 500 rows — row set genuinely changes (memo can't help).
- **B3** next page — different rows (memo can't help).
- **S1/S2** unstable vs stable `columns` ref — cost of passing inline `columns`/`data`.

`perf/results/` is gitignored (generated; timings are machine-specific).
