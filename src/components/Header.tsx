import type { ThemedStyles } from '../types'

import React from 'react'
import styled from 'styled-components'
import { Language } from '@styled-icons/material/Language'
import { AccountCircle } from '@styled-icons/material/AccountCircle'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import useSettings from '../hooks/useSettings'

const HeaderStyles = styled.div<ThemedStyles>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  width: 100%;
  background: ${({ theme }) => theme.primary};
  padding: 0 3rem;
  box-sizing: border-box;
  z-index: 100;
`

const TitleStyles = styled.div<ThemedStyles>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  cursor: pointer;
  white-space: nowrap;
`
const IconsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
`

const ImageStyles = styled.img`
  cursor: pointer;
  width: 6rem;
  justify-self: center;
`

const IconStyles = styled.div<ThemedStyles>`
  justify-self: center;
  align-items: center;
  cursor: pointer;
  svg {
    color: ${({ theme }) => theme.black};
  }
`


const HeaderComponent: React.FC<HeaderProps> = ({ onLanguage, onAccount }) => {
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

      <IconsContainer>
        <IconStyles title='Change language' aria-label='Language Icon' id="language" className="no-select" onClick={onLanguage}>
          <Language size={40} />
        </IconStyles>
        <IconStyles title='Update your information' aria-label='Account Icon' id="account" className="no-select" onClick={onAccount}>
          <AccountCircle size={40}/>
        </IconStyles>
      </IconsContainer>
    </HeaderStyles>
  )
}

export default HeaderComponent

export interface HeaderProps {
  onLanguage: () => void
  onAccount: () => void
}
