/**
 * Column configuration persistence utilities
 */

const COOKIE_DT_CONFIG_PREFIX = 'datatable-config-';

export const saveColumnConfiguration = (configId: string, columnVisibility: Record<string, boolean>) => {
  try {
    const cookieName = `datatable-config-${configId}`;
    const configJson = JSON.stringify(columnVisibility);
    document.cookie = `${cookieName}=${encodeURIComponent(configJson)}; path=/`;
  } catch (error) {
    console.warn('Failed to save column configuration:', error);
  }
};

export const loadColumnConfiguration = (configId: string): Record<string, boolean> | null => {
  try {
    const cookieName = `${COOKIE_DT_CONFIG_PREFIX}${configId}`;
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${cookieName}=`))
      ?.split('=')[1];

    if (cookieValue) {
      const decoded = decodeURIComponent(cookieValue);
      return JSON.parse(decoded);
    }
  } catch (error) {
    console.warn('Failed to load column configuration:', error);
  }
  return null;
};

export const deleteColumnConfiguration = (configId: string) => {
  try {
    const cookieName = `${COOKIE_DT_CONFIG_PREFIX}${configId}`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (error) {
    console.warn('Failed to delete column configuration:', error);
  }
};

/**
 * Derive a stable, table-specific cookie suffix from a signature (a `queryKey` or a column set).
 * Hash data, never code: the call stack this used to read collapsed under minification, so every
 * table shared one cookie.
 */
export const deriveColumnConfigurationId = (signatureParts: string[]): string => {
  const signature = signatureParts.join('|');
  // djb2
  let hash = 5381;
  for (let i = 0; i < signature.length; i++) {
    hash = ((hash << 5) + hash + signature.charCodeAt(i)) | 0;
  }
  return `t${(hash >>> 0).toString(36)}`;
};
