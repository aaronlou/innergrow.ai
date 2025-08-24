import { Metadata } from 'next';
import { Language } from '@/types';
import { getMessages } from '@/locales';

export function generateMetadata(language: Language): Metadata {
  const messages = getMessages(language);
  
  return {
    title: {
      default: messages['home.title'] || 'InnerGrow.ai',
      template: '%s | InnerGrow.ai',
    },
    description: messages['home.description'] || 'AI-powered personal growth assistant',
    keywords: (messages['home.keywords'] || 'personal growth,AI assistant,goal management').split(','),
    openGraph: {
      title: messages['home.title'] || 'InnerGrow.ai',
      description: messages['home.description'] || 'AI-powered personal growth assistant',
      type: 'website',
      locale: language === 'zh' ? 'zh_CN' : 'en_US',
      siteName: 'InnerGrow.ai',
    },
    twitter: {
      card: 'summary_large_image',
      title: messages['home.title'] || 'InnerGrow.ai',
      description: messages['home.description'] || 'AI-powered personal growth assistant',
    },
    alternates: {
      languages: {
        'en': '/en',
        'zh': '/zh',
      },
    },
  };
}