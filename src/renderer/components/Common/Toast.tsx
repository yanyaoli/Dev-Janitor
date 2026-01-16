/**
 * Toast Notification Utility
 * 
 * Provides global toast notifications for success, error, warning, and info messages.
 * Uses Ant Design's message and notification APIs.
 * 
 * Validates: Requirements 8.2, 8.4
 * - 8.2: Display user-friendly error message
 * - 8.4: Provide actionable suggestions when possible
 */

import { message, notification } from 'antd'
import type { ArgsProps as NotificationArgsProps } from 'antd/es/notification'

// ============================================================================
// Types
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  duration?: number
  key?: string
  onClose?: () => void
}

interface NotificationOptions extends ToastOptions {
  description?: string
  btn?: React.ReactNode
  placement?: NotificationArgsProps['placement']
}

// Message config interface (simplified from antd)
interface MessageConfig {
  content: string
  duration?: number
  key?: string
  onClose?: () => void
}

// ============================================================================
// Toast Functions
// ============================================================================

/**
 * Show a simple toast message
 */
export function showToast(
  type: ToastType,
  content: string,
  options: ToastOptions = {}
): void {
  const { duration = 3, key, onClose } = options
  
  const config: MessageConfig = {
    content,
    duration,
    key,
    onClose,
  }

  switch (type) {
    case 'success':
      message.success(config)
      break
    case 'error':
      message.error(config)
      break
    case 'warning':
      message.warning(config)
      break
    case 'info':
      message.info(config)
      break
  }
}

/**
 * Show a success toast
 */
export function showSuccess(content: string, options?: ToastOptions): void {
  showToast('success', content, options)
}

/**
 * Show an error toast
 * Validates: Requirement 8.2
 */
export function showError(content: string, options?: ToastOptions): void {
  showToast('error', content, options)
}

/**
 * Show a warning toast
 */
export function showWarning(content: string, options?: ToastOptions): void {
  showToast('warning', content, options)
}

/**
 * Show an info toast
 */
export function showInfo(content: string, options?: ToastOptions): void {
  showToast('info', content, options)
}

/**
 * Show a loading toast (returns a function to dismiss)
 */
export function showLoading(content: string, key?: string): () => void {
  const messageKey = key || `loading-${Date.now()}`
  message.loading({ content, key: messageKey, duration: 0 })
  
  return () => {
    message.destroy(messageKey)
  }
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Show a notification with more details
 * Validates: Requirement 8.4 (actionable suggestions)
 */
export function showNotification(
  type: ToastType,
  title: string,
  options: NotificationOptions = {}
): void {
  const {
    description,
    duration = 4.5,
    key,
    onClose,
    btn,
    placement = 'topRight',
  } = options

  const config: NotificationArgsProps = {
    message: title,
    description,
    duration,
    key,
    onClose,
    btn,
    placement,
  }

  switch (type) {
    case 'success':
      notification.success(config)
      break
    case 'error':
      notification.error(config)
      break
    case 'warning':
      notification.warning(config)
      break
    case 'info':
      notification.info(config)
      break
  }
}

/**
 * Show an error notification with details
 * Validates: Requirements 8.2, 8.4
 */
export function showErrorNotification(
  title: string,
  description?: string,
  options?: Omit<NotificationOptions, 'description'>
): void {
  showNotification('error', title, { ...options, description })
}

/**
 * Show a success notification
 */
export function showSuccessNotification(
  title: string,
  description?: string,
  options?: Omit<NotificationOptions, 'description'>
): void {
  showNotification('success', title, { ...options, description })
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle and display errors with user-friendly messages
 * Validates: Requirements 8.2, 8.4
 */
export function handleError(
  error: Error | string,
  context?: string,
  showNotificationFlag = false
): void {
  const errorMessage = error instanceof Error ? error.message : error
  const title = context ? `${context}: ${errorMessage}` : errorMessage

  // Log the error
  console.error('[Error]', { context, error })

  if (showNotificationFlag) {
    showErrorNotification(
      context || 'Error',
      errorMessage,
      { duration: 6 }
    )
  } else {
    showError(title)
  }
}

/**
 * Handle command execution errors
 * Validates: Requirements 8.1, 8.2
 */
export function handleCommandError(
  command: string,
  error: Error | string,
  suggestion?: string
): void {
  const errorMessage = error instanceof Error ? error.message : error
  
  // Log with details - Validates: Requirement 8.1
  console.error('[Command Error]', {
    command,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  })

  // Show notification with suggestion - Validates: Requirements 8.2, 8.4
  showNotification('error', 'Command Failed', {
    description: suggestion
      ? `${errorMessage}\n\nSuggestion: ${suggestion}`
      : errorMessage,
    duration: 6,
  })
}

// ============================================================================
// Toast Context (for i18n support)
// ============================================================================

/**
 * Create toast functions with translation support
 */
export function createToastWithTranslation(t: (key: string, options?: Record<string, unknown>) => string) {
  return {
    success: (key: string, options?: Record<string, unknown>) => 
      showSuccess(t(key, options)),
    error: (key: string, options?: Record<string, unknown>) => 
      showError(t(key, options)),
    warning: (key: string, options?: Record<string, unknown>) => 
      showWarning(t(key, options)),
    info: (key: string, options?: Record<string, unknown>) => 
      showInfo(t(key, options)),
  }
}

// ============================================================================
// Export Default Object
// ============================================================================

export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  notification: showNotification,
  errorNotification: showErrorNotification,
  successNotification: showSuccessNotification,
  handleError,
  handleCommandError,
}

export default toast
