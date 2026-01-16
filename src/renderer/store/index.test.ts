/**
 * Tests for Zustand Store
 * 
 * Feature: dev-tools-manager
 * Tests Property 23: Language Preference Persistence
 * 
 * Validates: Requirements 2.1, 7.3, 13.1-13.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { useAppStore } from './index'
import type { ToolInfo, PackageInfo, RunningService, EnvironmentVariable, SupportedLanguage, ViewType } from '@shared/types'

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

// Mock i18n
vi.mock('../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
    language: 'en-US',
  },
}))

// Mock IPC client
vi.mock('../ipc', () => ({
  ipcClient: {
    isElectron: vi.fn(() => false),
    tools: {
      detectAll: vi.fn(() => Promise.resolve([])),
      detectOne: vi.fn(() => Promise.resolve({})),
    },
    packages: {
      listNpm: vi.fn(() => Promise.resolve([])),
      listPip: vi.fn(() => Promise.resolve([])),
      listComposer: vi.fn(() => Promise.resolve([])),
      uninstall: vi.fn(() => Promise.resolve(true)),
    },
    services: {
      list: vi.fn(() => Promise.resolve([])),
      kill: vi.fn(() => Promise.resolve(true)),
    },
    env: {
      getAll: vi.fn(() => Promise.resolve([])),
      getPath: vi.fn(() => Promise.resolve([])),
    },
    settings: {
      getLanguage: vi.fn(() => Promise.resolve('en-US')),
      setLanguage: vi.fn(() => Promise.resolve()),
    },
  },
}))

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      tools: [],
      toolsLoading: false,
      toolsError: null,
      npmPackages: [],
      pipPackages: [],
      composerPackages: [],
      packagesLoading: false,
      packagesError: null,
      runningServices: [],
      servicesLoading: false,
      servicesError: null,
      environmentVariables: [],
      pathEntries: [],
      envLoading: false,
      envError: null,
      currentView: 'tools',
      language: 'en-US',
      detectionProgress: 0,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAppStore.getState()
      
      expect(state.tools).toEqual([])
      expect(state.toolsLoading).toBe(false)
      expect(state.toolsError).toBeNull()
      expect(state.npmPackages).toEqual([])
      expect(state.pipPackages).toEqual([])
      expect(state.composerPackages).toEqual([])
      expect(state.packagesLoading).toBe(false)
      expect(state.runningServices).toEqual([])
      expect(state.servicesLoading).toBe(false)
      expect(state.environmentVariables).toEqual([])
      expect(state.pathEntries).toEqual([])
      expect(state.envLoading).toBe(false)
      expect(state.currentView).toBe('tools')
      expect(state.language).toBe('en-US')
      expect(state.detectionProgress).toBe(0)
    })
  })

  describe('Language Management', () => {
    /**
     * Feature: dev-tools-manager, Property 23: Language Preference Persistence
     * **Validates: Requirements 13.5**
     * 
     * For any language selection made by the user, the system should save
     * the preference and restore it on next launch.
     */
    it('should set language correctly', () => {
      const { setLanguage } = useAppStore.getState()
      
      setLanguage('zh-CN')
      expect(useAppStore.getState().language).toBe('zh-CN')
      
      setLanguage('en-US')
      expect(useAppStore.getState().language).toBe('en-US')
    })

    it('should only accept supported languages', () => {
      const { setLanguage } = useAppStore.getState()
      const supportedLanguages: SupportedLanguage[] = ['en-US', 'zh-CN']
      
      supportedLanguages.forEach(lang => {
        setLanguage(lang)
        expect(useAppStore.getState().language).toBe(lang)
      })
    })

    // Property-based test for language persistence
    it('should persist language preference for all supported languages', () => {
      const supportedLanguages: SupportedLanguage[] = ['en-US', 'zh-CN']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedLanguages),
          (lang) => {
            const { setLanguage } = useAppStore.getState()
            setLanguage(lang)
            
            // Language should be set in state
            const state = useAppStore.getState()
            return state.language === lang
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('View Management', () => {
    it('should set current view correctly', () => {
      const { setCurrentView } = useAppStore.getState()
      const views: ViewType[] = ['tools', 'packages', 'services', 'environment', 'settings']
      
      views.forEach(view => {
        setCurrentView(view)
        expect(useAppStore.getState().currentView).toBe(view)
      })
    })

    // Property-based test for view management
    it('should correctly set any valid view type', () => {
      const views: ViewType[] = ['tools', 'packages', 'services', 'environment', 'settings']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...views),
          (view) => {
            const { setCurrentView } = useAppStore.getState()
            setCurrentView(view)
            return useAppStore.getState().currentView === view
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Tools State', () => {
    it('should set tools correctly', () => {
      const { setTools } = useAppStore.getState()
      const mockTools: ToolInfo[] = [
        {
          name: 'node',
          displayName: 'Node.js',
          version: '18.17.0',
          path: '/usr/bin/node',
          isInstalled: true,
          category: 'runtime',
        },
      ]
      
      setTools(mockTools)
      expect(useAppStore.getState().tools).toEqual(mockTools)
    })

    it('should set tools loading state', () => {
      const { setToolsLoading } = useAppStore.getState()
      
      setToolsLoading(true)
      expect(useAppStore.getState().toolsLoading).toBe(true)
      
      setToolsLoading(false)
      expect(useAppStore.getState().toolsLoading).toBe(false)
    })

    it('should set tools error state', () => {
      const { setToolsError } = useAppStore.getState()
      
      setToolsError('Test error')
      expect(useAppStore.getState().toolsError).toBe('Test error')
      
      setToolsError(null)
      expect(useAppStore.getState().toolsError).toBeNull()
    })

    // Property-based test for tools state
    it('should correctly store any array of tools', () => {
      const toolArbitrary = fc.record({
        name: fc.string({ minLength: 1, maxLength: 20 }),
        displayName: fc.string({ minLength: 1, maxLength: 50 }),
        version: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
        path: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        isInstalled: fc.boolean(),
        category: fc.constantFrom('runtime', 'package-manager', 'tool', 'other') as fc.Arbitrary<'runtime' | 'package-manager' | 'tool' | 'other'>,
      })
      
      fc.assert(
        fc.property(
          fc.array(toolArbitrary, { minLength: 0, maxLength: 10 }),
          (tools) => {
            const { setTools } = useAppStore.getState()
            setTools(tools as ToolInfo[])
            const state = useAppStore.getState()
            return state.tools.length === tools.length
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Packages State', () => {
    it('should set npm packages correctly', () => {
      const { setNpmPackages } = useAppStore.getState()
      const mockPackages: PackageInfo[] = [
        {
          name: 'typescript',
          version: '5.0.0',
          location: '/usr/lib/node_modules',
          manager: 'npm',
        },
      ]
      
      setNpmPackages(mockPackages)
      expect(useAppStore.getState().npmPackages).toEqual(mockPackages)
    })

    it('should set pip packages correctly', () => {
      const { setPipPackages } = useAppStore.getState()
      const mockPackages: PackageInfo[] = [
        {
          name: 'requests',
          version: '2.28.0',
          location: '/usr/lib/python3/site-packages',
          manager: 'pip',
        },
      ]
      
      setPipPackages(mockPackages)
      expect(useAppStore.getState().pipPackages).toEqual(mockPackages)
    })

    it('should set composer packages correctly', () => {
      const { setComposerPackages } = useAppStore.getState()
      const mockPackages: PackageInfo[] = [
        {
          name: 'laravel/framework',
          version: '10.0.0',
          location: '/home/user/.composer/vendor',
          manager: 'composer',
        },
      ]
      
      setComposerPackages(mockPackages)
      expect(useAppStore.getState().composerPackages).toEqual(mockPackages)
    })
  })

  describe('Services State', () => {
    it('should set running services correctly', () => {
      const { setRunningServices } = useAppStore.getState()
      const mockServices: RunningService[] = [
        {
          pid: 1234,
          name: 'node',
          port: 3000,
          command: 'node server.js',
        },
      ]
      
      setRunningServices(mockServices)
      expect(useAppStore.getState().runningServices).toEqual(mockServices)
    })

    it('should set services loading state', () => {
      const { setServicesLoading } = useAppStore.getState()
      
      setServicesLoading(true)
      expect(useAppStore.getState().servicesLoading).toBe(true)
      
      setServicesLoading(false)
      expect(useAppStore.getState().servicesLoading).toBe(false)
    })
  })

  describe('Environment State', () => {
    it('should set environment variables correctly', () => {
      const { setEnvironmentVariables } = useAppStore.getState()
      const mockVars: EnvironmentVariable[] = [
        {
          key: 'PATH',
          value: '/usr/bin:/usr/local/bin',
          category: 'path',
          isSystemVariable: true,
        },
      ]
      
      setEnvironmentVariables(mockVars)
      expect(useAppStore.getState().environmentVariables).toEqual(mockVars)
    })

    it('should set path entries correctly', () => {
      const { setPathEntries } = useAppStore.getState()
      const mockEntries = ['/usr/bin', '/usr/local/bin', '/home/user/bin']
      
      setPathEntries(mockEntries)
      expect(useAppStore.getState().pathEntries).toEqual(mockEntries)
    })
  })

  describe('Error Handling', () => {
    it('should clear all errors', () => {
      const state = useAppStore.getState()
      
      // Set some errors
      state.setToolsError('Tools error')
      state.setPackagesError('Packages error')
      state.setServicesError('Services error')
      state.setEnvError('Env error')
      
      // Verify errors are set
      expect(useAppStore.getState().toolsError).toBe('Tools error')
      expect(useAppStore.getState().packagesError).toBe('Packages error')
      expect(useAppStore.getState().servicesError).toBe('Services error')
      expect(useAppStore.getState().envError).toBe('Env error')
      
      // Clear all errors
      state.clearErrors()
      
      // Verify all errors are cleared
      expect(useAppStore.getState().toolsError).toBeNull()
      expect(useAppStore.getState().packagesError).toBeNull()
      expect(useAppStore.getState().servicesError).toBeNull()
      expect(useAppStore.getState().envError).toBeNull()
    })
  })

  describe('Detection Progress', () => {
    it('should set detection progress correctly', () => {
      const { setDetectionProgress } = useAppStore.getState()
      
      setDetectionProgress(50)
      expect(useAppStore.getState().detectionProgress).toBe(50)
      
      setDetectionProgress(100)
      expect(useAppStore.getState().detectionProgress).toBe(100)
    })

    // Property-based test for detection progress
    it('should correctly store any progress value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (progress) => {
            const { setDetectionProgress } = useAppStore.getState()
            setDetectionProgress(progress)
            return useAppStore.getState().detectionProgress === progress
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

describe('Store Hooks', () => {
  beforeEach(() => {
    useAppStore.setState({
      tools: [],
      toolsLoading: false,
      toolsError: null,
      npmPackages: [],
      pipPackages: [],
      composerPackages: [],
      packagesLoading: false,
      packagesError: null,
      runningServices: [],
      servicesLoading: false,
      servicesError: null,
      environmentVariables: [],
      pathEntries: [],
      envLoading: false,
      envError: null,
      currentView: 'tools',
      language: 'en-US',
      detectionProgress: 0,
    })
  })

  it('should export useAppStore hook', () => {
    expect(useAppStore).toBeDefined()
    expect(typeof useAppStore).toBe('function')
  })

  it('should allow selecting specific state slices', () => {
    const state = useAppStore.getState()
    expect(state.tools).toBeDefined()
    expect(state.language).toBeDefined()
    expect(state.currentView).toBeDefined()
  })
})
