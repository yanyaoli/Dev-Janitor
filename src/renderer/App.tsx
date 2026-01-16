/**
 * App Component
 * 
 * Root component for the Dev Tools Manager application.
 * Uses AppLayout to provide the main UI structure.
 * Wrapped with ErrorBoundary for global error handling.
 * 
 * Validates: Requirements 5.1, 5.6, 8.1, 8.2, 8.5
 */

import { ConfigProvider } from 'antd'
import { AppLayout, ErrorBoundary } from './components'
import './i18n'

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <AppLayout />
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
