/**
 * i18next Configuration for MissionImpossible
 *
 * Complete multi-language support with:
 * - English and Urdu translations
 * - RTL (Right-to-Left) layout support
 * - Automatic language detection
 * - Persistent language preference
 * - Date/time formatting for Urdu calendar
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations directly for better bundle size
import enTranslations from '../../public/locales/en/translation.json'
import urTranslations from '../../public/locales/ur/translation.json'

// Supported languages configuration
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', font: 'Inter' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', font: 'Noto Sans Urdu' },
] as const

export type LanguageCode = typeof supportedLanguages[number]['code']

// Language resources
const resources = {
  en: { translation: enTranslations },
  ur: { translation: urTranslations },
}

// Default language
const DEFAULT_LANGUAGE: LanguageCode = 'en'

// Fallback language
const FALLBACK_LANGUAGE: LanguageCode = 'en'

/**
 * Get the text direction for a given language code
 */
export function getLanguageDirection(lang: LanguageCode): 'ltr' | 'rtl' {
  const language = supportedLanguages.find(l => l.code === lang)
  return language?.dir || 'ltr'
}

/**
 * Get the font family for a given language code
 */
export function getLanguageFont(lang: LanguageCode): string {
  const language = supportedLanguages.find(l => l.code === lang)
  if (lang === 'ur') {
    return '"Noto Sans Urdu", "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", sans-serif'
  }
  return 'var(--font-inter)'
}

/**
 * Apply RTL direction to document and body
 */
export function applyDirection(lang: LanguageCode): void {
  const direction = getLanguageDirection(lang)
  const html = document.documentElement
  const body = document.body

  // Update html dir attribute
  html.dir = direction
  html.lang = lang

  // Update body class for RTL styling
  if (direction === 'rtl') {
    body.classList.add('rtl')
    body.classList.remove('ltr')
  } else {
    body.classList.add('ltr')
    body.classList.remove('rtl')
  }

  // Store language preference
  localStorage.setItem('i18nextLng', lang)
}

/**
 * Format date according to language preference
 */
export function formatDate(date: Date | string, lang: LanguageCode = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (lang === 'ur') {
    // Urdu date format using Intl API
    return new Intl.DateTimeFormat('ur-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory',
    }).format(d)
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format relative time according to language
 */
export function formatRelativeTime(
  value: number,
  unit: 'day' | 'hour' | 'minute',
  lang: LanguageCode = 'en'
): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })

  switch (unit) {
    case 'day':
      return rtf.format(value, 'day')
    case 'hour':
      return rtf.format(value, 'hour')
    case 'minute':
      return rtf.format(value, 'minute')
    default:
      return rtf.format(value, 'day')
  }
}

/**
 * Get stored language preference
 */
export function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  const stored = localStorage.getItem('i18nextLng')
  if (stored && supportedLanguages.some(l => l.code === stored)) {
    return stored as LanguageCode
  }

  return DEFAULT_LANGUAGE
}

/**
 * Initialize i18next with all configurations
 */
function initializeI18n() {
  // Create language detector options
  const languageDetectorOptions = {
    // Order of language detection (from most to least priority)
    order: ['localStorage', 'navigator', 'htmlTag', 'subdomain'],

    // Cache the language in localStorage
    caches: ['localStorage'],

    // Keys to lookup in localStorage
    lookupLocalStorage: 'i18nextLng',

    // Fallback to English if detection fails
    fallbackLng: FALLBACK_LANGUAGE,

    // Exclude certain languages from detection
    excludeCacheFor: ['cimode'],
  }

  // Initialize i18next
  i18n
    // Add language detector plugin
    .use(LanguageDetector)
    // Add react-i18next hook
    .use(initReactI18next)
    // Initialize configuration
    .init({
      resources,
      lng: getStoredLanguage(),
      fallbackLng: FALLBACK_LANGUAGE,

      // Supported languages
      supportedLngs: supportedLanguages.map(l => l.code),

      // Detection configuration
      detection: languageDetectorOptions,

      // Interpolation configuration
      interpolation: {
        escapeValue: false, // React already escapes values
        format: (value, format, lng) => {
          // Custom formatting for dates
          if (format === 'date') {
            return formatDate(value, lng as LanguageCode)
          }
          // Custom formatting for relative time
          if (format === 'relative') {
            return formatRelativeTime(value as number, 'day', lng as LanguageCode)
          }
          return value
          },
      },

      // React configuration
      react: {
        useSuspense: true,
        bindI18n: 'languageChanged',
      },

      // Debug mode (disable in production)
      debug: process.env.NODE_ENV === 'development',

      // Missing key handling
      saveMissing: true,
      missingKeyHandler: (lng, _ns, key) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation: "${key}" (${lng})`)
        }
      },
    })

  // Apply initial direction
  if (typeof window !== 'undefined') {
    const currentLang = i18n.language as LanguageCode
    applyDirection(currentLang)

    // Listen for language changes and apply direction
    i18n.on('languageChanged', (lng: string) => {
      applyDirection(lng as LanguageCode)
    })
  }
}

// Initialize i18n
initializeI18n()

export default i18n
