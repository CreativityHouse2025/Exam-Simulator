import type { AnswerOfMultipleChoice, LangCode } from '../../types'

import React from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'
import { SESSION_ACTION_TYPES } from '../../constants'
import { ExamContext, SessionDataContext, SessionNavigationContext } from '../../contexts'
import useSettings from '../../hooks/useSettings'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ isReview }) => {
  const { index, update } = React.useContext(SessionNavigationContext)
  const { answers } = React.useContext(SessionDataContext)
  const exam = React.useContext(ExamContext)

  const { settings } = useSettings();
  const langCode = settings.language;

  const question = exam[index]
  const answer: AnswerOfMultipleChoice = answers[index] || []

  const onChoose = React.useCallback(
    (idx: number) => {
      if (isReview) return

      const newValues = answer.includes(idx)
        ? answer.filter((i) => i !== idx)
        : answer.length < question.answer.length
          ? [...answer, idx]
          : answer // Don't add if max answers reached

      answers[index] = newValues
      update!([SESSION_ACTION_TYPES.SET_ANSWERS, [...answers]])
    },
    [index, answers, answer, question.answer.length, isReview, update]
  )

  return (
    <div id={question.type}>
      {question.choices.map(({ text, correct }, i) => (
        <Choice
          key={i}
          singleAnswer={question.answer.length === 1}
          selected={answer.includes(i)}
          review={isReview}
          correct={correct}
          disabled={isReview || (!answer.includes(i) && answer.length >= question.answer.length)}
          label={formatChoiceLabel(i, langCode as LangCode)}
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
