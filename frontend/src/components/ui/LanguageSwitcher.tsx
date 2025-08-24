'use client';

import { useState } from 'react';
import { Button, Dropdown, DropdownItem } from '@/components/ui';
import { Language } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
  variant?: 'dropdown' | 'toggle';
}

export function LanguageSwitcher({ 
  currentLanguage, 
  onLanguageChange, 
  className,
  variant = 'dropdown'
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);
  
  if (variant === 'toggle') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              currentLanguage === lang.code
                ? "bg-brand-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" className={className}>
          🌐 {currentLang?.nativeName}
          <span className="ml-1 text-xs">▼</span>
        </Button>
      }
      align="right"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <DropdownItem
          key={lang.code}
          onClick={() => {
            onLanguageChange(lang.code);
            setIsOpen(false);
          }}
          className={cn(
            "flex items-center gap-2",
            currentLanguage === lang.code && "bg-muted"
          )}
        >
          <span className="text-base">
            {lang.code === 'en' ? '🇺🇸' : '🇨🇳'}
          </span>
          <div className="flex flex-col">
            <span className="font-medium">{lang.nativeName}</span>
            <span className="text-xs text-muted-foreground">{lang.name}</span>
          </div>
          {currentLanguage === lang.code && (
            <span className="ml-auto text-brand-primary">✓</span>
          )}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

// 简化版语言切换按钮（用于移动端或空间受限的地方）
export function LanguageToggle({ 
  currentLanguage, 
  onLanguageChange, 
  className 
}: Omit<LanguageSwitcherProps, 'variant'>) {
  const nextLanguage = currentLanguage === 'en' ? 'zh' : 'en';
  const currentFlag = currentLanguage === 'en' ? '🇺🇸' : '🇨🇳';
  
  return (
    <button
      onClick={() => onLanguageChange(nextLanguage)}
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors hover:bg-muted",
        className
      )}
      title={`Switch to ${nextLanguage === 'en' ? 'English' : '中文'}`}
    >
      <span>{currentFlag}</span>
      <span className="text-xs">⇄</span>
    </button>
  );
}