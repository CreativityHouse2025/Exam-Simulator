import type { Exam, ThemedStyles } from '../../../types'
import type { AnswerOfMultipleChoice, AnswerOfMultipleAnswer, Session } from '../../../session'

import React, { useState } from 'react'
import styled from 'styled-components'
import { RadioButtonChecked } from '@styled-icons/material/RadioButtonChecked'
import { RadioButtonUnchecked } from '@styled-icons/material/RadioButtonUnchecked'
import { CheckBox } from '@styled-icons/material/CheckBox'
import { CheckBoxOutlineBlank } from '@styled-icons/material/CheckBoxOutlineBlank'
import { type Lang } from '../../../settings'
import { formatChoiceLabel } from '../../../utils/format'

export const ChoiceStyles = styled.div<ChoiceTextStylesProps>`
  display: grid;
  grid-template-columns: 3rem 1fr;
  margin-bottom: 0.5rem;
  cursor: pointer;
  svg {
    color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.grey[5]) : theme.grey[10])};
    margin-right: 0.5rem;
  }
  .selected {
    color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.incorrect) : theme.black)};
  }
`

export const TextStyles = styled.div<ChoiceTextStylesProps>`
  dir: inherit;
  display: flex;
  font: 2rem 'Open Sans';
  color: ${({ $review, $correct, theme }) => ($review ? ($correct ? theme.correct : theme.grey[5]) : theme.black)};
  & > :first-child {
    font-weight: 600;
    margin-right: 1rem;
    margin-left: 1rem;
  }
`

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ exam, session, lang }) => {
  const { index, answers } = session
  const isReview = session.examState === 'completed'
  const question = exam.test[index]
  const isSingleAnswer = question.type === 'multiple-choice'

  const answer = answers[index] || (isSingleAnswer ? null : [])
  const [value, setValue] = useState<AnswerOfMultipleChoice | AnswerOfMultipleAnswer>(answer)

  const onChooseSingle = (i: number): void => {
    setValue(i)
    session.answers[index] = i
  }

  const onChooseMultiple = (i: number): void => {
    const currValues = (value as AnswerOfMultipleAnswer) || []
    const newValues = currValues.includes(i) ? currValues.filter((el) => el !== i) : currValues.concat(i)

    setValue(newValues)
    session.answers[index] = newValues
  }

  const onChoose = isSingleAnswer ? onChooseSingle : onChooseMultiple

  const isSelected = (i: number): boolean => {
    if (isSingleAnswer) return value === i
    return Array.isArray(value) && value.includes(i)
  }

  return (
    <div id={question.type} dir={lang.dir}>
      {question.choices.map(({ text, correct }, i) => (
        <ChoiceComponent
          key={i}
          isSingleAnswer={isSingleAnswer}
          isSelected={isSelected(i)}
          isReview={isReview}
          isCorrect={correct}
          content={[formatChoiceLabel(i, lang.code) + '.', text]}
          onClick={() => onChoose(i)}
        />
      ))}
    </div>
  )
}

const ChoiceComponent: React.FC<ChoiceProps> = ({
  isSingleAnswer,
  isSelected,
  isReview,
  isCorrect,
  content,
  onClick
}) => {
  const renderIcon = (): React.ReactNode => {
    if (isSelected) {
      return React.createElement(isSingleAnswer ? RadioButtonChecked : CheckBox, { className: 'selected', size: 20 })
    } else {
      return React.createElement(isSingleAnswer ? RadioButtonUnchecked : CheckBoxOutlineBlank, { size: 20 })
    }
  }

  return (
    <ChoiceStyles $review={isReview} $correct={isCorrect} onClick={onClick}>
      {renderIcon()}

      <TextStyles className={isSelected ? 'selected' : ''} $review={isReview} $correct={isCorrect}>
        {content.map((text, i) => (
          <div key={i}>{text}</div>
        ))}
      </TextStyles>
    </ChoiceStyles>
  )
}

export default MultipleChoiceComponent

export interface MultipleChoiceProps {
  exam: Exam
  session: Session
  lang: Lang
}

export interface ChoiceProps {
  isSingleAnswer: boolean
  isSelected: boolean
  isReview: boolean
  isCorrect: boolean
  content: string[]
  onClick: () => void
}

export interface ChoiceTextStylesProps extends ThemedStyles {
  $review: boolean
  $correct: boolean
}
