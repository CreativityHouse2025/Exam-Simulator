import type { ThemedStyles } from '../types'
import type { LangCode } from '../settings'

import React from 'react'
import styled from 'styled-components'
import lighten from 'polished/lib/color/lighten'
import { Language } from '@styled-icons/material/Language'
import { translate } from '../settings'
// @ts-expect-error
import Logo from '../assets/logo.png'

const HeaderStyles = styled.div`
  position: fixed;
  width: 100%;
  height: 5rem;
`

const InnerHeader = styled.div<ThemedStyles>`
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

  return (
    <HeaderStyles id="header">
      <InnerHeader id="inner-header">
        <ImageStyles src={Logo} />

        <TitleStyles>{title}</TitleStyles>

        <LanguageStyles onClick={() => setLang(document.documentElement.lang === 'ar' ? 'en' : 'ar')}>
          <Language size={30} />
        </LanguageStyles>
      </InnerHeader>
    </HeaderStyles>
  )
}

export default HeaderComponent

export interface HeaderProps {
  setLang: (lang: LangCode) => void
}
