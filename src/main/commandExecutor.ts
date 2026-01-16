/**
 * Command Executor Module
 * 
 * Provides a unified interface for executing system commands with:
 * - Timeout handling
 * - Platform detection
 * - Error handling
 * 
 * Validates: Requirements 12.4, 12.5, 12.6
 */

import { exec, ExecOptions } from 'child_process'
import { promisify } from 'util'
import { CommandResult } from '../shared/types'

const execAsync = promisify(exec)

// Default timeout for command execution (5 seconds)
const DEFAULT_TIMEOUT = 5000

/**
 * Execution options for command executor
 */
export interface ExecutorOptions extends ExecOptions {
  timeout?: number
}

/**
 * Platform type enumeration
 */
export type Platform = 'win32' | 'darwin' | 'linux'

/**
 * Get the current platform
 * @returns The current platform identifier
 */
export function getPlatform(): Platform {
  return process.platform as Platform
}

/**
 * Check if the current platform is Windows
 * @returns true if running on Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32'
}

/**
 * Check if the current platform is macOS
 * @returns true if running on macOS
 */
export function isMacOS(): boolean {
  return process.platform === 'darwin'
}

/**
 * Check if the current platform is Linux
 * @returns true if running on Linux
 */
export function isLinux(): boolean {
  return process.platform === 'linux'
}

/**
 * Get the platform-specific command for finding executable paths
 * Windows uses 'where', Unix-like systems use 'which'
 * 
 * Property 21: Platform-Specific Command Selection
 * @param toolName The name of the tool to find
 * @returns The platform-specific command string
 */
export function getWhichCommand(toolName: string): string {
  if (isWindows()) {
    return `where ${toolName}`
  }
  return `which ${toolName}`
}

/**
 * Normalize file path according to platform conventions
 * 
 * Property 22: Platform-Specific Path Handling
 * @param path The path to normalize
 * @returns The normalized path
 */
export function normalizePath(path: string): string {
  if (!path) return path
  
  // Trim whitespace and newlines
  const trimmed = path.trim()
  
  if (isWindows()) {
    // Windows paths use backslashes
    return trimmed.replace(/\//g, '\\')
  } else {
    // Unix paths use forward slashes
    return trimmed.replace(/\\/g, '/')
  }
}

/**
 * Execute a command and return the result
 * 
 * @param command The command to execute
 * @param options Execution options including timeout
 * @returns Promise resolving to CommandResult
 */
export async function execute(
  command: string,
  options: ExecutorOptions = {}
): Promise<CommandResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      ...options,
      timeout,
      windowsHide: true, // Hide console window on Windows
      encoding: 'utf8', // Ensure string output
    })
    
    return {
      stdout: (stdout as string) || '',
      stderr: (stderr as string) || '',
      exitCode: 0,
      success: true,
    }
  } catch (error: unknown) {
    // Handle execution errors
    const execError = error as {
      stdout?: string
      stderr?: string
      code?: number | string
      killed?: boolean
      signal?: string
      message?: string
    }
    
    // Check if it was a timeout
    if (execError.killed && execError.signal === 'SIGTERM') {
      return {
        stdout: execError.stdout || '',
        stderr: `Command timed out after ${timeout}ms`,
        exitCode: -1,
        success: false,
      }
    }
    
    // Return error result
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || 'Unknown error',
      exitCode: typeof execError.code === 'number' ? execError.code : 1,
      success: false,
    }
  }
}

/**
 * Execute a command safely, catching all errors
 * This method never throws and always returns a CommandResult
 * 
 * Property 11: Partial Failure Resilience
 * @param command The command to execute
 * @returns Promise resolving to CommandResult
 */
export async function executeSafe(command: string): Promise<CommandResult> {
  try {
    return await execute(command)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      stdout: '',
      stderr: errorMessage,
      exitCode: 1,
      success: false,
    }
  }
}

/**
 * Get the path of an executable tool
 * Uses 'which' on Unix and 'where' on Windows
 * 
 * @param toolName The name of the tool to find
 * @returns Promise resolving to the tool path or null if not found
 */
export async function getToolPath(toolName: string): Promise<string | null> {
  const command = getWhichCommand(toolName)
  const result = await executeSafe(command)
  
  if (result.success && result.stdout) {
    // On Windows, 'where' may return multiple paths (one per line)
    // We take the first one
    const paths = result.stdout.split('\n').filter(p => p.trim())
    if (paths.length > 0) {
      return normalizePath(paths[0])
    }
  }
  
  return null
}

/**
 * Get all paths of an executable tool (for tools with multiple installations)
 * 
 * Property 13: Multiple Installation Locations
 * @param toolName The name of the tool to find
 * @returns Promise resolving to array of tool paths
 */
export async function getAllToolPaths(toolName: string): Promise<string[]> {
  const command = getWhichCommand(toolName)
  const result = await executeSafe(command)
  
  if (result.success && result.stdout) {
    return result.stdout
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(normalizePath)
  }
  
  return []
}

/**
 * CommandExecutor class providing an object-oriented interface
 */
export class CommandExecutor {
  private defaultTimeout: number
  
  constructor(defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.defaultTimeout = defaultTimeout
  }
  
  /**
   * Execute a command
   */
  async execute(command: string, options?: ExecutorOptions): Promise<CommandResult> {
    return execute(command, {
      timeout: this.defaultTimeout,
      ...options,
    })
  }
  
  /**
   * Execute a command safely (never throws)
   */
  async executeSafe(command: string): Promise<CommandResult> {
    return executeSafe(command)
  }
  
  /**
   * Get platform-specific command for finding tools
   */
  getPlatformCommand(command: string): string {
    return getWhichCommand(command)
  }
  
  /**
   * Get the path of a tool
   */
  async getToolPath(toolName: string): Promise<string | null> {
    return getToolPath(toolName)
  }
  
  /**
   * Get all paths of a tool
   */
  async getAllToolPaths(toolName: string): Promise<string[]> {
    return getAllToolPaths(toolName)
  }
  
  /**
   * Get current platform
   */
  getPlatform(): Platform {
    return getPlatform()
  }
  
  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    return isWindows()
  }
}

// Export a default instance
export const commandExecutor = new CommandExecutor()
