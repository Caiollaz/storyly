import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { translations, Language, defaultLanguage, languages } from './translations';

// This creates a union of all possible translation keys from the English translations object.
type TranslationKey = keyof (typeof translations)['en'];

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    // Check if the saved language is a valid one before using it.
    return (languages.includes(savedLang as Language)) ? (savedLang as Language) : defaultLanguage;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key: TranslationKey): string => {
    // Fallback to the default language if a key is missing in the current language.
    return translations[language][key] || translations[defaultLanguage][key];
  }, [language]);

  const value = { language, setLanguage, t, languages };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslations = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  return context;
};
