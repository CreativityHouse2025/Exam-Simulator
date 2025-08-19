import { createGlobalStyle } from 'styled-components'
import theme from './theme'

export default createGlobalStyle`
  html {
    font-size: ${theme.fontSize}
  }
  body {
    padding: 0;
    margin: 0;
  }
  ::-webkit-scrollbar {
    width: ${theme.scrollbar};
    height: ${theme.scrollbar};
  }
  ::-webkit-scrollbar-thumb {
    background: ${theme.grey[5]};
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
`
