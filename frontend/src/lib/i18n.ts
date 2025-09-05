import { Language } from '@/types';

// Supported languages
export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
];

// Default language
export const DEFAULT_LANGUAGE: Language = 'en';

// Detect browser language
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('zh')) {
    return 'zh';
  } else if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  return DEFAULT_LANGUAGE;
}

// Text interpolation helper
export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

// Format date
export function formatDate(date: Date, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

// Format number
export function formatNumber(number: number, lang: Language, options?: Intl.NumberFormatOptions): string {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(number);
}

// Format currency
export function formatCurrency(amount: number, language: Language): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const currency = language === 'zh' ? 'CNY' : 'USD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Get language direction (placeholder for future RTL support)
export function getLanguageDirection(): 'ltr' | 'rtl' {
  // Parameter is intentionally unused but kept for future RTL language support
  return 'ltr'; // English and Chinese are left-to-right for now
}
