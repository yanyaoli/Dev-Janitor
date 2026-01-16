/**
 * i18next Configuration for Dev Tools Manager
 * 
 * Provides internationalization support with:
 * - Chinese (Simplified) and English languages
 * - System language detection
 * - Language persistence
 * - Dynamic language switching
 * 
 * Validates: Requirements 13.1-13.8
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_LANGUAGES = ['en-US', 'zh-CN'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'zh-CN': '中文',
}

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en-US'
export const STORAGE_KEY = 'dev-tools-manager-language'

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detect system language and map to supported language
 * Validates: Requirements 13.6
 */
export function detectSystemLanguage(): SupportedLanguage {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage
    
    if (browserLang) {
      // Check for Chinese variants (zh, zh-CN, zh-TW, zh-Hans, zh-Hant)
      if (browserLang.startsWith('zh')) {
        return 'zh-CN'
      }
      
      // Check for English variants
      if (browserLang.startsWith('en')) {
        return 'en-US'
      }
    }
  }
  
  return DEFAULT_LANGUAGE
}

/**
 * Get persisted language from localStorage
 * Validates: Requirements 13.5
 */
export function getPersistedLanguage(): SupportedLanguage | null {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage
    }
  }
  return null
}

/**
 * Persist language to localStorage
 * Validates: Requirements 13.5
 */
export function persistLanguage(lang: SupportedLanguage): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang)
  }
}

/**
 * Get the initial language (persisted > system > default)
 * Validates: Requirements 13.5, 13.6
 */
export function getInitialLanguage(): SupportedLanguage {
  // First, check for persisted preference
  const persisted = getPersistedLanguage()
  if (persisted) {
    return persisted
  }
  
  // Fall back to system language detection
  return detectSystemLanguage()
}

// ============================================================================
// i18next Initialization
// ============================================================================

/**
 * Custom language detector that uses our logic
 */
const customLanguageDetector = {
  type: 'languageDetector' as const,
  async: false,
  detect: (): string => {
    return getInitialLanguage()
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    if (SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)) {
      persistLanguage(lng as SupportedLanguage)
    }
  },
}

i18n
  // Use custom language detector
  .use(customLanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      'en-US': {
        translation: enUS,
      },
      'zh-CN': {
        translation: zhCN,
      },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React settings
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
  })

// ============================================================================
// Language Change Handler
// ============================================================================

/**
 * Change language and persist the preference
 * Validates: Requirements 13.4, 13.5
 */
export function changeLanguage(lang: SupportedLanguage): Promise<void> {
  return new Promise((resolve, reject) => {
    i18n.changeLanguage(lang, (err) => {
      if (err) {
        reject(err)
      } else {
        persistLanguage(lang)
        resolve()
      }
    })
  })
}

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  const current = i18n.language
  if (SUPPORTED_LANGUAGES.includes(current as SupportedLanguage)) {
    return current as SupportedLanguage
  }
  return DEFAULT_LANGUAGE
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}

// ============================================================================
// Translation Helpers
// ============================================================================

/**
 * Get translation for a key
 * This is a convenience wrapper around i18n.t
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options)
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string): boolean {
  return i18n.exists(key)
}

// ============================================================================
// Export
// ============================================================================

export default i18n
