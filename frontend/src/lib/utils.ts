// Utility helpers for frontend

// Determine API base URL based on environment (same logic as in AuthContext)
export function getApiBaseUrl(): string {
  // Prefer env var if set
  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();

  const normalize = (base: string): string => {
    if (!base) return '';
    // If relative like "/api" or "api", prefix with origin on client
    if (!/^https?:\/\//i.test(base)) {
      if (typeof window !== 'undefined') {
        const origin = window.location.origin.replace(/\/$/, '');
        const path = base.startsWith('/') ? base : `/${base}`;
        return `${origin}${path}`.replace(/\/$/, '');
      }
      // On server we cannot resolve a relative base reliably; fall back below
      return '';
    }
    // Absolute URL: trim trailing slash
    return base.replace(/\/$/, '');
  };

  if (typeof window !== 'undefined') {
    // Client-side: compute sensible default for localhost
    const host = window.location.hostname;
    const fromEnv = normalize(envBase);
    if (fromEnv) return fromEnv;

    // Dev default: localhost or 127.0.0.1
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // Otherwise assume same-origin reverse proxy in production
    return window.location.origin.replace(/\/$/, '');
  }

  // Server-side fallback: use absolute env var if provided; else dev default
  const fromEnv = normalize(envBase);
  return fromEnv || 'http://localhost:8000';
}

// Determine Authorization scheme (e.g., "Token" or "Bearer") with env override
export function getAuthScheme(): string {
  const raw = (process.env.NEXT_PUBLIC_AUTH_SCHEME || 'Token').trim();
  // Normalize common values
  const normalized = raw.toLowerCase();
  if (normalized === 'bearer') return 'Bearer';
  if (normalized === 'token') return 'Token';
  // Fall back to provided value capitalized
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Helper function to get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind CSS class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: Date | string, locale: string = 'zh-CN'): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// Format relative time
export function formatRelativeTime(date: Date | string, locale: string = 'zh-CN'): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return rtf.format(-days, 'day');
  } else if (hours > 0) {
    return rtf.format(-hours, 'hour');
  } else if (minutes > 0) {
    return rtf.format(-minutes, 'minute');
  } else {
    return rtf.format(-seconds, 'second');
  }
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Calculate progress percentage
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}