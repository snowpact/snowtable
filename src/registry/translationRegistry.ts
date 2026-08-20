/**
 * Translation Registry
 *
 * Provides default translations and allows consumers to override with their own.
 */

type TranslationFunction = (key: string) => string;

// Default translations (English)
const defaultTranslations = {
  'dataTable.search': 'Search...',
  'dataTable.elements': 'elements',
  'dataTable.paginationSize': 'per page',
  'dataTable.columnsConfiguration': 'Columns',
  'dataTable.resetFilters': 'Reset filters',
  'dataTable.reset': 'Reset',
  'dataTable.resetColumns': 'Reset',
  'dataTable.searchFilters': 'Search...',
  'dataTable.searchEmpty': 'No results found',
  'dataTable.selectFilter': 'Select...',
  'dataTable.filters': 'Filters',
  'dataTable.apply': 'Apply',
  'dataTable.prevMonth': 'Previous month',
  'dataTable.nextMonth': 'Next month',
} satisfies Record<string, string>;

/**
 * Every UI string key SnowTable renders. Single source of truth for the public
 * `translations` override type (see SetupSnowTableOptions) — deriving it here
 * keeps the two from drifting when new keys are added.
 */
export type DataTableTranslationKey = keyof typeof defaultTranslations;

// Custom translation function (optional)
let customTranslateFn: TranslationFunction | null = null;

/**
 * Get translation for a key
 * Uses custom function if provided, otherwise falls back to defaults
 */
const translate = (key: string): string => {
  // If custom function provided, try it first
  if (customTranslateFn) {
    const result = customTranslateFn(key);
    // If custom function returns something different than the key, use it
    if (result !== key) {
      return result;
    }
  }
  // Fallback to default translations
  return defaultTranslations[key as DataTableTranslationKey] ?? key;
};

export const setTranslationFunction = (fn: TranslationFunction) => {
  customTranslateFn = fn;
};

export const getT = () => translate;

export const resetTranslationRegistry = () => {
  customTranslateFn = null;
};

/**
 * Set custom translations (merge with defaults)
 */
export const setTranslations = (translations: Partial<Record<DataTableTranslationKey, string>>) => {
  Object.assign(defaultTranslations, translations);
};

/**
 * Get all default translation keys (useful for documentation)
 */
export const getTranslationKeys = () => Object.keys(defaultTranslations);
