import type { AnswerOfMultipleChoice, LangCode } from '../../types'

import React from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'
import { SESSION_ACTION_TYPES } from '../../constants'
import { ExamContext, SessionDataContext, SessionNavigationContext } from '../../contexts'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ isReview }) => {
  const { index, update } = React.useContext(SessionNavigationContext)
  const { answers } = React.useContext(SessionDataContext)
  const exam = React.useContext(ExamContext)

  const question = exam[index]
  const answer: AnswerOfMultipleChoice = answers[index] || []

  const onChoose = React.useCallback(
    (i: number): void => {
      const currValues = (answer as AnswerOfMultipleChoice) || []
      let newValues: number[]

      // Multiple answers: add/remove from array, respecting maxAnswers limit
      if (currValues.includes(i)) {
        newValues = currValues.filter((el) => el !== i)
      } else if (currValues.length < question.answer.length) {
        newValues = currValues.concat(i)
      } else {
        // Max answers reached, don't add more
        return
      }

      answers[index] = newValues
      update!([SESSION_ACTION_TYPES.SET_ANSWERS, [...answers]])
    },
    [index, answers, answer, question.answer.length]
  )

  const isSelected = React.useCallback(
    (i: number): boolean => {
      return Array.isArray(answer) && answer.includes(i)
    },
    [answer]
  )

  const isDisabled = React.useCallback(
    (i: number): boolean => {
      if (isReview) return true
      if (isSelected(i)) return false
      return answer.length >= question.answer.length
    },
    [isReview, isSelected, answer.length, question.answer.length]
  )

  return (
    <div id={question.type}>
      {question.choices.map(({ text, correct }, i) => (
        <Choice
          key={i}
          singleAnswer={question.answer.length === 1}
          selected={isSelected(i)}
          review={isReview}
          correct={correct}
          disabled={isDisabled(i)}
          label={formatChoiceLabel(i, document.documentElement.lang as LangCode)}
          text={text}
          onClick={() => onChoose(i)}
        />
      ))}
    </div>
  )
}

export default MultipleChoiceComponent

export interface MultipleChoiceProps {
  isReview: boolean
}
