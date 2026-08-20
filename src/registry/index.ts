/**
 * SnowTable Registry
 *
 * Central setup function for configuring SnowTable with consumer-provided dependencies.
 */

import type { ComponentType } from 'react';

import { registerLinkComponent, resetLinkRegistry, type LinkProps } from './linkRegistry';
import { setStyles, resetStylesRegistry, type StylesConfig } from './stylesRegistry';
import {
  setTranslationFunction,
  setTranslations,
  resetTranslationRegistry,
  type DataTableTranslationKey,
} from './translationRegistry';

export interface SetupSnowTableOptions {
  /**
   * Translation function (required)
   * Used for all text in the table (column labels, UI elements, etc.)
   * For static UI keys (dataTable.*), if your function returns the key unchanged,
   * built-in English defaults are used as fallback.
   */
  translate: (key: string) => string;

  /**
   * Custom translations to merge with defaults (optional)
   * Useful for simple overrides without a full i18n setup
   */
  translations?: Partial<Record<DataTableTranslationKey, string>>;

  /**
   * Link component for navigation (required for actions with href)
   * Use your router's Link component (react-router, next/link, etc.)
   */
  LinkComponent: ComponentType<LinkProps>;

  /**
   * Custom CSS class names for SnowTable components (optional)
   * Use this to add your own classes (e.g., Tailwind) without overriding existing styles
   */
  styles?: StylesConfig;
}

let isSetup = false;

export const setupSnowTable = (options: SetupSnowTableOptions) => {
  if (isSetup) return;

  // Set translation function (required)
  setTranslationFunction(options.translate);

  // Merge custom translations if provided (for static keys only)
  if (options.translations) {
    setTranslations(options.translations);
  }

  // Set custom styles if provided
  if (options.styles) {
    setStyles(options.styles);
  }

  registerLinkComponent(options.LinkComponent);

  isSetup = true;
};

export const resetSnowTable = () => {
  isSetup = false;
  resetTranslationRegistry();
  resetLinkRegistry();
  resetStylesRegistry();
};

export const isSnowTableSetup = () => isSetup;

// Re-export everything needed
export { getT, getTranslationKeys } from './translationRegistry';
export { getLink, type LinkProps } from './linkRegistry';
export { getStyles, type StylesConfig } from './stylesRegistry';
