import type { ThemedStyles } from '../types'
import { useNavigate } from "react-router-dom"
import React from 'react'
import styled, { css } from 'styled-components'
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
  position: sticky;
  top: 0;
  width: 100%;
  background: ${({ theme }) => theme.primary};
  padding: 0 1.2rem;
  box-sizing: border-box;
  z-index: 100;

  @media (min-width: 768px) {
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

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`

const IconsContainer = styled.div`
  display: none;
  flex-direction: row;
  align-items: center;
  gap: 1rem;

  @media (min-width: 768px) {
    display: flex;
  }
`

const MenuWrapper = styled.div`
  position: relative;

  @media (min-width: 768px) {
    display: none;
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
`

const DropdownMenu = styled.div<ThemedStyles & { $open: boolean }>`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-end: 0;
  background: ${({ theme }) => theme.tertiary};
  border-radius: 6px;
  box-shadow: ${({ theme }) => theme.shadows[8]};
  min-width: 18rem;
  overflow: hidden;
  z-index: 200;
  transform-origin: top center;
  transition: opacity 0.18s ease, transform 0.18s ease;

  ${({ $open }) =>
    $open
      ? css`
          opacity: 1;
          transform: scaleY(1);
          pointer-events: all;
        `
      : css`
          opacity: 0;
          transform: scaleY(0.85);
          pointer-events: none;
        `}
`

const DropdownItem = styled.button<ThemedStyles>`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.85rem 1.1rem;
  color: ${({ theme }) => theme.quatro};
  font: 1.25rem 'Open Sans';
  font-weight: 600;
  text-align: start;
  width: 100%;
  transition: background 0.15s ease;

  svg {
    color: ${({ theme }) => theme.primary};
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.secondary};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      display: none;
    `}
`

const ImageStyles = styled.img`
  cursor: pointer;
  width: 4.5rem;
  justify-self: center;

  @media (min-width: 768px) {
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
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const toggleLanguage = React.useCallback(() => {
    const nextCode = settings.language === "ar" ? "en" : "ar"
    updateLanguage(nextCode)
  }, [settings.language, updateLanguage])

  function handleProfile() {
    navigate("/profile")
  }

  function handleHomepage() {
    navigate("/")
  }

  function handleMenuAction(action: () => void) {
    setIsMenuOpen(false)
    action()
  }

  React.useEffect(() => {
    function handlePointerOutside(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerOutside)
    return () => document.removeEventListener('pointerdown', handlePointerOutside)
  }, [])

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
            <AccountCircle size={40} />
          </IconStyles>
        )}
      </IconsContainer>

      <MenuWrapper ref={menuRef}>
        <MenuButton aria-label='Open menu' onClick={() => setIsMenuOpen(prev => !prev)}>
          <Menu size={32} />
        </MenuButton>
        <DropdownMenu $open={isMenuOpen}>
          <DropdownItem onClick={() => handleMenuAction(toggleLanguage)}>
            <Language size={22} />
            {translate('header.changeLanguage')}
          </DropdownItem>
          <DropdownItem disabled={!isAuthenticated} onClick={() => handleMenuAction(() => navigate("/history"))}>
            <History size={22} />
            {translate('header.history')}
          </DropdownItem>
          <DropdownItem disabled={!isAuthenticated} onClick={() => handleMenuAction(handleProfile)}>
            <AccountCircle size={22} />
            {translate('header.profile')}
          </DropdownItem>
        </DropdownMenu>
      </MenuWrapper>
    </HeaderStyles>
  )
}

export default HeaderComponent
