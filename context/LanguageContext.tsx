import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LANGUAGE_KEY = '@altoke_language';

export type Language = 'es' | 'en' | 'pt' | 'fr';

export const LANGUAGES = [
  { code: 'es' as Language, name: 'Español', flag: '🇦🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
  { code: 'fr' as Language, name: 'Français', flag: '🇨🇦' },
];

type LanguageContextType = {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  languages: typeof LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && ['es', 'en', 'pt', 'fr'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as Language);
        i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setCurrentLanguage(lang);
      await i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value = useMemo(
    () => ({ currentLanguage, changeLanguage, languages: LANGUAGES }),
    [currentLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
