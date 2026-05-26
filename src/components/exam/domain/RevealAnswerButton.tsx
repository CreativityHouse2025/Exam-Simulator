import type { ThemedStyles } from '../../../types'
import React from 'react'
import styled from 'styled-components'
import { Visibility } from '@styled-icons/material/Visibility'
import { VisibilityOff } from '@styled-icons/material/VisibilityOff'

const RevealAnswerStyles = styled.div<RevealAnswerStylesProps>`
  color: ${({ $isAnswerRevealed, theme }) => ($isAnswerRevealed ? theme.tertiary : theme.grey[10])};
  transition: color 0.3s;
  cursor: pointer;
  margin-inline-end: -0.6rem;
  &:hover {
    color: ${({ theme }) => theme.tertiary};
  }
`

const RevealAnswerButton: React.FC<RevealAnswerButtonProps> = ({ isAnswerRevealed, onToggleAnswerReveal }) => {
  const IconComponent = isAnswerRevealed ? VisibilityOff : Visibility

  return (
    <RevealAnswerStyles $isAnswerRevealed={isAnswerRevealed} className="no-select">
      <IconComponent size={35} onClick={onToggleAnswerReveal} />
    </RevealAnswerStyles>
  )
}

export default RevealAnswerButton

export interface RevealAnswerButtonProps {
  isAnswerRevealed: boolean
  onToggleAnswerReveal: () => void
}

export interface RevealAnswerStylesProps extends ThemedStyles {
  $isAnswerRevealed: boolean
}
