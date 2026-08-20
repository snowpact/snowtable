# Migrating to v2

> Migration guide for [`@snowpact/snowtable`](./README.md) v1 → v2.

v2 overhauls the filter subsystem and the actions column.

## Filters are now typed + collapsed behind a toggle

`FilterConfig<T>` is a discriminated union (`type: 'select' | 'text' | 'dateRange'`, default `'select'`). **Constructing** categorical filters is unchanged, but if you *read* `.options` / `.multipleSelection` off a `FilterConfig<T>` value, narrow first:

```ts
if (!filter.type || filter.type === 'select') filter.options; // ok
```

Filters render inside a collapsible **"Filters (n)"** toggle by default (was inline). Custom `renderTopbar` layouts receive both the inline `filters` node **and** a `filtersToggle` node — the same collapsible **"Filters (n)"** button the default layout uses (its panel renders below the topbar automatically). Place one or the other, not both.

## Reset: removed `onResetFilters` / `TopbarElements.resetFilters`

The automatic "reset everything" topbar button is gone.

```diff
- <SnowClientDataTable onResetFilters={handleReset} />
- renderTopbar={({ resetFilters }) => <div>{resetFilters}</div>}
```

Instead: each filter has its own **"Reset"** (`dataTable.reset`); the panel has **"Reset filters"** (`dataTable.resetFilters`) that clears all column filters. For a full reset (search + prefilters + filters + sorting), call `useTableStatePersist().resetToDefaults()` yourself. The per-filter reset i18n key changed from `dataTable.resetFilters` to `dataTable.reset` — add it if you localize.

## Actions column: `enableStickyActions` → `actionsMode`

```diff
- <SnowClientDataTable enableStickyActions />
+ <SnowClientDataTable actionsMode="hover" />    {/* now the DEFAULT — can be omitted */}
+ <SnowClientDataTable actionsMode="visible" />  {/* previous default: a normal column */}
```

The default changed to `'hover'` (pinned to the right edge, revealed on row hover). Pass `actionsMode="visible"` for the old visible-column behavior.

## New dependencies

`@rehookify/datepicker` and `@radix-ui/react-popover` are added automatically (near-zero incremental weight — the Radix popover tree already ships via `dropdown-menu`).
