import type { ThemedStyles } from '../../types'

import React, { MouseEventHandler } from 'react'
import styled from 'styled-components'
import { RadioButtonChecked } from '@styled-icons/material/RadioButtonChecked'
import { RadioButtonUnchecked } from '@styled-icons/material/RadioButtonUnchecked'
import { CheckBox } from '@styled-icons/material/CheckBox'
import { CheckBoxOutlineBlank } from '@styled-icons/material/CheckBoxOutlineBlank'

export const ChoiceStyles = styled.div<ChoiceTextStylesProps>`
  display: grid;
  grid-template-columns: 2rem 4rem 1fr;
  margin-bottom: 0.5rem;
  font: 2rem 'Open Sans';
  cursor: pointer;
  color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.grey[5]) : theme.grey[10])};
  svg {
    margin-right: 0.5rem;
  }
  .selected {
    color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.incorrect) : theme.black)};
  }
`

const LabelStyles = styled.div`
  justify-self: center;
  font-weight: 600;
`

const ChoiceComponent: React.FC<ChoiceProps> = ({
  isSingleAnswer,
  isSelected,
  isReview,
  isCorrect,
  label,
  text,
  onClick
}) => {
  const name = isSelected ? 'selected' : ''

  const renderIcon = React.useCallback((): React.ReactNode => {
    if (isSelected) {
      return React.createElement(isSingleAnswer ? RadioButtonChecked : CheckBox, { className: name, size: 20 })
    } else {
      return React.createElement(isSingleAnswer ? RadioButtonUnchecked : CheckBoxOutlineBlank, { size: 20 })
    }
  }, [isSelected, isSingleAnswer])

  return (
    <ChoiceStyles $review={isReview} $correct={isCorrect} onClick={onClick}>
      {renderIcon()}

      <LabelStyles className={name}>{label}</LabelStyles>

      <div className={name}>{text}</div>
    </ChoiceStyles>
  )
}

export default ChoiceComponent

export interface ChoiceProps {
  isSingleAnswer: boolean
  isSelected: boolean
  isReview: boolean
  isCorrect: boolean
  label: string
  text: string
  onClick: MouseEventHandler<HTMLDivElement>
}

export interface ChoiceTextStylesProps extends ThemedStyles {
  $review: boolean
  $correct: boolean
}
