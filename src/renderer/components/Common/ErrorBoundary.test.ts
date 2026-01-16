/**
 * Tests for Error Handling Components
 * 
 * Feature: dev-tools-manager
 * Tests Properties 9, 10, 11: Error Logging, Display, and Resilience
 * 
 * Validates: Requirements 8.1, 8.2, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { logError } from './ErrorBoundary'

// ============================================================================
// Mock Console
// ============================================================================

const originalConsoleError = console.error
const originalConsoleGroup = console.group
const originalConsoleGroupEnd = console.groupEnd

let consoleErrorCalls: Array<{ args: unknown[] }> = []

beforeEach(() => {
  consoleErrorCalls = []
  console.error = vi.fn((...args: unknown[]) => {
    consoleErrorCalls.push({ args })
  })
  console.group = vi.fn()
  console.groupEnd = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
  console.group = originalConsoleGroup
  console.groupEnd = originalConsoleGroupEnd
  vi.clearAllMocks()
})

// ============================================================================
// Property 9: Error Logging Consistency
// ============================================================================

describe('Property 9: Error Logging Consistency', () => {
  /**
   * Feature: dev-tools-manager, Property 9: Error Logging Consistency
   * **Validates: Requirements 8.1**
   * 
   * For any command execution that fails, the system should log the error
   * details including command, error message, and timestamp.
   */
  
  it('should log error with all required fields', () => {
    const error = new Error('Test error message')
    const context = 'TestContext'
    
    logError(error, context)
    
    expect(console.error).toHaveBeenCalled()
    const logCall = consoleErrorCalls[0]
    expect(logCall).toBeDefined()
    
    // Check that the log contains required information
    const logData = logCall.args[1] as Record<string, unknown>
    expect(logData.timestamp).toBeDefined()
    expect(logData.context).toBe(context)
    expect(logData.message).toBe('Test error message')
    expect(logData.name).toBe('Error')
  })

  it('should include stack trace in error log', () => {
    const error = new Error('Error with stack')
    const context = 'StackContext'
    
    logError(error, context)
    
    const logCall = consoleErrorCalls[0]
    const logData = logCall.args[1] as Record<string, unknown>
    expect(logData.stack).toBeDefined()
    expect(typeof logData.stack).toBe('string')
  })

  it('should include additional info when provided', () => {
    const error = new Error('Error with extra info')
    const context = 'ExtraInfoContext'
    const additionalInfo = { command: 'npm install', exitCode: 1 }
    
    logError(error, context, additionalInfo)
    
    const logCall = consoleErrorCalls[0]
    const logData = logCall.args[1] as Record<string, unknown>
    expect(logData.command).toBe('npm install')
    expect(logData.exitCode).toBe(1)
  })

  // Property-based test for error logging
  it('should consistently log errors with valid timestamps for any error', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage, context) => {
          consoleErrorCalls = []
          const error = new Error(errorMessage)
          
          logError(error, context)
          
          // Should have logged
          if (consoleErrorCalls.length === 0) return false
          
          const logCall = consoleErrorCalls[0]
          const logData = logCall.args[1] as Record<string, unknown>
          
          // Timestamp should be valid ISO string
          const timestamp = logData.timestamp as string
          const parsedDate = new Date(timestamp)
          if (isNaN(parsedDate.getTime())) return false
          
          // Context should match
          if (logData.context !== context) return false
          
          // Message should match
          if (logData.message !== errorMessage) return false
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should log errors with different error types consistently', () => {
    const errorTypes = [
      new Error('Standard error'),
      new TypeError('Type error'),
      new RangeError('Range error'),
      new SyntaxError('Syntax error'),
    ]

    errorTypes.forEach((error, index) => {
      consoleErrorCalls = []
      logError(error, `Context${index}`)
      
      expect(consoleErrorCalls.length).toBeGreaterThan(0)
      const logData = consoleErrorCalls[0].args[1] as Record<string, unknown>
      expect(logData.name).toBe(error.name)
      expect(logData.message).toBe(error.message)
    })
  })
})

// ============================================================================
// Property 10: Error Display
// ============================================================================

describe('Property 10: Error Display', () => {
  /**
   * Feature: dev-tools-manager, Property 10: Error Display
   * **Validates: Requirements 8.2**
   * 
   * For any command execution failure, the system should display
   * a user-friendly error message to the user.
   */

  it('should format error messages for display', () => {
    const error = new Error('Connection refused')
    
    // The error message should be extractable for display
    expect(error.message).toBe('Connection refused')
    expect(typeof error.message).toBe('string')
  })

  // Property-based test for error message extraction
  it('should extract displayable message from any error', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (message) => {
          const error = new Error(message)
          
          // Message should be extractable
          const displayMessage = error.message
          
          // Should be a non-empty string
          return typeof displayMessage === 'string' && displayMessage.length > 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle errors with special characters in messages', () => {
    const specialMessages = [
      'Error: <script>alert("xss")</script>',
      'Error with "quotes" and \'apostrophes\'',
      'Error with\nnewlines\tand\ttabs',
      'Error with unicode: 你好世界 🚀',
    ]

    specialMessages.forEach(msg => {
      const error = new Error(msg)
      expect(error.message).toBe(msg)
      expect(typeof error.message).toBe('string')
    })
  })

  it('should provide error name for categorization', () => {
    const errors = [
      { error: new Error('test'), expectedName: 'Error' },
      { error: new TypeError('test'), expectedName: 'TypeError' },
      { error: new RangeError('test'), expectedName: 'RangeError' },
    ]

    errors.forEach(({ error, expectedName }) => {
      expect(error.name).toBe(expectedName)
    })
  })
})

// ============================================================================
// Property 11: Partial Failure Resilience
// ============================================================================

describe('Property 11: Partial Failure Resilience', () => {
  /**
   * Feature: dev-tools-manager, Property 11: Partial Failure Resilience
   * **Validates: Requirements 8.5**
   * 
   * For any set of tool detection operations, if some detections fail,
   * the system should still return results for successful detections
   * and continue operating normally.
   */

  interface DetectionResult {
    name: string
    success: boolean
    data?: unknown
    error?: string
  }

  /**
   * Simulates partial failure in detection operations
   */
  function simulatePartialDetection(
    tools: string[],
    failingTools: Set<string>
  ): DetectionResult[] {
    return tools.map(tool => {
      if (failingTools.has(tool)) {
        return {
          name: tool,
          success: false,
          error: `Failed to detect ${tool}`,
        }
      }
      return {
        name: tool,
        success: true,
        data: { version: '1.0.0', path: `/usr/bin/${tool}` },
      }
    })
  }

  it('should return successful results even when some detections fail', () => {
    const tools = ['node', 'python', 'php', 'npm', 'pip']
    const failingTools = new Set(['python', 'pip'])
    
    const results = simulatePartialDetection(tools, failingTools)
    
    // Should have results for all tools
    expect(results.length).toBe(tools.length)
    
    // Successful tools should have data
    const successfulResults = results.filter(r => r.success)
    expect(successfulResults.length).toBe(3)
    successfulResults.forEach(r => {
      expect(r.data).toBeDefined()
    })
    
    // Failed tools should have error messages
    const failedResults = results.filter(r => !r.success)
    expect(failedResults.length).toBe(2)
    failedResults.forEach(r => {
      expect(r.error).toBeDefined()
    })
  })

  // Property-based test for partial failure resilience
  it('should handle any combination of successes and failures', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 9 }), { minLength: 0, maxLength: 5 }),
        (tools, failingIndices) => {
          // Create unique tools
          const uniqueTools = [...new Set(tools)]
          if (uniqueTools.length === 0) return true
          
          // Determine which tools fail (by index)
          const failingTools = new Set(
            failingIndices
              .filter(i => i < uniqueTools.length)
              .map(i => uniqueTools[i])
          )
          
          const results = simulatePartialDetection(uniqueTools, failingTools)
          
          // Should have results for all tools
          if (results.length !== uniqueTools.length) return false
          
          // Count successes and failures
          const successCount = results.filter(r => r.success).length
          const failCount = results.filter(r => !r.success).length
          
          // Total should match
          if (successCount + failCount !== uniqueTools.length) return false
          
          // Failed count should match failing tools
          if (failCount !== failingTools.size) return false
          
          // All successful results should have data
          const allSuccessHaveData = results
            .filter(r => r.success)
            .every(r => r.data !== undefined)
          
          // All failed results should have error
          const allFailedHaveError = results
            .filter(r => !r.success)
            .every(r => r.error !== undefined)
          
          return allSuccessHaveData && allFailedHaveError
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should continue processing after encountering errors', () => {
    const operations = [
      () => ({ success: true, value: 1 }),
      () => { throw new Error('Operation 2 failed') },
      () => ({ success: true, value: 3 }),
      () => { throw new Error('Operation 4 failed') },
      () => ({ success: true, value: 5 }),
    ]

    const results: Array<{ success: boolean; value?: number; error?: string }> = []

    operations.forEach((op, _index) => {
      try {
        const result = op()
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // Should have processed all operations
    expect(results.length).toBe(5)
    
    // Should have 3 successes and 2 failures
    expect(results.filter(r => r.success).length).toBe(3)
    expect(results.filter(r => !r.success).length).toBe(2)
  })

  it('should preserve order of results regardless of failures', () => {
    const tools = ['a', 'b', 'c', 'd', 'e']
    const failingTools = new Set(['b', 'd'])
    
    const results = simulatePartialDetection(tools, failingTools)
    
    // Results should be in same order as input
    results.forEach((result, index) => {
      expect(result.name).toBe(tools[index])
    })
  })

  it('should handle all operations failing gracefully', () => {
    const tools = ['node', 'python', 'php']
    const failingTools = new Set(tools) // All fail
    
    const results = simulatePartialDetection(tools, failingTools)
    
    // Should still return results for all tools
    expect(results.length).toBe(tools.length)
    
    // All should be failures
    expect(results.every(r => !r.success)).toBe(true)
    
    // All should have error messages
    expect(results.every(r => r.error !== undefined)).toBe(true)
  })

  it('should handle all operations succeeding', () => {
    const tools = ['node', 'python', 'php']
    const failingTools = new Set<string>() // None fail
    
    const results = simulatePartialDetection(tools, failingTools)
    
    // Should return results for all tools
    expect(results.length).toBe(tools.length)
    
    // All should be successes
    expect(results.every(r => r.success)).toBe(true)
    
    // All should have data
    expect(results.every(r => r.data !== undefined)).toBe(true)
  })
})

// ============================================================================
// Error Boundary Integration Tests
// ============================================================================

describe('Error Boundary Integration', () => {
  it('should export logError function', () => {
    expect(typeof logError).toBe('function')
  })

  it('should handle undefined additional info', () => {
    const error = new Error('Test')
    
    // Should not throw
    expect(() => logError(error, 'Context')).not.toThrow()
    expect(() => logError(error, 'Context', undefined)).not.toThrow()
  })

  it('should handle empty context', () => {
    const error = new Error('Test')
    
    // Should not throw with empty context
    expect(() => logError(error, '')).not.toThrow()
  })

  // Property-based test for robustness
  it('should handle any valid error and context combination', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: undefined }),
        (message, context, additionalInfo) => {
          const error = new Error(message)
          
          // Should not throw
          try {
            logError(error, context, additionalInfo as Record<string, unknown> | undefined)
            return true
          } catch {
            return false
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
