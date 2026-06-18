import { useState, useCallback, useEffect } from 'react';
import {
  SnowClientDataTable,
  SnowServerDataTable,
  setupSnowTable,
  type SnowColumnConfig,
  type ServerFetchParams,
  type ServerPaginatedResponse,
  type TopbarElements,
} from '@snowpact/snowtable';
import { CodePanel, ConfigPanel, type DemoConfig, type User, type ThemeColors, defaultTheme } from './components';
import { EditIcon, TrashIcon, EyeIcon, CopyIcon, MailIcon, ArchiveIcon } from './icons';

// Setup Snow Table
// translate is required for dynamic keys (column labels, etc.)
// Static UI keys (dataTable.*) have built-in English defaults as fallback
setupSnowTable({
  translate: (key) => key, // Returns key as-is, built-in defaults are used for dataTable.* keys
  LinkComponent: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
});

// Mock data generator
const generateUsers = (count: number): User[] => {
  const names = [
    'Alice Martin',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Helen Troy',
    'Ivan Drago',
    'Julia Roberts',
  ];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Product', 'Design', 'Support'];
  const roles: User['role'][] = ['admin', 'user', 'guest'];
  const statuses: User['status'][] = ['active', 'inactive', 'pending'];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(' ', '.')}${i > 9 ? i : ''}@example.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    department: departments[i % departments.length],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
};

const allUsers = generateUsers(50);

// Fetch functions
const fetchUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return allUsers;
};

const fetchUsersServer = async (params: ServerFetchParams): Promise<ServerPaginatedResponse<User>> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  let filtered = [...allUsers];

  // Apply prefilter
  if (params.prefilter && params.prefilter !== 'all') {
    filtered = filtered.filter(u => u.status === params.prefilter);
  }

  // Apply search
  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.department.toLowerCase().includes(search)
    );
  }

  // Apply filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter(u => values.includes(String(u[key as keyof User])));
      }
    });
  }

  // Apply sorting
  if (params.sortBy) {
    filtered.sort((a, b) => {
      const aVal = String(a[params.sortBy as keyof User] ?? '');
      const bVal = String(b[params.sortBy as keyof User] ?? '');
      const cmp = aVal.localeCompare(bVal);
      return params.sortOrder === 'DESC' ? -cmp : cmp;
    });
  }

  const total = filtered.length;
  const items = filtered.slice(params.offset, params.offset + params.limit);

  return { items, totalItemCount: total };
};

const deleteUser = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Deleted user:', id);
};

// Column configuration
const columns: SnowColumnConfig<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', sortable: false },
  {
    key: 'role',
    label: 'Role',
    sortable: false,
    render: item => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.role === 'admin'
            ? 'bg-purple-100 text-purple-700'
            : item.role === 'user'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {item.role}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: item => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.status === 'active'
            ? 'bg-green-100 text-green-700'
            : item.status === 'inactive'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {item.status}
      </span>
    ),
  },
  { key: 'department', label: 'Department' },
];

// Filters configuration
const filters = [
  {
    key: 'role' as const,
    label: 'Role',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' },
      { value: 'guest', label: 'Guest' },
    ],
  },
  {
    key: 'status' as const,
    label: 'Status',
    multipleSelection: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' },
    ],
  },
];

// Prefilters configuration
const prefilters = [
  { id: 'all', label: 'All Users' },
  { id: 'active', label: 'Active' },
];

export function App() {
  const [config, setConfig] = useState<DemoConfig>({
    mode: 'client',
    enableGlobalSearch: true,
    enablePagination: true,
    enableSorting: true,
    enableColumnConfiguration: true,
    enableFilters: true,
    enablePrefilters: true,
    persistState: false,
    enableRowClick: false,
    customTopbarOrder: false,
    mobilePreview: false,
  });

  const [fullscreen, setFullscreen] = useState(false);
  const [currentThemeName, setCurrentThemeName] = useState('default');
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(defaultTheme);

  // Apply theme CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    // Required variables (7)
    root.style.setProperty('--snow-table-background', currentTheme.background);
    root.style.setProperty('--snow-table-foreground', currentTheme.foreground);
    root.style.setProperty('--snow-table-primary', currentTheme.primary);
    root.style.setProperty('--snow-table-muted', currentTheme.muted);
    root.style.setProperty('--snow-table-surface', currentTheme.surface);
    root.style.setProperty('--snow-table-border', currentTheme.border);
    root.style.setProperty('--snow-table-radius', currentTheme.radius);

    // Optional variables
    if (currentTheme.rowEven) {
      root.style.setProperty('--snow-table-row-even', currentTheme.rowEven);
    } else {
      root.style.removeProperty('--snow-table-row-even');
    }
    if (currentTheme.shadow) {
      root.style.setProperty('--snow-table-shadow', currentTheme.shadow);
    } else {
      root.style.removeProperty('--snow-table-shadow');
    }
    if (currentTheme.actionSurface) {
      root.style.setProperty('--snow-table-action-surface', currentTheme.actionSurface);
    } else {
      root.style.removeProperty('--snow-table-action-surface');
    }
  }, [currentTheme]);

  const handleThemeChange = useCallback((themeName: string, theme: ThemeColors) => {
    setCurrentThemeName(themeName);
    setCurrentTheme(theme);
  }, []);

  const toggleConfig = useCallback((key: keyof DemoConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setMode = useCallback((mode: 'client' | 'server') => {
    setConfig(prev => ({ ...prev, mode }));
  }, []);

  const actions = [
    {
      type: 'link' as const,
      icon: EyeIcon,
      label: 'View',
      href: (user: User) => `#/users/${user.id}`,
    },
    {
      type: 'click' as const,
      icon: EditIcon,
      label: 'Edit',
      onClick: (user: User) => {
        alert(`Edit user: ${user.name}`);
      },
    },
    {
      type: 'endpoint' as const,
      icon: TrashIcon,
      label: 'Delete the item permanently from the database',
      className: 'text-red-500',
      endpoint: (user: User) => deleteUser(user.id),
      withConfirm: (user: User) => window.confirm(`Delete user "${user.name}"?`),
      onSuccess: () => alert('User deleted!'),
    },
    // Dropdown actions
    {
      type: 'click' as const,
      icon: CopyIcon,
      label: 'Duplicate',
      display: 'dropdown' as const,
      onClick: (user: User) => {
        alert(`Duplicating user: ${user.name}`);
      },
    },
    {
      type: 'click' as const,
      icon: MailIcon,
      label: 'Send Email',
      display: 'dropdown' as const,
      onClick: (user: User) => {
        alert(`Sending email to: ${user.email}`);
      },
    },
    {
      type: 'click' as const,
      icon: ArchiveIcon,
      label: 'Archive',
      display: 'dropdown' as const,
      onClick: (user: User) => {
        alert(`Archiving user: ${user.name}`);
      },
    },
  ];

  const themeClassName = currentThemeName === 'signaleo' ? 'snow-signaleo-table' : undefined;

  const tableProps = {
    queryKey: ['users', config.mode],
    columnConfig: columns,
    actions,
    className: themeClassName,
    enableGlobalSearch: config.enableGlobalSearch,
    enablePagination: config.enablePagination,
    enableSorting: config.enableSorting,
    enableColumnConfiguration: config.enableColumnConfiguration,
    persistState: config.persistState,
    defaultPageSize: 10,
    paginationSizes: [10, 25, 50, 100],
    displayTotalNumber: true,
    ...(config.enableFilters && { filters }),
    ...(config.enablePrefilters && { prefilters }),
    ...(config.enablePrefilters &&
      config.mode === 'client' && {
        prefilterFn: (item: User, id: string) => id === 'all' || item.status === id,
      }),
    ...(config.enableRowClick && {
      onRowClick: (item: User) => alert(`Clicked on ${item.name} (${item.email})`),
    }),
    // Custom topbar order: filters + a custom button moved to the left, search to the right.
    ...(config.customTopbarOrder && {
      renderTopbar: ({ prefilters, search, filters, columnConfiguration, resetFilters }: TopbarElements) => (
        <div className="snow-topbar-right" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {filters}
            <button
              onClick={() => alert('Custom topbar action!')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #e5e5e5',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              ⭐ Custom
            </button>
            {prefilters}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {search}
            {columnConfiguration}
            {resetFilters}
          </div>
        </div>
      ),
    }),
  };

  if (fullscreen) {
    return (
      <div className="min-h-screen">
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-gray-700"
        >
          Exit Fullscreen
        </button>
        {config.mode === 'client' ? (
          <SnowClientDataTable
            key={`client-${config.persistState}-fs`}
            {...tableProps}
            fetchAllItemsEndpoint={fetchUsers}
          />
        ) : (
          <SnowServerDataTable
            key={`server-${config.persistState}-fs`}
            {...tableProps}
            fetchServerEndpoint={fetchUsersServer}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Code Panel - Left Side */}
      <div className="w-96 flex-shrink-0 h-screen sticky top-0">
        <CodePanel config={config} theme={currentTheme} />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">@snowpact/snowtable</h1>
          <p className="text-gray-600 mb-8">
            Ultra-light, registry-based data table for React + TanStack Table + TanStack Query
          </p>

          <div
            className={`bg-white rounded-lg shadow-md p-6 mb-8 overflow-visible transition-all ${
              config.mobilePreview ? 'max-w-[375px] mx-auto ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  config.mode === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {config.mode === 'client' ? 'SnowClientDataTable' : 'SnowServerDataTable'}
              </span>
              <span className="text-gray-500">
                {config.mode === 'client' ? '50 items loaded, filtered locally' : 'Server-side pagination & filtering'}
              </span>
              {config.mobilePreview && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  Mobile Preview (375px)
                </span>
              )}
              <button
                onClick={() => setFullscreen(true)}
                className="ml-auto px-3 py-1 rounded text-xs font-medium bg-gray-800 text-white hover:bg-gray-700"
              >
                Fullscreen
              </button>
            </div>

            {config.mode === 'client' ? (
              <SnowClientDataTable
                key={`client-${config.persistState}`}
                {...tableProps}
                fetchAllItemsEndpoint={fetchUsers}
              />
            ) : (
              <SnowServerDataTable
                key={`server-${config.persistState}`}
                {...tableProps}
                fetchServerEndpoint={fetchUsersServer}
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Features Enabled</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(config)
                .filter(([key]) => key !== 'mode' && key !== 'mobilePreview')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Config Panel - Right Side Fixed */}
      <div className="w-72 flex-shrink-0 h-screen sticky top-0">
        <ConfigPanel
          config={config}
          onToggle={toggleConfig}
          onModeChange={setMode}
          currentTheme={currentThemeName}
          onThemeChange={handleThemeChange}
        />
      </div>
    </div>
  );
}
