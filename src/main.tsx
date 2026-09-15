import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import SettingsProvider from './providers/SettingsContextProvider'
import AuthContextProvider from './providers/AuthContextProvider'
import ToastContextProvider from './providers/ToastContextProvider'

const queryClient = new QueryClient()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found')
}

createRoot(container).render(
  <React.StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <ToastContextProvider>
              <App />
            </ToastContextProvider>
          </AuthContextProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </SettingsProvider>
  </React.StrictMode>
)
