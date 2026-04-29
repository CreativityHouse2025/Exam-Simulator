import type { ThemedStyles } from '../types'
import { useNavigate } from "react-router-dom"
import React from 'react'
import styled from 'styled-components'
import { Language } from '@styled-icons/material/Language'
import { AccountCircle } from '@styled-icons/material/AccountCircle'
import { History } from '@styled-icons/material/History'
import { Menu } from '@styled-icons/material/Menu'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'
import useSettings from '../hooks/useSettings'
import useAuth from '../hooks/useAuth'

const HeaderStyles = styled.div<ThemedStyles>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  width: 100%;
  background: ${({ theme }) => theme.primary};
  padding: 0 1.2rem;
  box-sizing: border-box;
  z-index: 100;

  @media (min-width: 48rem) {
    padding: 0 3rem;
  }
`

const TitleStyles = styled.div<ThemedStyles>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font: 1.8rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  cursor: pointer;
  white-space: nowrap;

  @media (min-width: 48rem) {
    font-size: 2rem;
  }
`

const IconsContainer = styled.div`
  display: none;
  flex-direction: row;
  align-items: center;
  gap: 1rem;

  @media (min-width: 48rem) {
    display: flex;
  }
`

const MenuButton = styled.button<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  color: ${({ theme }) => theme.black};

  @media (min-width: 48rem) {
    display: none;
  }
`

const ImageStyles = styled.img`
  cursor: pointer;
  width: 4.5rem;
  justify-self: center;

  @media (min-width: 48rem) {
    width: 6rem;
  }
`

const IconStyles = styled.div<ThemedStyles>`
  justify-self: center;
  align-items: center;
  cursor: pointer;
  svg {
    color: ${({ theme }) => theme.black};
  }
`

/** App header with language toggle and conditional profile icon. */
const HeaderComponent: React.FC = () => {
  const title = translate('about.title')
  const navigate = useNavigate()
  const { settings, updateLanguage } = useSettings()
  const { isAuthenticated } = useAuth()

  const toggleLanguage = React.useCallback(() => {
    const nextCode = settings.language === "ar" ? "en" : "ar"
    updateLanguage(nextCode)
  }, [settings.language, updateLanguage])

  function handleProfile() {
    navigate("/profile")
  }

  function handleHomepage() {
    // used "/" intentionally instead of "/app" to allow user to go homepage during an exam (same route won't navigate)
    navigate("/")
  }

  return (
    <HeaderStyles id="header">
      <ImageStyles title='Creativity House' alt='Creativity House Logo' id="image" className="no-select" src={Logo} onClick={handleHomepage} />

      <TitleStyles id="title" className="no-select" onClick={handleHomepage}>
        {title}
      </TitleStyles>

      <IconsContainer>
        <IconStyles title='Change language' aria-label='Language Icon' id="language" className="no-select" onClick={toggleLanguage}>
          <Language size={40} />
        </IconStyles>
        {isAuthenticated && (
          <IconStyles title='View attempt history' aria-label='History Icon' id="history" className="no-select" onClick={() => navigate("/history")}>
            <History size={40} />
          </IconStyles>
        )}
        {isAuthenticated && (
          <IconStyles title='Update your information' aria-label='Account Icon' id="account" className="no-select" onClick={handleProfile}>
            <AccountCircle size={40}/>
          </IconStyles>
        )}
      </IconsContainer>

      <MenuButton aria-label='Open menu'>
        <Menu size={32} />
      </MenuButton>
    </HeaderStyles>
  )
}

export default HeaderComponent
