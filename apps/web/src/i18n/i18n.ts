import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import sv from './locales/sv.json';
import en from './locales/en.json';

const LANG_STORAGE = 'huntledger.lang';
const LEGACY_LANG_STORAGE = 'huntledge.lang';
if (!localStorage.getItem(LANG_STORAGE) && localStorage.getItem(LEGACY_LANG_STORAGE)) {
  localStorage.setItem(LANG_STORAGE, localStorage.getItem(LEGACY_LANG_STORAGE)!);
  localStorage.removeItem(LEGACY_LANG_STORAGE);
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      sv: { translation: sv },
      en: { translation: en },
    },
    fallbackLng: 'sv',
    supportedLngs: ['sv', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANG_STORAGE,
    },
  });

export default i18n;
