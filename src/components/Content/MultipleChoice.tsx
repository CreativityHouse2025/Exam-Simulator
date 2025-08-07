import type { Exam } from '../../types'
import type { Lang } from '../../settings'
import type { AnswerOfMultipleChoice, AnswerOfMultipleAnswer } from '../../session'

import React, { useContext, useState } from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'
import { SessionDataContext, SessionNavigationContext } from '../../session'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ exam, lang, isReview }) => {
  const { index } = useContext(SessionNavigationContext)
  const { answers } = useContext(SessionDataContext)
  const question = exam.test[index]
  const isSingleAnswer = question.type === 'multiple-choice'

  const answer = answers[index] !== null ? answers[index] : isSingleAnswer ? null : []
  const [value, setValue] = useState<AnswerOfMultipleChoice | AnswerOfMultipleAnswer>(answer)

  const onChooseSingle = React.useCallback(
    (i: number): void => {
      setValue(i)
      answers[index] = i
    },
    [index, answers]
  )

  const onChooseMultiple = React.useCallback(
    (i: number): void => {
      const currValues = (value as AnswerOfMultipleAnswer) || []
      const newValues = currValues.includes(i) ? currValues.filter((el) => el !== i) : currValues.concat(i)

      setValue(newValues)
      answers[index] = newValues
    },
    [index, answers, value]
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
  lang: Lang
  isReview: boolean
}
