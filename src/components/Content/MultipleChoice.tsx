import type { Exam } from '../../types'
import type { Lang } from '../../settings'
import type { AnswerOfMultipleChoice, AnswerOfMultipleAnswer } from '../../session'

import React, { useContext } from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'
import { SessionActionTypes, SessionDataContext, SessionNavigationContext } from '../../session'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ exam, lang, isReview }) => {
  const { index, update } = useContext(SessionNavigationContext)
  const { answers } = useContext(SessionDataContext)

  const question = exam.test[index]
  const isSingleAnswer = question.type === 'multiple-choice'

  const answer: AnswerOfMultipleChoice | AnswerOfMultipleAnswer =
    answers[index] !== null ? answers[index] : isSingleAnswer ? null : []

  const onChooseSingle = React.useCallback(
    (i: number): void => {
      answers[index] = i
      update!([SessionActionTypes.SET_ANSWERS, [...answers]])
    },
    [index, answers, answer]
  )

  const onChooseMultiple = React.useCallback(
    (i: number): void => {
      const currValues = (answer as AnswerOfMultipleAnswer) || []
      const newValues = currValues.includes(i) ? currValues.filter((el) => el !== i) : currValues.concat(i)

      answers[index] = newValues
      update!([SessionActionTypes.SET_ANSWERS, [...answers]])
    },
    [index, answers, answer]
  )

  const onChoose = React.useMemo(
    () => (isSingleAnswer ? onChooseSingle : onChooseMultiple),
    [isSingleAnswer, onChooseSingle, onChooseMultiple]
  )

  const isSelected = React.useCallback(
    (i: number): boolean => {
      if (isSingleAnswer) return answer === i
      return Array.isArray(answer) && answer.includes(i)
    },
    [isSingleAnswer, answer]
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
