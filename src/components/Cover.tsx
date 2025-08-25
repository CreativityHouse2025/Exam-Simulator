import type { ThemedStyles } from '../types'
import type { StoredSession } from '../session'

import React from 'react'
import styled from 'styled-components'
// @ts-expect-error
import Logo from '../assets/logo.png'
import { translate } from '../utils/translation'

const CoverStyles = styled.div<ThemedStyles>`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const Image = styled.img<ThemedStyles>`
  max-height: 40vh;
  margin-bottom: 0.5rem;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  padding: 1rem;
  margin: 1rem;
`

export const Title = styled.div<ThemedStyles>`
  font: 3rem 'Open Sans';
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.black};
`

export const Description = styled.div`
  font: 2.25rem 'Open Sans';
  padding: 1rem;
  margin-bottom: 3rem;
`

const StartButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  padding: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 100px;
  margin: 0.8rem;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
`

const ContinueButton = styled(StartButton)<ThemedStyles>`
  min-width: 300px;
  background: ${({ theme }) => theme.secondary || theme.grey[6]};
`

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
`

const CoverComponent: React.FC<CoverProps> = ({ onStartNew, onStartMini, onContinue }) => {
  const [showSessions, setShowSessions] = React.useState(false)
  const [hasSessions, setHasSessions] = React.useState(false)

  React.useEffect(() => {
    setHasSessions(SessionStorageManager.getAllSessions().length > 0)
  }, [])

  const handleSessionSelect = (session: StoredSession) => {
    setShowSessions(false)
    onContinue && onContinue(session)
  }

  const [logoAlt, title, description, _new, mini, _continue] = React.useMemo(
    () => [
      translate('cover.logo-alt'),
      translate('about.title'),
      translate('about.description'),
      translate('cover.new'),
      translate('cover.mini'),
      translate('cover.continue')
    ],
    [document.documentElement.lang, translate]
  )

  return (
    <CoverStyles id="cover">
      <Image id="image" src={Logo} alt={logoAlt} />

      <Title id="title">{title}</Title>

      <Description id="description">{description}</Description>

      <ButtonContainer id="button-container">
        <ButtonRow id="button-row">
          <StartButton id="start-new-button" onClick={onStartNew}>
            {_new}
          </StartButton>

          <StartButton id="start-mini-button" onClick={onStartMini}>
            {mini}
          </StartButton>
        </ButtonRow>

        {hasSessions && (
          <ContinueButton id="continue-button" onClick={() => setShowSessions(true)}>
            {_continue}
          </ContinueButton>
        )}
      </ButtonContainer>

      {showSessions && <SessionList onClose={() => setShowSessions(false)} onSelectSession={handleSessionSelect} />}
    </CoverStyles>
  )
}

export default React.memo(CoverComponent)

export interface CoverProps {
  onStartNew: () => void | Promise<void>
  onStartMini: () => void | Promise<void>
  onContinue?: (session: StoredSession) => void | Promise<void>
}
