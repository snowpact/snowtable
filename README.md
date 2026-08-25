# @snowpact/snowtable

> Previously published as `@snowpact/react-tanstack-query-table` (now deprecated). Migration: replace the package name in imports and `package.json`, nothing else changed.

Ultra-light, registry-based data table for React + TanStack Table + TanStack Query.

**[Live Demo](https://snowpact.github.io/snowtable/)**

## Features

- **Zero heavy dependencies**: Only `@tanstack/react-query` and `@tanstack/react-table` as peer dependencies
- **Registry-based**: Inject your own i18n and Link component
- **TypeScript**: Full type support with generics
- **Two modes**: Client-side and Server-side pagination/filtering/sorting
- **Customizable**: Override styles via CSS variables

## Quick Setup

### 1. Install

```bash
npm install @tanstack/react-query @tanstack/react-table
npm install @snowpact/snowtable
```

### 2. Import styles

```tsx
// In your app entry point (main.tsx or App.tsx)
import '@snowpact/snowtable/styles.css';
```

### 3. Setup once

```tsx
// In your app entry point (main.tsx or App.tsx)
import { setupSnowTable } from '@snowpact/snowtable';
import { Link } from 'react-router-dom';
import { t } from './i18n'; // Your translation function

setupSnowTable({
  translate: (key) => t(key),
  LinkComponent: Link,
});
```

**Translation keys:**
- **Dynamic keys** (column labels, etc.) - Your `translate` function handles these
- **Static UI keys** (`dataTable.*`) - Built-in English defaults if `translate` returns the key unchanged

| Key                              | Default            |
| -------------------------------- | ------------------ |
| `dataTable.search`               | "Search..."        |
| `dataTable.elements`             | "elements"         |
| `dataTable.paginationSize`       | "per page"         |
| `dataTable.columnsConfiguration` | "Columns"          |
| `dataTable.resetFilters`         | "Reset filters"    |
| `dataTable.reset`                | "Reset"            |
| `dataTable.resetColumns`         | "Reset"            |
| `dataTable.searchFilters`        | "Search..."        |
| `dataTable.searchEmpty`          | "No results found" |
| `dataTable.selectFilter`         | "Select..."        |

Override static keys without i18n:
```tsx
setupSnowTable({
  translate: (key) => key,
  LinkComponent: Link,
  translations: { 'dataTable.search': 'Rechercher...' },
});
```

### 4. Use the table

```tsx
import { SnowClientDataTable, SnowColumnConfig } from '@snowpact/snowtable';

type User = { id: string; name: string; email: string; status: string };

const columns: SnowColumnConfig<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status', render: (item) => <Badge>{item.status}</Badge> },
];

<SnowClientDataTable
  queryKey={['users']}
  fetchAllItemsEndpoint={() => fetchUsers()}
  columnConfig={columns}
  enableGlobalSearch
  enablePagination
  enableSorting
  enableColumnConfiguration
  defaultPageSize={20}
  defaultSortBy="name"
  defaultSortOrder="asc"
  persistState
/>
```

That's it! You have a working data table.

---

## Filters

Declare filters with the `filters` prop. The table renders a **"Filters (n)"** toggle in the topbar that reveals a panel with the filter controls. Three types are supported:

```tsx
import { SnowClientDataTable, type FilterConfig } from '@snowpact/snowtable';

const filters: FilterConfig<User>[] = [
  // Categorical multi-select (the default — `type` may be omitted)
  {
    key: 'status',
    label: 'Status',
    multipleSelection: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  // Free-text "contains" (case-insensitive, SQL LIKE-style)
  { key: 'email', label: 'Email', type: 'text', placeholder: 'Filter email…' },
  // Date range over an ISO 'YYYY-MM-DD' column
  { key: 'createdAt', label: 'Created at', type: 'dateRange', minDate: '2020-01-01' },
];

<SnowClientDataTable /* … */ filters={filters} />;
```

Once a filter holds a value, its button shows a **×** to clear it in one click (the chevron is only shown while the filter is empty). A `multipleSelection` filter **keeps its list open** while you pick values — and says so with a "Multiple selection" hint — whereas a single-choice filter closes after one pick.

- **`select`** (default): categorical multi-select from `options`.
- **`text`**: free-text contains filter. The query is stored as `[query]`.
- **`dateRange`**: calendar range over an ISO `'YYYY-MM-DD'` column. The value is `[from, to]`, both inclusive; a **single day is `[day, day]`** — click the same day twice, there are no open-ended ranges.

In **server mode**, filters arrive in `fetchServerEndpoint`'s `params.filters` as `Record<string, string[]>` (e.g. `{ status: ['active'], email: ['ali'], createdAt: ['2024-01-01', '2024-12-31'] }`) — interpret each key according to its type.

To **observe** the active filters from the parent (e.g. to drive a sibling component like a map), pass **`onFiltersChange`**. It fires on mount with the initial value — including the value restored from the persisted URL (`persistState`) — and again on every change. It's read-only: the table still owns the filter state.

To filter across **several columns** (client mode), give a filter a **virtual key** (convention: `_`-prefixed) and a **`clientFilterFn`** matcher:

```tsx
{ type: 'select', key: '_affectation', label: 'Affectation', multipleSelection: true,
  options: [...agents, ...nodes],
  clientFilterFn: (item, values) => values.some(v => v === item.agentId || v === item.nodeId) }
```

The picked value flows through `columnFilters` like any filter (URL persistence, the "Filters (n)" count, `onFiltersChange`). **Client only** — in server mode `clientFilterFn` is ignored and the value arrives in `params.filters['_affectation']` for you to interpret.

### Reset wording

Two distinct actions, on purpose:

- Each **individual** filter has its own **"Reset"** (`dataTable.reset`) that clears only that filter.
- The panel's **"Reset filters"** (`dataTable.resetFilters`) clears **all** column filters at once — it does not touch the search or prefilters.

---

## Advanced Configuration

### Theme Customization

Override CSS variables to match your design. Variables use `@property` so they won't override values you set before importing the styles.

```css
:root {
  --snow-table-background: #ffffff;   /* Main background */
  --snow-table-foreground: #0a0a0a;   /* Main text color */
  --snow-table-primary: #525252;      /* Accent (focus rings, active states) */
  --snow-table-muted: #737373;        /* Secondary text */
  --snow-table-surface: #f5f5f5;      /* Headers, hover, skeleton */
  --snow-table-border: #e5e5e5;       /* All borders */
  --snow-table-radius: 0.375rem;

  /* Optional */
  --snow-table-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --snow-table-row-even: transparent;           /* Alternate row background */
  --snow-table-action-surface: #f5f5f5;         /* Action buttons background (falls back to surface) */
}

/* Dark mode */
.dark {
  --snow-table-background: #1a1a2e;
  --snow-table-foreground: #eaeaea;
  --snow-table-primary: #3b82f6;
  --snow-table-muted: #a0a0a0;
  --snow-table-surface: #16213e;
  --snow-table-border: #0f3460;
  --snow-table-row-even: #1f1f3a;
}
```

#### Styling the controls apart from the grid

The variables above drive **both** the data grid and the controls (buttons, inputs, dropdowns, tabs, pagination, calendar). To restyle only the controls — rounder buttons, a thicker control border, a different calendar accent — set these instead. Each one **falls back to its `--snow-table-*` counterpart**, so leaving it unset changes nothing:

| Variable | Falls back to | Applies to |
| --- | --- | --- |
| `--snow-control-radius` | `--snow-table-radius` | buttons, inputs, selects, popovers, dropdown items, tabs, pagination, calendar days |
| `--snow-control-border` | `--snow-table-border` | the same controls' borders + separators |
| `--snow-calendar-accent` | `--snow-table-primary` | selected day, in-range days, day focus ring, the "Apply" button |

```css
:root {
  --snow-control-radius: 999px;   /* pill-shaped controls, grid corners untouched */
  --snow-control-border: #94a3b8; /* stronger control outline */
  --snow-calendar-accent: #16a34a;
}
```

> These three are intentionally **not** registered with `@property`: an `@property` `initial-value` would always win over the fallback, breaking the inheritance from `--snow-table-*`.

#### Calendar DOM (portaled)

The date-range panel is rendered through a **portal into `<body>`**, so it escapes the table's overflow — which also means a `className` scoped on the table does **not** reach it. Scope on `.snow-calendar-popover` instead, the panel's root:

```
.snow-calendar-popover            ← portaled panel root (also .snow-popover-content)
├─ .snow-calendar                 ← the grid
│  ├─ .snow-calendar-header       → .snow-calendar-title, nav buttons
│  ├─ .snow-calendar-weekdays     → .snow-calendar-weekday
│  └─ .snow-calendar-grid         → .snow-calendar-day
│                                    (-selected, -in-range, -range-start,
│                                     -range-end, -today, -blank)
└─ .snow-calendar-footer          ← sibling of the grid, holds Reset + .snow-calendar-apply
```

```css
/* Reaches the panel even though it lives outside the table */
.snow-calendar-popover .snow-calendar-apply { text-transform: uppercase; }
```

### Scoped Theming with `className`

For full control over sizes, paddings, typography, etc., pass a `className` to scope your CSS:

```tsx
<SnowClientDataTable className="my-theme" ... />
```

```css
.my-theme .snow-input { height: 36px; }
.my-theme .snow-table-header-cell { text-transform: uppercase; }
.my-theme .snow-table-cell { padding: 0.75rem 1rem; }
```

The double-class specificity (`.my-theme .snow-*`) wins over defaults — no `!important`, no load-order issues. Multiple tables can use different themes simultaneously.

### HMR Support

Use `resetSnowTable` if HMR doesn't pick up changes to your setup:

```tsx
import { setupSnowTable, resetSnowTable } from '@snowpact/snowtable';

if (import.meta.hot) resetSnowTable();
setupSnowTable({ /* ... */ });
```

---

## Client vs Server Mode

| Mode       | Component             | Use case      | Data handling                            |
| ---------- | --------------------- | ------------- | ---------------------------------------- |
| **Client** | `SnowClientDataTable` | < 5,000 items | All data loaded, filtered/sorted locally |
| **Server** | `SnowServerDataTable` | > 5,000 items | Server handles pagination/filtering      |

### SnowClientDataTable

Fetches all data once, handles everything in the browser:

```tsx
<SnowClientDataTable
  queryKey={['users']}
  fetchAllItemsEndpoint={() => api.getUsers()}
  columnConfig={columns}
/>
```

### SnowServerDataTable

Server handles pagination, search, filtering, and sorting:

```tsx
import { SnowServerDataTable, ServerFetchParams } from '@snowpact/snowtable';

const fetchUsers = async (params: ServerFetchParams) => {
  // params: { limit, offset, search?, sortBy?, sortOrder?, filters?, prefilter? }
  const response = await api.getUsers(params);
  return {
    items: response.data,
    totalItemCount: response.total,
  };
};

<SnowServerDataTable
  queryKey={['users']}
  fetchServerEndpoint={fetchUsers}
  columnConfig={columns}
/>
```

---

## Custom Component Classes

Add your own CSS classes (e.g., Tailwind) to specific components without overriding existing styles:

```tsx
setupSnowTable({
  translate: (key) => t(key),
  LinkComponent: Link,
  styles: {
    searchBar: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  },
});
```

| Key         | Component       |
| ----------- | --------------- |
| `searchBar` | SearchBar input |

---

## Actions

Actions appear as buttons in each row:

### Click Action

```tsx
{
  type: 'click',
  icon: EditIcon,
  label: 'Edit',
  onClick: (item) => openEditModal(item),
}
```

### Link Action

```tsx
{
  type: 'link',
  icon: EyeIcon,
  label: 'View',
  href: (item) => `/users/${item.id}`,
  external: false,  // true for target="_blank"
}
```

### Endpoint Action

For API calls with built-in mutation handling:

```tsx
{
  type: 'endpoint',
  icon: TrashIcon,
  label: 'Delete',
  className: 'destructive-button',  // Add custom styling
  endpoint: (item) => api.deleteUser(item.id),
  onSuccess: () => {
    toast.success('User deleted');
    queryClient.invalidateQueries(['users']);
  },
  onError: (error) => toast.error(error.message),
}
```

### Endpoint with Confirmation

Use `withConfirm` to show a confirmation dialog before the endpoint is called:

```tsx
{
  type: 'endpoint',
  icon: TrashIcon,
  label: 'Delete',
  endpoint: (item) => api.deleteUser(item.id),
  withConfirm: async (item) => {
    // Return true to proceed, false to cancel
    return window.confirm(`Delete ${item.name}?`);
    // Or use your own dialog library (e.g., sweetalert2, radix-ui/dialog)
  },
  onSuccess: () => queryClient.invalidateQueries(['users']),
}
```

The endpoint is only called if `withConfirm` returns `true` (or a truthy Promise).

### Dynamic Actions

```tsx
actions={[
  (item) => ({
    type: 'click',
    icon: item.isActive ? PauseIcon : PlayIcon,
    label: item.isActive ? 'Deactivate' : 'Activate',
    onClick: () => toggleStatus(item),
    hidden: item.role === 'admin',
  }),
]}
```

---

## Search & Prefilters

> Column filters (categorical / text / date-range) have their own section: **[Filters](#filters)**.

### Global Search

```tsx
<SnowClientDataTable
  enableGlobalSearch
  texts={{ searchPlaceholder: 'Search users...' }}
/>
```

### Prefilters (Tabs)

```tsx
<SnowClientDataTable
  prefilters={[
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
  ]}
  prefilterFn={(item, prefilterId) => {
    if (prefilterId === 'all') return true;
    return item.status === prefilterId;
  }}
/>
```

---

## Other Features

### URL State Persistence

```tsx
<SnowClientDataTable persistState />
```

Saves prefilter, pagination, search, filters, and sorting in URL query params — restored on reload, back-navigation and shared links:

| Param | Holds | Example |
| --- | --- | --- |
| `dt_prefilter` | active prefilter id | `dt_prefilter=active` |
| `dt_page` | page number (1-based; absent on page 1) | `dt_page=3` |
| `dt_pageSize` | page size (absent when it's the default) | `dt_pageSize=50` |
| `dt_search` | global search query | `dt_search=alice` |
| `dt_filters` | column filters, `key:v1,v2` joined by `\|` | `dt_filters=status:active,pending\|createdAt:2024-01-01,2024-12-31` |
| `dt_sortBy` / `dt_sortDesc` | sorted column + direction | `dt_sortBy=name&dt_sortDesc=false` |

Keys and values in `dt_filters` are percent-encoded, so a text query may safely contain `,` `:` or `|`.

#### Using it with a router (`persistStorage`)

By default the table writes those keys with `history.replaceState`. **A client-side router doesn't observe that**: its next navigation serializes a location that predates the table's writes and drops the `dt_*` params. In a routed app, hand the table a router-backed storage so *your router* owns the URL:

```tsx
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();

<SnowClientDataTable
  persistState
  persistStorage={{
    getItem: key => searchParams.get(key),
    setItem: (key, value) =>
      setSearchParams(
        prev => {
          if (value === null) prev.delete(key);
          else prev.set(key, value);
          return prev;
        },
        { replace: true }
      ),
  }}
/>;
```

The object doesn't need to be memoized. Any `TableStateStorage` (`getItem` / `setItem`) works — pass a `sessionStorage`-backed one to persist state without touching the URL at all.

### Column Configuration

```tsx
<SnowClientDataTable
  enableColumnConfiguration
  columnConfig={[
    { key: 'name' },
    { key: 'details', meta: { defaultHidden: true } },
  ]}
/>
```

### Sorting

```tsx
<SnowClientDataTable
  enableSorting
  defaultSortBy="createdAt"
  defaultSortOrder="desc"
/>
```

### Row Click

```tsx
<SnowClientDataTable
  onRowClick={(item) => navigate(`/users/${item.id}`)}
  activeRowId={selectedUserId}
/>
```

### Custom Column Rendering

```tsx
const columns: SnowColumnConfig<User>[] = [
  { key: 'name', label: 'Name' },
  {
    key: 'status',
    label: 'Status',
    render: (item) => (
      <span className={item.status === 'active' ? 'text-green-500' : 'text-red-500'}>
        {item.status}
      </span>
    ),
  },
  {
    key: '_extra_fullName',  // Use _extra_ prefix for computed columns
    label: 'Full Name',
    render: (item) => `${item.firstName} ${item.lastName}`,
    searchableValue: (item) => `${item.firstName} ${item.lastName}`,
  },
];
```

### Column Metadata (meta)

Use `meta` to customize column appearance and behavior:

```tsx
import { SnowColumnConfig, SnowColumnMeta } from '@snowpact/snowtable';

const columns: SnowColumnConfig<User>[] = [
  {
    key: 'id',
    label: 'ID',
    meta: {
      width: '80px',
      center: true,
    },
  },
  {
    key: 'name',
    label: 'Name',
    meta: {
      minWidth: '150px',
      maxWidth: '300px',
    },
  },
  {
    key: 'description',
    label: 'Description',
    meta: {
      defaultHidden: true,  // Hidden by default in column configuration
    },
  },
  {
    key: 'actions',
    label: '',
    meta: {
      width: 'auto',
      disableColumnClick: true,  // Don't trigger onRowClick for this column
    },
  },
];
```

#### SnowColumnMeta options

| Option               | Type               | Description                                               |
| -------------------- | ------------------ | --------------------------------------------------------- |
| `width`              | `string \| number` | Column width (e.g., `'200px'`, `'20%'`, `'auto'`)         |
| `minWidth`           | `string \| number` | Minimum column width                                      |
| `maxWidth`           | `string \| number` | Maximum column width                                      |
| `defaultHidden`      | `boolean`          | Hide column by default (with `enableColumnConfiguration`) |
| `disableColumnClick` | `boolean`          | Disable `onRowClick` for this column                      |
| `center`             | `boolean`          | Center column content                                     |

---

## API Reference

### SnowClientDataTable Props

| Prop                        | Type                    | Default  | Description                     |
| --------------------------- | ----------------------- | -------- | ------------------------------- |
| `queryKey`                  | `string[]`              | Required | React Query cache key           |
| `fetchAllItemsEndpoint`     | `() => Promise<T[]>`    | Required | Data fetching function          |
| `columnConfig`              | `SnowColumnConfig<T>[]` | Required | Column definitions              |
| `actions`                   | `TableAction<T>[]`      | -        | Row actions                     |
| `filters`                   | `FilterConfig<T>[]`     | -        | Column filters                  |
| `prefilters`                | `PreFilter[]`           | -        | Tab filters                     |
| `prefilterFn`               | `(item, id) => boolean` | -        | Client-side prefilter logic     |
| `persistState`              | `boolean`               | `false`  | Persist state in URL            |
| `enableGlobalSearch`        | `boolean`               | `false`  | Enable search bar               |
| `enablePagination`          | `boolean`               | `true`   | Enable pagination               |
| `enableSorting`             | `boolean`               | `true`   | Enable column sorting           |
| `enableColumnConfiguration` | `boolean`               | `false`  | Enable column visibility toggle |
| `defaultPageSize`           | `number`                | `10`     | Initial page size               |
| `defaultSortBy`             | `string`                | -        | Initial sort column             |
| `defaultSortOrder`          | `'asc' \| 'desc'`       | `'asc'`  | Initial sort direction          |
| `className`                 | `string`                 | -        | CSS class on root wrapper (scoped theming) |
| `subHeader`                 | `(ctx) => Partial<Record<keyof T, ReactNode>>` | -        | Row under the header (subtotals) — see [Sub-header row](#sub-header-subtotals-row) |
| `actionsMode`               | `'hover' \| 'visible'` | `'hover'` | Actions display: `'hover'` (pinned, revealed on hover, reserves no width) or `'visible'` (normal column) |

### SnowServerDataTable Props

Same as `SnowClientDataTable`, plus:

| Prop                  | Type                                                                 | Description              |
| --------------------- | -------------------------------------------------------------------- | ------------------------ |
| `fetchServerEndpoint` | `(params: ServerFetchParams) => Promise<ServerPaginatedResponse<T>>` | Paginated fetch function |

### ServerFetchParams

```typescript
interface ServerFetchParams {
  limit: number;
  offset: number;
  search?: string;
  prefilter?: string;
  filters?: Record<string, string[]>;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

### ServerPaginatedResponse

```typescript
interface ServerPaginatedResponse<T> {
  items: T[];
  totalItemCount: number;
}
```

## Sub-header (subtotals) row

Render a row directly under the column headers — typically subtotals. The table only **places** the
aligned row (it follows column order, widths, visibility and responsive automatically); **you** compute
and format the values, exactly like a `render` cell. `subHeader` is the **same callback on both tables**:
it receives `{ rows, filters }` and returns a `columnKey → content` map. Columns absent from the map get
an empty cell; omit `subHeader` entirely for no row.

```typescript
type SnowSubHeaderContext<T> = {
  rows: T[]; // client: all filtered rows (every page) · server: current page's items
  filters: { search: string; columnFilters: Record<string, string[]>; prefilter?: string };
};
```

- **Client** — `rows` is every filtered row across all pages, so the subtotals **react** to search and
  filters (recomputed only when the filtered set changes; passing `rows` is a reference, not a copy).
- **Server** — `rows` is the current page's items. For a whole-dataset total, return a value from your
  own source (the server response, a dedicated query, …); `filters` is provided so you can keep it in sync.

```tsx
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

<SnowClientDataTable
  queryKey={['invoices']}
  columnConfig={columns}
  fetchAllItemsEndpoint={fetchInvoices}
  subHeader={({ rows }) => ({
    reference: 'Total', // a label is just another column's value — no special case
    amount: usd(rows.reduce((sum, i) => sum + i.amount, 0)),
    vat: usd(rows.reduce((sum, i) => sum + i.vat, 0)),
  })}
/>
```

Values can be plain strings or any `ReactNode` (`<strong>…</strong>`, a badge, …). The row's emphasis
comes from the built-in `.snow-table-subheader-row` / `.snow-table-subheader-cell` styles.

## Actions column display (`actionsMode`)

Actions default to **`actionsMode="hover"`**: on wide tables the actions column is a hover-revealed
overlay pinned to the right edge — it reserves no width (so it adds nothing to the horizontal scroll)
and the buttons appear when you hover a row. In responsive card mode / very narrow tables it is a no-op.

Pass **`actionsMode="visible"`** for a normal, visible actions column:

```tsx
<SnowClientDataTable
  queryKey={['users']}
  columnConfig={columns}
  actions={actions}
  fetchAllItemsEndpoint={fetchUsers}
  actionsMode="visible"  {/* omit for the default hover overlay */}
/>
```

Styling hooks: `.snow-sticky-actions` (added to the scroll wrapper in `'hover'` mode) and
`.snow-table-actions-cell` (on the actions column's cells).

## License

MIT
