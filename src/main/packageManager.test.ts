/**
 * Tests for PackageManager Module
 * 
 * Feature: dev-tools-manager
 * Tests Properties 5 and 6 from the design document
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import {
  parseNpmOutput,
  parsePipOutput,
  parseComposerOutput,
  listNpmPackages,
  listPipPackages,
  listComposerPackages,
  isPackageManagerAvailable,
  PackageManager,
} from './packageManager'
import * as commandExecutor from './commandExecutor'

vi.mock('./commandExecutor')

const mockExecuteSafe = vi.mocked(commandExecutor.executeSafe)
const npmListOutput = JSON.stringify({
  dependencies: {
    typescript: { version: '5.0.0' },
    eslint: { version: '8.40.0' }
  }
})
const pipListOutput = JSON.stringify([
  { name: 'requests', version: '2.31.0' },
  { name: 'numpy', version: '1.24.0' }
])
const composerListOutput = JSON.stringify([
  { name: 'vendor/package1', version: '1.0.0', description: 'A package' }
])

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(commandExecutor.isWindows).mockReturnValue(false)
  mockExecuteSafe.mockImplementation(async (command: string) => {
    const trimmed = command.trim()

    if (trimmed === 'npm --version') {
      return { success: true, stdout: '9.0.0', stderr: '', exitCode: 0 }
    }

    if (trimmed === 'npm list -g --depth=0 --json') {
      return { success: true, stdout: npmListOutput, stderr: '', exitCode: 0 }
    }

    if (trimmed === 'pip3 --version' || trimmed === 'pip --version' || trimmed === 'py -m pip --version') {
      return { success: true, stdout: 'pip 23.0', stderr: '', exitCode: 0 }
    }

    if (trimmed === 'pip3 list --format=json' || trimmed === 'pip list --format=json' || trimmed === 'py -m pip list --format=json') {
      return { success: true, stdout: pipListOutput, stderr: '', exitCode: 0 }
    }

    if (trimmed === 'composer --version') {
      return { success: true, stdout: 'Composer version 2.0.0', stderr: '', exitCode: 0 }
    }

    if (trimmed === 'composer global show --format=json') {
      return { success: true, stdout: composerListOutput, stderr: '', exitCode: 0 }
    }

    if (trimmed === 'composer global show') {
      return { success: true, stdout: 'vendor/package1 v1.0.0 A package', stderr: '', exitCode: 0 }
    }

    return { success: false, stdout: '', stderr: 'Command failed', exitCode: 1 }
  })
})

describe('PackageManager', () => {
  describe('parseNpmOutput', () => {
    /**
     * Feature: dev-tools-manager, Property 6: Package List Parsing
     * **Validates: Requirements 3.1**
     * 
     * For any valid JSON output from package managers (npm list),
     * the parser should extract all packages without data loss.
     */
    it('should parse valid npm JSON output', () => {
      const npmOutput = JSON.stringify({
        dependencies: {
          'typescript': { version: '5.0.0' },
          'eslint': { version: '8.40.0' },
        }
      })
      
      const packages = parseNpmOutput(npmOutput)
      
      expect(packages.length).toBe(2)
      expect(packages.find(p => p.name === 'typescript')).toBeDefined()
      expect(packages.find(p => p.name === 'eslint')).toBeDefined()
    })

    it('should handle empty dependencies', () => {
      const npmOutput = JSON.stringify({ dependencies: {} })
      const packages = parseNpmOutput(npmOutput)
      expect(packages).toEqual([])
    })

    it('should handle missing dependencies key', () => {
      const npmOutput = JSON.stringify({})
      const packages = parseNpmOutput(npmOutput)
      expect(packages).toEqual([])
    })

    it('should handle invalid JSON gracefully', () => {
      const packages = parseNpmOutput('not valid json')
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should handle empty input', () => {
      expect(parseNpmOutput('')).toEqual([])
      expect(parseNpmOutput(null as unknown as string)).toEqual([])
    })

    it('should parse text format output (fallback)', () => {
      const textOutput = `
/usr/local/lib
├── typescript@5.0.0
├── eslint@8.40.0
└── prettier@3.0.0
`
      const packages = parseNpmOutput(textOutput)
      expect(packages.length).toBe(3)
    })

    // Property-based test: parsed packages should have required fields
    it('Property 6: all parsed packages should have name and version', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[@\w/-]+$/.test(s)),
              version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[\d.]+$/.test(s)),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (packageList) => {
            const dependencies: Record<string, { version: string }> = {}
            for (const pkg of packageList) {
              dependencies[pkg.name] = { version: pkg.version }
            }
            
            const npmOutput = JSON.stringify({ dependencies })
            const parsed = parseNpmOutput(npmOutput)
            
            // All parsed packages should have name and version
            return parsed.every(p => 
              typeof p.name === 'string' && 
              p.name.length > 0 &&
              typeof p.version === 'string' &&
              p.version.length > 0
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Property-based test: no data loss during parsing
    it('Property 6: should not lose packages during parsing', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z][\w-]*$/.test(s)),
              version: fc.tuple(
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 })
              ).map(([a, b, c]) => `${a}.${b}.${c}`),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (packageList) => {
            // Create unique package names
            const uniquePackages = packageList.filter((pkg, idx, arr) => 
              arr.findIndex(p => p.name === pkg.name) === idx
            )
            
            const dependencies: Record<string, { version: string }> = {}
            for (const pkg of uniquePackages) {
              dependencies[pkg.name] = { version: pkg.version }
            }
            
            const npmOutput = JSON.stringify({ dependencies })
            const parsed = parseNpmOutput(npmOutput)
            
            // Should have same number of packages
            return parsed.length === uniquePackages.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('parsePipOutput', () => {
    /**
     * Feature: dev-tools-manager, Property 6: Package List Parsing
     * **Validates: Requirements 4.1**
     * 
     * For any valid JSON output from package managers (pip list),
     * the parser should extract all packages without data loss.
     */
    it('should parse valid pip JSON output', () => {
      const pipOutput = JSON.stringify([
        { name: 'requests', version: '2.31.0' },
        { name: 'numpy', version: '1.24.0' },
      ])
      
      const packages = parsePipOutput(pipOutput)
      
      expect(packages.length).toBe(2)
      expect(packages.find(p => p.name === 'requests')).toBeDefined()
      expect(packages.find(p => p.name === 'numpy')).toBeDefined()
    })

    it('should handle empty array', () => {
      const pipOutput = JSON.stringify([])
      const packages = parsePipOutput(pipOutput)
      expect(packages).toEqual([])
    })

    it('should handle invalid JSON gracefully', () => {
      const packages = parsePipOutput('not valid json')
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should handle empty input', () => {
      expect(parsePipOutput('')).toEqual([])
      expect(parsePipOutput(null as unknown as string)).toEqual([])
    })

    it('should parse text format output (fallback)', () => {
      const textOutput = `
Package    Version
---------- -------
requests   2.31.0
numpy      1.24.0
pandas     2.0.0
`
      const packages = parsePipOutput(textOutput)
      expect(packages.length).toBe(3)
    })

    // Property-based test: parsed packages should have required fields
    it('Property 6: all parsed pip packages should have name and version', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[\w-]+$/.test(s)),
              version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[\d.]+$/.test(s)),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (packageList) => {
            const pipOutput = JSON.stringify(packageList)
            const parsed = parsePipOutput(pipOutput)
            
            return parsed.every(p => 
              typeof p.name === 'string' && 
              p.name.length > 0 &&
              typeof p.version === 'string' &&
              p.version.length > 0
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Property-based test: no data loss during parsing
    it('Property 6: should not lose pip packages during parsing', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z][\w-]*$/.test(s)),
              version: fc.tuple(
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 })
              ).map(([a, b, c]) => `${a}.${b}.${c}`),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (packageList) => {
            const pipOutput = JSON.stringify(packageList)
            const parsed = parsePipOutput(pipOutput)
            
            return parsed.length === packageList.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('parseComposerOutput', () => {
    /**
     * Feature: dev-tools-manager, Property 6: Package List Parsing
     */
    it('should parse valid composer JSON output', () => {
      const composerOutput = JSON.stringify([
        { name: 'vendor/package1', version: '1.0.0', description: 'A package' },
        { name: 'vendor/package2', version: '2.0.0' },
      ])
      
      const packages = parseComposerOutput(composerOutput)
      
      expect(packages.length).toBe(2)
      expect(packages.find(p => p.name === 'vendor/package1')).toBeDefined()
    })

    it('should handle installed key format', () => {
      const composerOutput = JSON.stringify({
        installed: [
          { name: 'vendor/package1', version: '1.0.0' },
        ]
      })
      
      const packages = parseComposerOutput(composerOutput)
      expect(packages.length).toBe(1)
    })

    it('should handle empty input', () => {
      expect(parseComposerOutput('')).toEqual([])
      expect(parseComposerOutput(null as unknown as string)).toEqual([])
    })

    it('should parse text format output (fallback)', () => {
      const textOutput = `
vendor/package1 v1.0.0 A description
vendor/package2 v2.0.0 Another description
`
      const packages = parseComposerOutput(textOutput)
      expect(packages.length).toBe(2)
    })
  })

  describe('Package Information Completeness', () => {
    /**
     * Feature: dev-tools-manager, Property 5: Package Information Completeness
     * **Validates: Requirements 3.2, 4.2**
     * 
     * For any package detected by npm or pip, the package information
     * should include both package name and version.
     */
    it('Property 5: npm packages should have name and version', () => {
      const npmOutput = JSON.stringify({
        dependencies: {
          'typescript': { version: '5.0.0' },
          'eslint': { version: '8.40.0' },
        }
      })
      
      const packages = parseNpmOutput(npmOutput)
      
      for (const pkg of packages) {
        expect(pkg.name).toBeDefined()
        expect(pkg.name.length).toBeGreaterThan(0)
        expect(pkg.version).toBeDefined()
        expect(pkg.version.length).toBeGreaterThan(0)
        expect(pkg.manager).toBe('npm')
      }
    })

    it('Property 5: pip packages should have name and version', () => {
      const pipOutput = JSON.stringify([
        { name: 'requests', version: '2.31.0' },
        { name: 'numpy', version: '1.24.0' },
      ])
      
      const packages = parsePipOutput(pipOutput)
      
      for (const pkg of packages) {
        expect(pkg.name).toBeDefined()
        expect(pkg.name.length).toBeGreaterThan(0)
        expect(pkg.version).toBeDefined()
        expect(pkg.version.length).toBeGreaterThan(0)
        expect(pkg.manager).toBe('pip')
      }
    })

    // Property-based test for completeness
    it('Property 5: all packages should have complete information', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-z][\w-]*$/.test(s)),
              version: fc.tuple(
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 0, max: 99 })
              ).map(([a, b, c]) => `${a}.${b}.${c}`),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (packageList) => {
            // Test npm format
            const npmDeps: Record<string, { version: string }> = {}
            for (const pkg of packageList) {
              npmDeps[pkg.name] = { version: pkg.version }
            }
            const npmParsed = parseNpmOutput(JSON.stringify({ dependencies: npmDeps }))
            
            // Test pip format
            const pipParsed = parsePipOutput(JSON.stringify(packageList))
            
            // All packages should have name, version, location, and manager
            const npmComplete = npmParsed.every(p => 
              p.name && p.version && p.location && p.manager === 'npm'
            )
            const pipComplete = pipParsed.every(p => 
              p.name && p.version && p.location && p.manager === 'pip'
            )
            
            return npmComplete && pipComplete
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('listNpmPackages', () => {
    it('should return an array of packages', async () => {
      const packages = await listNpmPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should have valid structure for each package', async () => {
      const packages = await listNpmPackages()
      
      for (const pkg of packages) {
        expect(pkg).toHaveProperty('name')
        expect(pkg).toHaveProperty('version')
        expect(pkg).toHaveProperty('location')
        expect(pkg).toHaveProperty('manager')
        expect(pkg.manager).toBe('npm')
      }
    })
  })

  describe('listPipPackages', () => {
    it('should return an array of packages', async () => {
      const packages = await listPipPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should have valid structure for each package', async () => {
      const packages = await listPipPackages()
      
      for (const pkg of packages) {
        expect(pkg).toHaveProperty('name')
        expect(pkg).toHaveProperty('version')
        expect(pkg).toHaveProperty('location')
        expect(pkg).toHaveProperty('manager')
        expect(pkg.manager).toBe('pip')
      }
    })
  })

  describe('listComposerPackages', () => {
    it('should return an array of packages', async () => {
      const packages = await listComposerPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should have valid structure for each package', async () => {
      const packages = await listComposerPackages()
      
      for (const pkg of packages) {
        expect(pkg).toHaveProperty('name')
        expect(pkg).toHaveProperty('version')
        expect(pkg).toHaveProperty('location')
        expect(pkg).toHaveProperty('manager')
        expect(pkg.manager).toBe('composer')
      }
    })
  })

  describe('isPackageManagerAvailable', () => {
    it('should return boolean for npm', async () => {
      const available = await isPackageManagerAvailable('npm')
      expect(typeof available).toBe('boolean')
    })

    it('should return boolean for pip', async () => {
      const available = await isPackageManagerAvailable('pip')
      expect(typeof available).toBe('boolean')
    })

    it('should return boolean for composer', async () => {
      const available = await isPackageManagerAvailable('composer')
      expect(typeof available).toBe('boolean')
    })
  })

  describe('PackageManager class', () => {
    let pm: PackageManager

    beforeEach(() => {
      pm = new PackageManager()
    })

    it('should list npm packages', async () => {
      const packages = await pm.listNpmPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should list pip packages', async () => {
      const packages = await pm.listPipPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should list composer packages', async () => {
      const packages = await pm.listComposerPackages()
      expect(Array.isArray(packages)).toBe(true)
    })

    it('should check package manager availability', async () => {
      const npmAvailable = await pm.isPackageManagerAvailable('npm')
      expect(typeof npmAvailable).toBe('boolean')
    })

    it('should parse npm output', () => {
      const output = JSON.stringify({ dependencies: { test: { version: '1.0.0' } } })
      const packages = pm.parseNpmOutput(output)
      expect(packages.length).toBe(1)
    })

    it('should parse pip output', () => {
      const output = JSON.stringify([{ name: 'test', version: '1.0.0' }])
      const packages = pm.parsePipOutput(output)
      expect(packages.length).toBe(1)
    })

    it('should parse composer output', () => {
      const output = JSON.stringify([{ name: 'vendor/test', version: '1.0.0' }])
      const packages = pm.parseComposerOutput(output)
      expect(packages.length).toBe(1)
    })
  })
})
