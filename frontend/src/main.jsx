import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query/client.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthProvider.jsx'
import { AppRoutes } from './routes/AppRoutes.jsx'
import { GlobalToaster } from './components/notifications/GlobalToaster.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppRoutes />
            <GlobalToaster />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
)
