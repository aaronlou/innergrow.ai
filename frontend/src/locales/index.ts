import { Language } from '@/types';
import en from './en';
import zh from './zh';

export const messages = {
  en,
  zh,
};

export function getMessages(language: Language) {
  return messages[language] || messages.en;
}

export * from './en';
export * from './zh';