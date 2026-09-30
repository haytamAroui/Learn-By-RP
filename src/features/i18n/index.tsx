import React, { createContext, useContext } from 'react';
import { UiLanguage } from '../../types';
import { TRANSLATIONS, Translations } from './translations';

export { TRANSLATIONS };
export type { Translations };

export function getTranslations(lang: string = 'en'): Translations {
  const normalized = (lang || 'en').toLowerCase().slice(0, 2) as UiLanguage;
  if (normalized === 'fr') return TRANSLATIONS.fr;
  if (normalized === 'es') return TRANSLATIONS.es;
  if (normalized === 'nl') return TRANSLATIONS.nl;
  return TRANSLATIONS.en;
}

interface I18nContextValue {
  language: UiLanguage;
  t: Translations;
  setLanguage: (lang: UiLanguage) => void;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  t: TRANSLATIONS.en,
  setLanguage: () => {}
});

export const I18nProvider: React.FC<{
  language: UiLanguage;
  setLanguage: (lang: UiLanguage) => void;
  children: React.ReactNode;
}> = ({ language, setLanguage, children }) => {
  const currentTranslations = getTranslations(language);

  return (
    <I18nContext.Provider value={{ language, t: currentTranslations, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
