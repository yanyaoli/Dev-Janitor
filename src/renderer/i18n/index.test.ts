/**
 * Tests for i18n Configuration
 * 
 * Feature: dev-tools-manager
 * Tests Property 24: I18n System Coverage
 * 
 * Validates: Requirements 13.1-13.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import i18n, {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
  detectSystemLanguage,
  getPersistedLanguage,
  persistLanguage,
  getInitialLanguage,
  changeLanguage,
  getCurrentLanguage,
  isLanguageSupported,
  t,
  hasTranslation,
} from './index'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('i18n Configuration', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constants', () => {
    it('should have correct supported languages', () => {
      expect(SUPPORTED_LANGUAGES).toContain('en-US')
      expect(SUPPORTED_LANGUAGES).toContain('zh-CN')
      expect(SUPPORTED_LANGUAGES.length).toBe(2)
    })

    it('should have language names for all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(LANGUAGE_NAMES[lang]).toBeDefined()
        expect(typeof LANGUAGE_NAMES[lang]).toBe('string')
      })
    })

    it('should have correct default language', () => {
      expect(DEFAULT_LANGUAGE).toBe('en-US')
    })

    it('should have correct storage key', () => {
      expect(STORAGE_KEY).toBe('dev-tools-manager-language')
    })
  })

  describe('Language Detection', () => {
    /**
     * Feature: dev-tools-manager, Property 24: I18n System Coverage
     * **Validates: Requirements 13.6**
     * 
     * The system should detect system language and use it as default on first launch.
     */
    it('should detect system language', () => {
      const lang = detectSystemLanguage()
      expect(SUPPORTED_LANGUAGES).toContain(lang)
    })

    it('should return supported language from detection', () => {
      const lang = detectSystemLanguage()
      expect(isLanguageSupported(lang)).toBe(true)
    })
  })

  describe('Language Persistence', () => {
    /**
     * Feature: dev-tools-manager, Property 23: Language Preference Persistence
     * **Validates: Requirements 13.5**
     */
    it('should persist language to localStorage', () => {
      persistLanguage('zh-CN')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'zh-CN')
    })

    it('should get persisted language from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('zh-CN')
      const lang = getPersistedLanguage()
      expect(lang).toBe('zh-CN')
    })

    it('should return null for invalid persisted language', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-lang')
      const lang = getPersistedLanguage()
      expect(lang).toBeNull()
    })

    it('should return null when no language is persisted', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      const lang = getPersistedLanguage()
      expect(lang).toBeNull()
    })

    // Property-based test for language persistence
    it('should persist and retrieve any supported language', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          (lang) => {
            persistLanguage(lang)
            // Verify setItem was called with correct arguments
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, lang)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Initial Language', () => {
    it('should return persisted language if available', () => {
      localStorageMock.getItem.mockReturnValueOnce('zh-CN')
      const lang = getInitialLanguage()
      expect(lang).toBe('zh-CN')
    })

    it('should fall back to system language if no persisted language', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      const lang = getInitialLanguage()
      expect(SUPPORTED_LANGUAGES).toContain(lang)
    })
  })

  describe('Language Support Check', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('en-US')).toBe(true)
      expect(isLanguageSupported('zh-CN')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('fr-FR')).toBe(false)
      expect(isLanguageSupported('de-DE')).toBe(false)
      expect(isLanguageSupported('invalid')).toBe(false)
    })

    // Property-based test for language support check
    it('should correctly identify supported vs unsupported languages', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (lang) => {
            const isSupported = isLanguageSupported(lang)
            if (SUPPORTED_LANGUAGES.includes(lang as typeof SUPPORTED_LANGUAGES[number])) {
              return isSupported === true
            }
            return isSupported === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Current Language', () => {
    it('should return current language', () => {
      const lang = getCurrentLanguage()
      expect(SUPPORTED_LANGUAGES).toContain(lang)
    })
  })

  describe('i18next Instance', () => {
    it('should be initialized', () => {
      expect(i18n.isInitialized).toBe(true)
    })

    it('should have correct fallback language', () => {
      expect(i18n.options.fallbackLng).toContain(DEFAULT_LANGUAGE)
    })

    it('should have resources for all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(i18n.hasResourceBundle(lang, 'translation')).toBe(true)
      })
    })
  })
})

describe('Translation Coverage', () => {
  /**
   * Feature: dev-tools-manager, Property 24: I18n System Coverage
   * **Validates: Requirements 13.7, 13.8**
   * 
   * For any user-facing text in the application, it should be loaded through
   * the i18n system with appropriate translation keys for both Chinese and English.
   */

  // Helper function to get all keys from a nested object
  function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = []
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey))
      } else {
        keys.push(fullKey)
      }
    }
    return keys
  }

  describe('Translation Key Parity', () => {
    it('should have same keys in both language files', () => {
      const enKeys = getAllKeys(enUS).sort()
      const zhKeys = getAllKeys(zhCN).sort()
      
      expect(enKeys).toEqual(zhKeys)
    })

    it('should have translations for all English keys in Chinese', () => {
      const enKeys = getAllKeys(enUS)
      
      enKeys.forEach(key => {
        expect(hasTranslation(key)).toBe(true)
      })
    })

    // Property-based test for translation key coverage
    it('should have translation for any key from English file', () => {
      const enKeys = getAllKeys(enUS)
      
      fc.assert(
        fc.property(
          fc.constantFrom(...enKeys),
          (key) => {
            return hasTranslation(key)
          }
        ),
        { numRuns: Math.min(enKeys.length, 100) }
      )
    })
  })

  describe('Required Translation Sections', () => {
    const requiredSections = [
      'app',
      'common',
      'nav',
      'header',
      'tools',
      'packages',
      'services',
      'environment',
      'settings',
      'errors',
      'notifications',
      'dialogs',
      'empty',
      'loading',
      'tooltips',
    ]

    it('should have all required sections in English', () => {
      requiredSections.forEach(section => {
        expect(enUS).toHaveProperty(section)
      })
    })

    it('should have all required sections in Chinese', () => {
      requiredSections.forEach(section => {
        expect(zhCN).toHaveProperty(section)
      })
    })
  })

  describe('Critical Translation Keys', () => {
    const criticalKeys = [
      'app.title',
      'common.refresh',
      'common.loading',
      'common.error',
      'common.success',
      'common.cancel',
      'common.confirm',
      'nav.tools',
      'nav.packages',
      'nav.services',
      'nav.environment',
      'nav.settings',
      'tools.title',
      'tools.installed',
      'tools.notInstalled',
      'packages.title',
      'packages.npm',
      'packages.pip',
      'services.title',
      'services.stop',
      'environment.title',
      'settings.title',
      'settings.language',
    ]

    it('should have all critical keys in English', () => {
      criticalKeys.forEach(key => {
        const value = t(key)
        expect(value).not.toBe(key) // Should not return the key itself
        expect(value.length).toBeGreaterThan(0)
      })
    })

    it('should have non-empty translations for critical keys', () => {
      criticalKeys.forEach(key => {
        // Check English
        i18n.changeLanguage('en-US')
        const enValue = t(key)
        expect(enValue).toBeTruthy()
        expect(enValue).not.toBe(key)
        
        // Check Chinese
        i18n.changeLanguage('zh-CN')
        const zhValue = t(key)
        expect(zhValue).toBeTruthy()
        expect(zhValue).not.toBe(key)
      })
    })

    // Property-based test for critical keys
    it('should have valid translations for all critical keys in both languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...criticalKeys),
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          (key, lang) => {
            i18n.changeLanguage(lang)
            const value = t(key)
            // Translation should exist and not be the key itself
            return value !== key && value.length > 0
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Translation Value Types', () => {
    it('should have string values for all translations', () => {
      const enKeys = getAllKeys(enUS)
      
      enKeys.forEach(key => {
        const value = t(key)
        expect(typeof value).toBe('string')
      })
    })

    it('should not have empty string translations', () => {
      const enKeys = getAllKeys(enUS)
      
      enKeys.forEach(key => {
        const enValue = t(key)
        expect(enValue.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Language Switching', () => {
    /**
     * Feature: dev-tools-manager, Property 24: I18n System Coverage
     * **Validates: Requirements 13.4**
     * 
     * When the language is changed, the system should update all UI text immediately.
     */
    it('should change language and update translations', async () => {
      // Start with English
      await changeLanguage('en-US')
      expect(t('app.title')).toBe('Dev Tools Manager')
      
      // Switch to Chinese
      await changeLanguage('zh-CN')
      expect(t('app.title')).toBe('开发工具管理器')
      
      // Switch back to English
      await changeLanguage('en-US')
      expect(t('app.title')).toBe('Dev Tools Manager')
    })

    it('should persist language after change', async () => {
      await changeLanguage('zh-CN')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'zh-CN')
    })

    // Property-based test for language switching
    it('should correctly switch between any supported languages', () => {
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...SUPPORTED_LANGUAGES),
          async (lang) => {
            await changeLanguage(lang)
            const currentLang = getCurrentLanguage()
            return currentLang === lang
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})

describe('Translation Interpolation', () => {
  it('should support interpolation in translations', () => {
    // Test with a key that uses interpolation
    i18n.changeLanguage('en-US')
    const result = t('packages.packageCount', { count: 5 })
    expect(result).toContain('5')
  })

  it('should handle missing interpolation values gracefully', () => {
    i18n.changeLanguage('en-US')
    // Should not throw even if interpolation value is missing
    const result = t('packages.packageCount')
    expect(typeof result).toBe('string')
  })
})
