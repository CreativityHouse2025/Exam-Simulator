import type { ThemedStyles } from '../../types'

import React from 'react'
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
  ${({ $disabled }) => !$disabled && 'cursor: pointer;'}
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
  singleAnswer,
  selected,
  review,
  correct,
  disabled,
  label,
  text,
  onClick
}) => {
  const name = selected ? 'selected' : ''
  const props = {
    $review: review,
    $correct: correct,
    $disabled: disabled,
    onClick: disabled ? undefined : onClick
  }

  const renderIcon = React.useCallback((): React.ReactNode => {
    if (selected) {
      return React.createElement(singleAnswer ? RadioButtonChecked : CheckBox, { className: name, size: 20 })
    } else {
      return React.createElement(singleAnswer ? RadioButtonUnchecked : CheckBoxOutlineBlank, { size: 20 })
    }
  }, [selected, singleAnswer])

  return (
    <ChoiceStyles {...props}>
      {renderIcon()}

      <LabelStyles className={name}>{label}</LabelStyles>

      <div className={name}>{text}</div>
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
