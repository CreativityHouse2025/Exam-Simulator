import React from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { DEFAULT_THEME } from './constants'
import App from './App'

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
`

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found')
}

createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider theme={DEFAULT_THEME}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
