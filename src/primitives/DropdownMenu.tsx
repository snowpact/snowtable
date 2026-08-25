/**
 * Built-in DropdownMenu component using Radix UI
 */

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '../icons';
import { ReactNode } from 'react';

import { cn } from '../utils';

interface RootProps {
  children: ReactNode;
  modal?: boolean;
}

function Root({ children, modal = false }: RootProps) {
  return <DropdownMenuPrimitive.Root modal={modal}>{children}</DropdownMenuPrimitive.Root>;
}

interface TriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

function Trigger({ asChild, children }: TriggerProps) {
  return <DropdownMenuPrimitive.Trigger asChild={asChild}>{children}</DropdownMenuPrimitive.Trigger>;
}

interface ContentProps {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
  className?: string;
  children: ReactNode;
}

function Content({ align = 'end', sideOffset = 4, className, children }: ContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn('snow-dropdown-content', className)}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

interface ItemProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  asChild?: boolean;
  children: ReactNode;
}

function Item({ onClick, disabled, className, asChild, children }: ItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      onClick={onClick}
      disabled={disabled}
      asChild={asChild}
      className={cn('snow-dropdown-item', className)}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

interface CheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  children: ReactNode;
  /** Close the menu when the item is picked. Defaults to Radix's behaviour (true). */
  closeOnSelect?: boolean;
}

function CheckboxItem({ checked, onCheckedChange, className, children, closeOnSelect = true }: CheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={closeOnSelect ? undefined : e => e.preventDefault()}
      className={cn('snow-dropdown-checkbox-item', className)}
    >
      <span className="snow-dropdown-checkbox-indicator">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="snow-size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function Separator() {
  return <DropdownMenuPrimitive.Separator className="snow-dropdown-separator" />;
}

export const DropdownMenu = {
  Root,
  Trigger,
  Content,
  Item,
  CheckboxItem,
  Separator,
};
