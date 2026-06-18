export interface DemoConfig {
  mode: 'client' | 'server';
  enableGlobalSearch: boolean;
  enablePagination: boolean;
  enableSorting: boolean;
  enableColumnConfiguration: boolean;
  enableFilters: boolean;
  enablePrefilters: boolean;
  persistState: boolean;
  enableRowClick: boolean;
  customTopbarOrder: boolean;
  mobilePreview: boolean;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  muted: string;
  surface: string;
  border: string;
  radius: string;
  // Optional
  rowEven?: string;
  shadow?: string;
  actionSurface?: string;
}

export const defaultTheme: ThemeColors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  primary: '#525252',
  muted: '#737373',
  surface: '#f5f5f5',
  border: '#e5e5e5',
  radius: '0.375rem',
};

// Signaleo theme uses className-based scoping, not CSS variables
export interface ThemeEntry {
  colors: ThemeColors;
  className?: string; // applied to the table via className prop
}

export const themes: Record<string, ThemeColors> = {
  default: defaultTheme,
  signaleo: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#334155',
    muted: '#4b5563',
    surface: '#fbfcfd',
    border: '#f1f5fa',
    radius: '0',
    rowEven: '#fbfcfd',
    shadow: '0 1px 2px 0 rgba(228, 236, 245, 1)',
    actionSurface: '#ffffff',
  },
  dark: {
    background: '#1a1a2e',
    foreground: '#eaeaea',
    primary: '#3b82f6',
    muted: '#a0a0a0',
    surface: '#16213e',
    border: '#0f3460',
    radius: '0.375rem',
    rowEven: '#1f1f3a',
    actionSurface: '#1e3a5f',
  },
  ocean: {
    background: '#f0f9ff',
    foreground: '#0c4a6e',
    primary: '#0284c7',
    muted: '#0369a1',
    surface: '#e0f2fe',
    border: '#bae6fd',
    radius: '0.5rem',
    actionSurface: '#bae6fd',
  },
  forest: {
    background: '#f0fdf4',
    foreground: '#14532d',
    primary: '#22c55e',
    muted: '#166534',
    surface: '#dcfce7',
    border: '#86efac',
    radius: '0.25rem',
  },
  sunset: {
    background: '#fff7ed',
    foreground: '#7c2d12',
    primary: '#f97316',
    muted: '#c2410c',
    surface: '#ffedd5',
    border: '#fdba74',
    radius: '0.75rem',
  },
};

export interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  department: string;
  createdAt: string;
}
