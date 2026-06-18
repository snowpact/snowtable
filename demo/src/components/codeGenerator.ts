import type { DemoConfig, ThemeColors } from './types';
import { defaultTheme } from './types';

export function generateInstallCode(): string {
  return `npm install @tanstack/react-query @tanstack/react-table
npm install @snowpact/snowtable`;
}

export function generateThemeCode(theme: ThemeColors): string {
  const isDefault = JSON.stringify(theme) === JSON.stringify(defaultTheme);

  // Build optional variable section
  const optionalVars: string[] = [];
  if (theme.shadow) {
    optionalVars.push(`  --snow-table-shadow: ${theme.shadow};`);
  }
  if (theme.rowEven) {
    optionalVars.push(`  --snow-table-row-even: ${theme.rowEven};`);
  }
  if (theme.actionSurface) {
    optionalVars.push(`  --snow-table-action-surface: ${theme.actionSurface};`);
  }
  const optionalSection = optionalVars.length > 0 ? `\n\n  /* Optional */\n${optionalVars.join('\n')}` : '';

  if (isDefault) {
    return `/* Default theme - no customization needed */
/* Override CSS variables to customize: */
:root {
  --snow-table-background: ${theme.background};
  --snow-table-foreground: ${theme.foreground};
  --snow-table-primary: ${theme.primary};
  --snow-table-muted: ${theme.muted};
  --snow-table-surface: ${theme.surface};
  --snow-table-border: ${theme.border};
  --snow-table-radius: ${theme.radius};

  /* Optional */
  /* --snow-table-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); */
  /* --snow-table-row-even: transparent; */
  /* --snow-table-action-surface: <color>; (falls back to surface) */
}`;
  }

  return `:root {
  --snow-table-background: ${theme.background};
  --snow-table-foreground: ${theme.foreground};
  --snow-table-primary: ${theme.primary};
  --snow-table-muted: ${theme.muted};
  --snow-table-surface: ${theme.surface};
  --snow-table-border: ${theme.border};
  --snow-table-radius: ${theme.radius};${optionalSection}
}`;
}

export function generateSetupCode(): string {
  return `// Import styles in your app entry point
import '@snowpact/snowtable/styles.css';

import { setupSnowTable } from '@snowpact/snowtable';
import { Link } from 'react-router-dom';
import { t } from './i18n';

setupSnowTable({
  LinkComponent: Link,
  translate: (key) => t(key),
  translations: {
    'dataTable.search': 'Search...',
    'dataTable.elements': 'elements',
    'dataTable.paginationSize': 'per page',
    'dataTable.columnsConfiguration': 'Columns',
    'dataTable.resetFilters': 'Reset filters',
    'dataTable.searchEmpty': 'No results found',
    'dataTable.selectFilter': 'Select...',
  },
});`;
}

export function generateTableCode(config: DemoConfig): string {
  const Component = config.mode === 'client' ? 'SnowClientDataTable' : 'SnowServerDataTable';
  const fetchProp =
    config.mode === 'client'
      ? 'fetchAllItemsEndpoint={() => fetchUsers()}'
      : 'fetchServerEndpoint={(params) => fetchUsersServer(params)}';

  const props: string[] = [`queryKey={['users']}`, fetchProp, `columnConfig={columns}`];

  if (config.enableGlobalSearch) props.push(`enableGlobalSearch`);
  if (config.enablePagination) {
    props.push(`enablePagination`);
    props.push(`paginationSizes={[10, 25, 50, 100]}`);
    props.push(`defaultPageSize={10}`);
  }
  if (config.enableSorting) props.push(`enableSorting`);
  if (config.enableColumnConfiguration) props.push(`enableColumnConfiguration`);
  if (config.persistState) props.push(`persistState`);

  if (config.customTopbarOrder) {
    props.push(`renderTopbar={({ prefilters, search, filters, columnConfiguration, resetFilters }) => (
    <div className="snow-topbar-right" style={{ justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {filters}
        <button onClick={() => alert('Custom topbar action!')}>⭐ Custom</button>
        {prefilters}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {search}
        {columnConfiguration}
        {resetFilters}
      </div>
    </div>
  )}`);
  }

  if (config.enableFilters) {
    props.push(`filters={[
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'guest', label: 'Guest' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      multipleSelection: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
    },
  ]}`);
  }

  if (config.enablePrefilters) {
    props.push(`prefilters={[
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
  ]}`);
    if (config.mode === 'client') {
      props.push(`prefilterFn={(item, id) => id === 'all' || item.status === id}`);
    }
  }

  props.push(`actions={[
    {
      type: 'click',
      icon: Edit,
      label: 'Edit',
      onClick: (user) => console.log('Edit', user),
    },
    {
      type: 'endpoint',
      icon: Trash,
      label: 'Delete',
      className: 'text-red-500',
      endpoint: (user) => deleteUser(user.id),
      withConfirm: (user) => window.confirm(\`Delete \${user.name}?\`),
    },
  ]}`);

  const propsStr = props.map(p => `  ${p}`).join('\n');

  return `import { ${Component}, SnowColumnConfig } from '@snowpact/snowtable';
import { Edit, Trash } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  department: string;
};

const columns: SnowColumnConfig<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'department', label: 'Department' },
];

<${Component}
${propsStr}
/>`;
}
