'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface ModalProps extends ComponentProps<'div'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalHeaderProps extends ComponentProps<'div'> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

type ModalContentProps = ComponentProps<'div'>;

type ModalFooterProps = ComponentProps<'div'>;

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
  ...props
}: ModalProps) {
  // 处理ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div
        className={cn(
          'relative z-50 w-full rounded-lg border bg-background p-6 shadow-lg animate-slide-in',
          modalSizes[size],
          className
        )}
        {...props}
      >
        {(title || description) && (
          <ModalHeader title={title} description={description} onClose={onClose} />
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ 
  title, 
  description, 
  onClose,
  className,
  children,
  ...props 
}: ModalHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="text-lg font-semibold">
            {title}
          </h2>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export function ModalContent({ className, children, ...props }: ModalContentProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({ className, children, ...props }: ModalFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props}>
      {children}
    </div>
  );
}