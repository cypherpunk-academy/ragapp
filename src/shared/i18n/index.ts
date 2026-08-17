import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'es', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DATE_LOCALES: Record<SupportedLanguage, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ru: 'ru-RU',
};

function resolveLanguage(): SupportedLanguage {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
    return code as SupportedLanguage;
  }
  return 'de';
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    de: { translation: de },
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    ru: { translation: ru },
  },
  lng: resolveLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

/** BCP 47 locale for `toLocaleDateString` / `toLocaleString` / etc. */
export function getDateLocale(): string {
  const lng = i18n.language?.split('-')[0] ?? 'de';
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lng)) {
    return DATE_LOCALES[lng as SupportedLanguage];
  }
  return DATE_LOCALES.de;
}

export default i18n;
