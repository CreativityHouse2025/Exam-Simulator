import type { LangCode, ThemedStyles } from '../types'

import React from 'react'
import styled from 'styled-components'
import lighten from 'polished/lib/color/lighten'
import { Language } from '@styled-icons/material/Language'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'

const HeaderStyles = styled.div<ThemedStyles>`
  position: fixed;
  width: 100%;
  display: grid;
  align-items: center;
  grid-template-columns: 15rem 1fr 15rem;
  background: ${({ theme }) => theme.primary};
`

const TitleStyles = styled.div<ThemedStyles>`
  justify-self: center;
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  margin-left: 1rem;
  cursor: pointer;
`

const ImageStyles = styled.img`
  width: 6rem;
  justify-self: center;
`

const LanguageStyles = styled.div<ThemedStyles>`
  justify-self: center;
  align-items: center;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
  svg {
    color: ${({ theme }) => theme.black};
  }
`

const HeaderComponent: React.FC<HeaderProps> = ({ setLang }) => {
  const title = React.useMemo(() => translate('about.title'), [document.documentElement.lang, translate])

  const resetApp = React.useCallback(() => window.location.reload(), [])

  return (
    <HeaderStyles id="header">
      <ImageStyles id="image" className="no-select" src={Logo} />

      <TitleStyles id="title" onClick={resetApp}>
        {title}
      </TitleStyles>

      <LanguageStyles
        id="language"
        className="no-select"
        onClick={() => setLang(document.documentElement.lang === 'ar' ? 'en' : 'ar')}
      >
        <Language size={40} />
      </LanguageStyles>
    </HeaderStyles>
  )
}

export default HeaderComponent

export interface HeaderProps {
  setLang: (lang: LangCode) => void
}
