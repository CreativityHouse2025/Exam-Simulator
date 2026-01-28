import React from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { DEFAULT_THEME } from './constants'
import App from './App'
import SettingsProvider from './providers/SettingsContextProvider'

const GlobalStyle = createGlobalStyle`
  html {
    font-size: ${DEFAULT_THEME.fontSize}
  }
  body {
    padding: 0;
    margin: 0;
    direction: inherit;
  }
  ::-webkit-scrollbar {
    width: ${DEFAULT_THEME.scrollbar};
    height: ${DEFAULT_THEME.scrollbar};
  }
  ::-webkit-scrollbar-thumb {
    background: ${DEFAULT_THEME.grey[5]};
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
  .no-select {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
`

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found')
}

createRoot(container).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider theme={DEFAULT_THEME}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>
)
