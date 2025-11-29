import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { RadioButtonChecked } from '@styled-icons/material/RadioButtonChecked'
import { RadioButtonUnchecked } from '@styled-icons/material/RadioButtonUnchecked'
import { CheckBoxOutlineBlank } from '@styled-icons/material/CheckBoxOutlineBlank'
import { CheckBox } from '@styled-icons/material/CheckBox'

export const ChoiceStyles = styled.div<ChoiceTextStylesProps>`
  display: grid;
  grid-template-columns: 2rem 4rem 1fr;
  align-items: center;
  margin-bottom: 0.5rem;
  font: 2rem 'Open Sans';
  ${({ $disabled }) => !$disabled && 'cursor: pointer;'}
  color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.grey[5]) : theme.grey[10])};
  svg {
    margin-right: 0.5rem;
  }
  .selected {
    color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.incorrect) : theme.black)};
  }
`

// add margin to align with radio buttons (Open Sans issue)
const LabelStyles = styled.div`
  margin-top: -1px; 
  justify-self: center;
  font-weight: 600;
`

const ChoiceComponent: React.FC<ChoiceProps> = ({
  singleAnswer,
  selected,
  review,
  correct,
  disabled,
  label,
  text,
  onClick
}) => {
  const selectedClass = selected ? 'selected' : ''

  const iconComponents = React.useMemo(
    () => ({
      selected: singleAnswer ? RadioButtonChecked : CheckBox,
      unselected: singleAnswer ? RadioButtonUnchecked : CheckBoxOutlineBlank
    }),
    [singleAnswer]
  )

  const IconComponent = selected ? iconComponents.selected : iconComponents.unselected

  return (
    <ChoiceStyles
      $review={review}
      $correct={correct}
      $disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className="no-select"
    >
      <IconComponent className={`no-select ${selectedClass}`} size={20} />

      <LabelStyles className={selectedClass}>{label}</LabelStyles>

      <div className={selectedClass}>{text}</div>
    </ChoiceStyles>
  )
}

export default ChoiceComponent

export interface ChoiceProps {
  singleAnswer: boolean
  selected: boolean
  review: boolean
  correct: boolean
  disabled: boolean
  label: string
  text: string
  onClick: React.MouseEventHandler<HTMLDivElement>
}

export interface ChoiceTextStylesProps extends ThemedStyles {
  $review: boolean
  $correct: boolean
  $disabled: boolean
}
