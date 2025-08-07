import type { Exam } from '../../types'
import type { Lang } from '../../settings'
import type { AnswerOfMultipleChoice, AnswerOfMultipleAnswer, Session } from '../../session'

import React, { useState } from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ exam, session, lang, isReview }) => {
  const { index, answers } = session
  const question = exam.test[index]
  const isSingleAnswer = question.type === 'multiple-choice'

  const answer = answers[index] !== null ? answers[index] : isSingleAnswer ? null : []
  const [value, setValue] = useState<AnswerOfMultipleChoice | AnswerOfMultipleAnswer>(answer)

  const onChooseSingle = React.useCallback(
    (i: number): void => {
      setValue(i)
      session.answers[index] = i
    },
    [index, session]
  )

  const onChooseMultiple = React.useCallback(
    (i: number): void => {
      const currValues = (value as AnswerOfMultipleAnswer) || []
      const newValues = currValues.includes(i) ? currValues.filter((el) => el !== i) : currValues.concat(i)

      setValue(newValues)
      session.answers[index] = newValues
    },
    [index, session, value]
  )

  const onChoose = React.useMemo(
    () => (isSingleAnswer ? onChooseSingle : onChooseMultiple),
    [isSingleAnswer, onChooseSingle, onChooseMultiple]
  )

  const isSelected = React.useCallback(
    (i: number): boolean => {
      if (isSingleAnswer) return value === i
      return Array.isArray(value) && value.includes(i)
    },
    [isSingleAnswer, value]
  )

  return (
    <div id={question.type} dir={lang.dir}>
      {question.choices.map(({ text, correct }, i) => (
        <Choice
          key={i}
          isSingleAnswer={isSingleAnswer}
          isSelected={isSelected(i)}
          isReview={isReview}
          isCorrect={correct}
          label={formatChoiceLabel(i, lang.code)}
          text={text}
          onClick={() => onChoose(i)}
        />
      ))}
    </div>
  )
}

export default MultipleChoiceComponent

export interface MultipleChoiceProps {
  exam: Exam
  session: Session
  lang: Lang
  isReview: boolean
}
