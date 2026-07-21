/**
 * Column visibility configuration component
 */

import { Table } from '@tanstack/react-table';
import { Settings } from '../icons';
import { useMemo, useEffect } from 'react';

import { Button } from '../primitives/Button';
import { DropdownMenu } from '../primitives/DropdownMenu';
import { getT } from '../registry';
import {
  saveColumnConfiguration,
  loadColumnConfiguration,
  deriveColumnConfigurationId,
  deleteColumnConfiguration,
} from '../utils';

export type ColumnConfigurationProps<T extends object> = {
  table: Table<T>;
  /**
   * Suffix of the `datatable-config-<suffix>` cookie, unique per table.
   * Defaults to one derived from the column set; the Snow wrappers derive theirs from `queryKey`.
   */
  cookieSuffix?: string;
};

export function ColumnConfiguration<T extends object>({
  table,
  cookieSuffix: cookieSuffixProp,
}: ColumnConfigurationProps<T>) {
  const t = getT();

  const cookieSuffix =
    cookieSuffixProp ?? deriveColumnConfigurationId(table.getAllColumns().map(column => column.id));

  const configurableColumns = useMemo(() => {
    return table.getAllColumns().filter(column => {
      // Exclude columns without headers or with empty headers
      const header = column.columnDef.header;
      if (!header || (typeof header === 'string' && header.trim() === '')) {
        return false;
      }

      // Exclude columns that cannot be hidden
      if (column.columnDef.enableHiding === false) {
        return false;
      }

      return true;
    });
  }, [table]);

  const applyDefaultConfiguration = () => {
    configurableColumns.forEach(column => {
      const defaultHidden = column.columnDef.meta?.defaultHidden;
      const shouldBeVisible = !defaultHidden;
      column.toggleVisibility(shouldBeVisible);
    });
  };

  // Load column configuration from cookies on mount
  useEffect(() => {
    const savedConfig = loadColumnConfiguration(cookieSuffix);
    let hasError = false;
    if (savedConfig) {
      Object.entries(savedConfig).forEach(([columnId, isVisible]) => {
        const column = table.getColumn(columnId);
        if (column) {
          column.toggleVisibility(isVisible);
        } else {
          hasError = true;
        }
      });
      if (hasError) {
        deleteColumnConfiguration(cookieSuffix);
      }
    } else {
      applyDefaultConfiguration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieSuffix, table, configurableColumns]);

  const handleToggleVisibility = (columnId: string, checked: boolean) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.toggleVisibility(checked);

      // Get the updated visibility state after the change
      const updatedVisibility = {
        ...table.getState().columnVisibility,
        [columnId]: checked,
      };
      saveColumnConfiguration(cookieSuffix, updatedVisibility);
    }
  };

  const handleResetColumns = () => {
    // Apply default configuration (based on meta.defaultHidden)
    applyDefaultConfiguration();

    // Save the default configuration to cookies
    const defaultVisibility: Record<string, boolean> = {};
    configurableColumns.forEach(column => {
      const defaultHidden = column.columnDef.meta?.defaultHidden;
      defaultVisibility[column.id] = !defaultHidden;
    });
    saveColumnConfiguration(cookieSuffix, defaultVisibility);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button>
          <Settings className="snow-size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="snow-w-56">
        <div className="snow-flex snow-items-center snow-gap-2 snow-px-2 snow-py-1\\.5 snow-text-sm snow-font-semibold">
          <Settings className="snow-size-4" />
          {t('dataTable.columnsConfiguration')}
        </div>
        <DropdownMenu.Separator />

        <div className="snow-max-h-64 snow-overflow-y-auto">
          {configurableColumns.map(column => {
            const isVisible = column.getIsVisible();
            const header = column.columnDef.header;

            // Extract header text
            let headerText = '';
            if (typeof header === 'string') {
              headerText = header;
            } else if (typeof header === 'function') {
              headerText = column.id;
            } else {
              headerText = column.id;
            }

            return (
              <DropdownMenu.CheckboxItem
                key={column.id}
                checked={isVisible}
                onCheckedChange={checked => handleToggleVisibility(column.id, checked)}
              >
                {headerText}
              </DropdownMenu.CheckboxItem>
            );
          })}
        </div>

        <DropdownMenu.Separator />
        <DropdownMenu.Item onClick={handleResetColumns} className="snow-text-xs snow-cursor-pointer snow-text-center snow-text-muted-foreground">
          {t('dataTable.resetColumns')}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
