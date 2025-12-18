import type { LangCode, ThemedStyles } from '../types'

import React from 'react'
import styled from 'styled-components'
import { Language } from '@styled-icons/material/Language'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import useSettings from '../hooks/useSettings'

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
  cursor: pointer;
  width: 6rem;
  justify-self: center;
`

const LanguageStyles = styled.div<ThemedStyles>`
  justify-self: center;
  align-items: center;
  cursor: pointer;
  svg {
    color: ${({ theme }) => theme.black};
  }
`

const HeaderComponent: React.FC<HeaderProps> = ({ onLanguage }) => {
  const { settings } = useSettings();
  const langCode = settings.language;
  const title = React.useMemo(() => translate('about.title'), [langCode, translate])
  const resetApp = React.useCallback(() => window.location.reload(), [])

  return (
    <HeaderStyles id="header">
      <ImageStyles title='Creativity House' alt='Creativity House Logo' id="image" className="no-select" src={Logo} onClick={resetApp} />

      <TitleStyles id="title" className="no-select" onClick={resetApp}>
        {title}
      </TitleStyles>

      <LanguageStyles title='Change language' aria-label='Language Icon' id="language" className="no-select" onClick={onLanguage}>
        <Language size={40} />
      </LanguageStyles>
    </HeaderStyles>
  )
}

export default HeaderComponent

export interface HeaderProps {
  onLanguage: () => void
}
