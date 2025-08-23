'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface DropdownProps extends ComponentProps<'div'> {
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownItemProps extends ComponentProps<'div'> {
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

type DropdownSeparatorProps = ComponentProps<'div'>;

export function Dropdown({
  trigger,
  align = 'left',
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  ...props
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = useCallback((open: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  }, [controlledOpen, onOpenChange]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, setOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef} {...props}>
      <div onClick={() => setOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-fade-in',
            'top-full mt-1',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  disabled = false,
  danger = false,
  children,
  className,
  ...props
}: DropdownItemProps) {
  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        disabled 
          ? 'pointer-events-none opacity-50' 
          : 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
        danger && !disabled && 'text-red-600 hover:bg-red-50 hover:text-red-700',
        className
      )}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownSeparator({ className, ...props }: DropdownSeparatorProps) {
  return (
    <div
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  );
}