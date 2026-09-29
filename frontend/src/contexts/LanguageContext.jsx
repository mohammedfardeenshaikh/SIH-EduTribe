import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('edutribe_language') || 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('edutribe_language', lang);
  };

  // Translation helper supporting nested keys e.g. t('nav.dashboard') or fallback
  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[language] || translations.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English if key missing in selected language
        let fallbackCurrent = translations.en;
        for (const fbKey of keys) {
          if (fallbackCurrent && fallbackCurrent[fbKey] !== undefined) {
            fallbackCurrent = fallbackCurrent[fbKey];
          } else {
            return fallback || path;
          }
        }
        return fallbackCurrent || fallback || path;
      }
    }
    return current || fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (path, fallback) => fallback || path
    };
  }
  return context;
}
