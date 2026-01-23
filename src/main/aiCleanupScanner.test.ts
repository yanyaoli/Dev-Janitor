/**
 * AI Cleanup Scanner Tests
 *
 * Validates AI junk detection heuristics and scan coverage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import aiCleanupScanner from './aiCleanupScanner'

const STALE_DAYS = 9
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000

describe('aiCleanupScanner', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-janitor-ai-cleanup-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('detects stale AI temp files by name in code projects', async () => {
    const markerPath = path.join(tempDir, 'package.json')
    await fs.writeFile(markerPath, '{}')

    const filePath = path.join(tempDir, 'cursor-cache.json')
    await fs.writeFile(filePath, 'junk')
    const staleTime = new Date(Date.now() - STALE_MS)
    await fs.utimes(filePath, staleTime, staleTime)

    const result = await aiCleanupScanner.scanPath(tempDir)
    const names = result.files.map(file => file.name)
    expect(names).toContain('cursor-cache.json')
  })

  it('detects stale temp files inside AI tool directories', async () => {
    const aiDir = path.join(tempDir, '.cursor')
    await fs.mkdir(aiDir)

    const filePath = path.join(aiDir, 'cache.tmp')
    await fs.writeFile(filePath, '')
    const staleTime = new Date(Date.now() - STALE_MS)
    await fs.utimes(filePath, staleTime, staleTime)

    const result = await aiCleanupScanner.scanPath(tempDir)
    const names = result.files.map(file => file.name)
    expect(names).toContain('cache.tmp')
  })

  it('skips safe extensions when not AI temp candidates', async () => {
    const filePath = path.join(tempDir, 'notes.txt')
    await fs.writeFile(filePath, 'hello')

    const result = await aiCleanupScanner.scanPath(tempDir)
    const names = result.files.map(file => file.name)
    expect(names).not.toContain('notes.txt')
  })

  it('detects empty no-extension files with short or unusual names', async () => {
    const markerPath = path.join(tempDir, 'package.json')
    await fs.writeFile(markerPath, '{}')

    const shortNamePath = path.join(tempDir, 'w')
    const unusualNamePath = path.join(tempDir, "V'oR+")
    await fs.writeFile(shortNamePath, '')
    await fs.writeFile(unusualNamePath, '')

    const result = await aiCleanupScanner.scanPath(tempDir)
    const names = result.files.map(file => file.name)
    expect(names).toContain('w')
    expect(names).toContain("V'oR+")
  })
})
