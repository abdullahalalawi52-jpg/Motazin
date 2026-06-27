import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import tr from './locales/tr.json';
import ur from './locales/ur.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';

export type Language = 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur' | 'ja' | 'zh' | 'ru' | 'pt';

const languagesData: Record<Language, Record<string, string>> = {
  ar, en, fr, es, tr, ur, ja, zh, ru, pt
};

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

// Dynamically build the translations lookup dictionary to maintain API backwards-compatibility
export const translations: Translations = {};

const allKeys = new Set<string>();
Object.values(languagesData).forEach((langDict) => {
  Object.keys(langDict).forEach((key) => allKeys.add(key));
});

allKeys.forEach((key) => {
  translations[key] = {
    ar: ar[key as keyof typeof ar] || en[key as keyof typeof en] || key,
    en: en[key as keyof typeof en] || key,
    fr: fr[key as keyof typeof fr] || en[key as keyof typeof en] || key,
    es: es[key as keyof typeof es] || en[key as keyof typeof en] || key,
    tr: tr[key as keyof typeof tr] || en[key as keyof typeof en] || key,
    ur: ur[key as keyof typeof ur] || en[key as keyof typeof en] || key,
    ja: ja[key as keyof typeof ja] || en[key as keyof typeof en] || key,
    zh: zh[key as keyof typeof zh] || en[key as keyof typeof en] || key,
    ru: ru[key as keyof typeof ru] || en[key as keyof typeof en] || key,
    pt: pt[key as keyof typeof pt] || en[key as keyof typeof en] || key,
  };
});

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    const isRtl = language === 'ar' || language === 'ur';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: (language === 'ar' || language === 'ur') ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
