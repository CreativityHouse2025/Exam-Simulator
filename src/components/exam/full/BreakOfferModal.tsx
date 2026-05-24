import type { ThemedStyles } from '../../../types'
import React from 'react'
import styled from 'styled-components'
import darken from 'polished/lib/color/darken'
import { ModalOverlay } from '../../SharedStyles'
import { BreakCard } from './BreakModalsStyles'

const Title = styled.div<ThemedStyles>`
  height: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font: 600 2rem 'Open Sans';
  background: ${({ theme }) => theme.primary};
`

const Message = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Open Sans';
  font-size: 2.5rem;
  font-weight: 600;
  padding: 2.4rem 2rem;
  text-align: center;
`

const Buttons = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0 1.2rem 1.2rem;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  background: ${({ theme }) => theme.grey[0]};
  min-height: 5rem;
`

const Btn = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 1.5rem 'Open Sans';
  text-transform: uppercase;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background 0.3s;
  cursor: pointer;
`

const BtnConfirm = styled(Btn)<ThemedStyles>`
  color: white;
  background: ${({ theme }) => theme.secondary};
  &:hover { background: ${({ theme }) => darken(0.1, theme.secondary)}; }
`

const BtnCancel = styled(Btn)<ThemedStyles>`
  color: ${({ theme }) => theme.grey[10]};
  background: ${({ theme }) => theme.grey[2]};
  &:hover { background: ${({ theme }) => theme.grey[3]}; }
`

interface Props {
  dir: string
  title: string
  message: string
  primaryLabel: string
  secondaryLabel: string
  onTake: () => void
  onSkip: () => void
}

/** Break offer presented at Q61 and Q121 checkpoints. Matches the app's Modal.tsx style. Clicking the backdrop skips the break. */
export default function BreakOfferModal({ title, message, primaryLabel, secondaryLabel, onTake, onSkip }: Props) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onSkip()
  }

  return (
    <ModalOverlay onClick={handleBackdropClick}>
      <BreakCard>
        <Title>{title}</Title>
        <Message>{message}</Message>
        <Buttons>
          <BtnConfirm onClick={onTake}>{primaryLabel}</BtnConfirm>
          <BtnCancel onClick={onSkip}>{secondaryLabel}</BtnCancel>
        </Buttons>
      </BreakCard>
    </ModalOverlay>
  )
}
