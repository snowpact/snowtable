/**
 * Built-in Popover component using Radix UI.
 *
 * Thin wrapper mirroring {@link ./DropdownMenu}. Supports controlled open state
 * (`open` / `onOpenChange`) so callers can close the panel programmatically
 * (e.g. an "Apply" button). The content reuses the shared panel styling and
 * open/closed/side animations via the `snow-popover-content` class.
 */

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ReactNode } from 'react';

import { cn } from '../utils';

interface RootProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

function Root({ children, open, onOpenChange, modal = false }: RootProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      {children}
    </PopoverPrimitive.Root>
  );
}

interface TriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

function Trigger({ asChild, children }: TriggerProps) {
  return <PopoverPrimitive.Trigger asChild={asChild}>{children}</PopoverPrimitive.Trigger>;
}

interface ContentProps {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
  className?: string;
  children: ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
}

function Content({ align = 'start', sideOffset = 4, className, children, onOpenAutoFocus }: ContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        onOpenAutoFocus={onOpenAutoFocus}
        className={cn('snow-popover-content', className)}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function Close({ asChild, children }: { asChild?: boolean; children: ReactNode }) {
  return <PopoverPrimitive.Close asChild={asChild}>{children}</PopoverPrimitive.Close>;
}

export const Popover = {
  Root,
  Trigger,
  Content,
  Close,
};
