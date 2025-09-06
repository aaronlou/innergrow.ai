'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, I18nContextType } from '@/types';
import { getMessages } from '@/locales';
import { interpolate, formatDate as formatDateUtil, formatNumber as formatNumberUtil, detectBrowserLanguage } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage }: I18nProviderProps) {
  // Get saved language from local storage, or detect browser language if none saved
  const [language, setLanguage] = useLocalStorage<Language>(
    'preferred_language', 
    defaultLanguage || detectBrowserLanguage()
  );
  
  const [messages, setMessages] = useState(() => getMessages(language));

  // Update messages when language changes
  useEffect(() => {
    setMessages(getMessages(language));
    
    // Update HTML language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    }
  }, [language]);

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const message = (messages as Record<string, string>)[key];
    
    if (!message) {
      // 开发环境下显示缺失的翻译key
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn(`Missing translation key: ${key}`);
      }
      return key;
    }
    
    // Ensure we always return a string
    if (typeof message !== 'string') {
      console.warn(`Translation for key "${key}" is not a string:`, message);
      return key;
    }
    
    if (params && typeof message === 'string') {
      return interpolate(message, params);
    }
    
    return message || key;
  };

  // 格式化日期
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return formatDateUtil(date, language, options);
  };

  // 格式化数字
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return formatNumberUtil(number, language, options);
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    formatDate,
    formatNumber,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 简化版 hook，只返回翻译函数
export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}