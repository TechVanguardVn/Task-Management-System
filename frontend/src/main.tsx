import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { App, ConfigProvider } from 'antd'
import { store } from '@/store/store'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'
import AuthInitializer from '@/components/AuthInitializer/AuthInitializer'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AppRouter from './App'
import './index.css'
import { ConfirmModalProvider } from '@/shared/components/ConfirmModal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#6366f1',
              borderRadius: 8,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            },
          }}
        >
          <App>
            <ErrorBoundary>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <AuthInitializer>
                  <ConfirmModalProvider>
                    <AppRouter />
                  </ConfirmModalProvider>
                </AuthInitializer>
              </GoogleOAuthProvider>
            </ErrorBoundary>
          </App>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
)
