import { Language } from '@/types';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
];

// 默认语言
export const DEFAULT_LANGUAGE: Language = 'en';

// 语言检测
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

// 文本插值函数
export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

// 格式化日期
export function formatDate(date: Date, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

// 格式化数字
export function formatNumber(number: number, language: Language, options?: Intl.NumberFormatOptions): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(number);
}

// 格式化货币
export function formatCurrency(amount: number, language: Language): string {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const currency = language === 'zh' ? 'CNY' : 'USD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// 获取语言方向（为将来支持RTL语言预留）
export function getLanguageDirection(language: Language): 'ltr' | 'rtl' {
  return 'ltr'; // 目前中英文都是从左到右
}