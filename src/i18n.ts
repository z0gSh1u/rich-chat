import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import translationEN from './locales/en/translation.json'
import translationZH from './locales/zh/translation.json'

// the translations
const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
}

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: 'en', // Use English if detected language is not available
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development

    interpolation: {
      escapeValue: false, // React already safes from xss
    },

    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      // Cache user language in local storage
      caches: ['localStorage'],
    },
  })

export default i18n
