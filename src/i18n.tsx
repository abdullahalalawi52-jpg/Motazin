import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type enType from './locales/en.json';
import enSync from './locales/en.json';
import arSync from './locales/ar.json';

export type Language = 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur' | 'ja' | 'zh' | 'ru' | 'pt';
// The `(string & {})` trick preserves autocomplete for known keys while allowing dynamic string variables.
export type TranslationKey = keyof typeof enType | (string & {});

const importTranslations = async (lang: Language) => {
  switch (lang) {
    case 'ar': return (await import('./locales/ar.json')).default;
    case 'en': return (await import('./locales/en.json')).default;
    case 'fr': return (await import('./locales/fr.json')).default;
    case 'es': return (await import('./locales/es.json')).default;
    case 'tr': return (await import('./locales/tr.json')).default;
    case 'ur': return (await import('./locales/ur.json')).default;
    case 'ja': return (await import('./locales/ja.json')).default;
    case 'zh': return (await import('./locales/zh.json')).default;
    case 'ru': return (await import('./locales/ru.json')).default;
    case 'pt': return (await import('./locales/pt.json')).default;
    default: return (await import('./locales/en.json')).default;
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });
  
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [enMessages, setEnMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      setLoading(true);
      if (import.meta.env.MODE === 'test') {
        setMessages(language === 'ar' ? arSync : enSync);
        if (language !== 'en') setEnMessages(enSync);
        setLoading(false);
        return;
      }
      try {
        const [langDict, enDict] = await Promise.all([
          importTranslations(language),
          language === 'en' ? Promise.resolve(null) : importTranslations('en')
        ]);
        setMessages(langDict);
        if (enDict) setEnMessages(enDict);
      } catch (e) {
        console.error('Failed to load language', e);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
    localStorage.setItem('language', language);
    const isRtl = language === 'ar' || language === 'ur';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKey): string => {
    if (messages[key]) return messages[key];
    if (enMessages[key]) return enMessages[key];
    return key as string;
  };

  if (loading) {
    return null; // or a loading spinner
  }

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
