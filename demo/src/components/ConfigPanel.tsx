import type { DemoConfig, ThemeColors } from './types';
import { themes } from './types';

interface ConfigPanelProps {
  config: DemoConfig;
  onToggle: (key: keyof DemoConfig) => void;
  onModeChange: (mode: 'client' | 'server') => void;
  currentTheme: string;
  onThemeChange: (themeName: string, theme: ThemeColors) => void;
}

export function ConfigPanel({ config, onToggle, onModeChange, currentTheme, onThemeChange }: ConfigPanelProps) {
  return (
    <div className="bg-gray-700 text-white p-4 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-500 pb-2">
        Config Panel
      </h2>

      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('client')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                config.mode === 'client'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Client
            </button>
            <button
              onClick={() => onModeChange('server')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                config.mode === 'server'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Server
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {config.mode === 'client'
              ? 'All data loaded, filtered locally'
              : 'Paginated API, server handles filtering'}
          </p>
          <code className="block mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded text-center">
            {config.mode === 'client' ? 'SnowClientDataTable' : 'SnowServerDataTable'}
          </code>
        </div>

        <div className="border-t border-gray-500 pt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Features</h3>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enableGlobalSearch}
              onChange={() => onToggle('enableGlobalSearch')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Global Search</span>
              <p className="text-xs text-gray-400">
                Fuzzy search across all columns
              </p>
            </div>
          </label>

          <label className={`flex items-start gap-3 mb-3 ${config.mode === 'server' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={config.mode === 'server' ? true : config.enablePagination}
              onChange={() => config.mode !== 'server' && onToggle('enablePagination')}
              disabled={config.mode === 'server'}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Pagination</span>
              <p className="text-xs text-gray-400">
                {config.mode === 'server'
                  ? 'Required in server mode'
                  : 'Navigate through pages of data'}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enableSorting}
              onChange={() => onToggle('enableSorting')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Sorting</span>
              <p className="text-xs text-gray-400">
                Click column headers to sort
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enableColumnConfiguration}
              onChange={() => onToggle('enableColumnConfiguration')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Column Configuration</span>
              <p className="text-xs text-gray-400">
                Show/hide columns via settings
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enableFilters}
              onChange={() => onToggle('enableFilters')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Column Filters</span>
              <p className="text-xs text-gray-400">
                Multi-select dropdown filters
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enablePrefilters}
              onChange={() => onToggle('enablePrefilters')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Prefilters (Tabs)</span>
              <p className="text-xs text-gray-400">
                Quick segmentation via tabs
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.persistState}
              onChange={() => onToggle('persistState')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Persist State</span>
              <p className="text-xs text-gray-400">
                Save state in URL params
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={config.enableRowClick}
              onChange={() => onToggle('enableRowClick')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Row Click</span>
              <p className="text-xs text-gray-400">
                Click a row to trigger a callback
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.customTopbarOrder}
              onChange={() => onToggle('customTopbarOrder')}
              className="w-4 h-4 mt-1 text-blue-500 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Custom Topbar Order</span>
              <p className="text-xs text-gray-400">
                Reorder topbar elements via renderTopbar
              </p>
            </div>
          </label>
        </div>

        <div className="border-t border-gray-500 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(themes).map(([name, theme]) => (
              <button
                key={name}
                onClick={() => onThemeChange(name, theme)}
                className={`px-2 py-2 text-xs rounded transition-colors flex flex-col items-center gap-1 ${
                  currentTheme === name
                    ? 'ring-2 ring-blue-500 bg-gray-600'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <div
                  className="w-6 h-6 rounded border border-gray-500"
                  style={{ backgroundColor: theme.background }}
                >
                  <div
                    className="w-full h-1/2 rounded-t"
                    style={{ backgroundColor: theme.header }}
                  />
                </div>
                <span className="capitalize">{name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Override CSS variables to customize
          </p>
        </div>

        <div className="border-t border-gray-500 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Preview Mode</h3>
          <button
            onClick={() => onToggle('mobilePreview')}
            className={`w-full px-3 py-2 text-sm rounded transition-colors flex items-center justify-center gap-2 ${
              config.mobilePreview
                ? 'bg-purple-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <span>📱</span>
            {config.mobilePreview ? 'Exit Mobile View' : 'Mobile Preview'}
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Simulate mobile screen width
          </p>
        </div>

      </div>
    </div>
  );
}
