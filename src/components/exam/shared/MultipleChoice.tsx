import type { AnswerOfMultipleChoice, LangCode } from '../../../types'

import React from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../../utils/format'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import useSettings from '../../../hooks/useSettings'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ isReview }) => {
  const { index: questionIndex, selectedOriginalIndices, exam, setAnswer } = useExamSessionCore()
  const { settings } = useSettings()
  const langCode = settings.language

  const question = exam[questionIndex]
  const selectedIds: AnswerOfMultipleChoice = selectedOriginalIndices[questionIndex] || []

  const onChoose = React.useCallback(
    (displayIdx: number) => {
      if (isReview) return

      const choiceId = question.choices[displayIdx].originalIndex ?? displayIdx
      const current = selectedOriginalIndices[questionIndex] || []
      const isAlreadySelected = current.includes(choiceId)
      const maxChoicesReached = current.length >= question.answer.length

      let newValues: AnswerOfMultipleChoice

      if (isAlreadySelected) {
        newValues = current.filter((id) => id !== choiceId)
      } else if (!maxChoicesReached) {
        newValues = [...current, choiceId]
      } else {
        return
      }

      setAnswer(questionIndex, newValues)
    },
    [questionIndex, selectedOriginalIndices, question.choices, question.answer.length, isReview, setAnswer]
  )

  return (
    <div id={question.type}>
      {question.choices.map(({ text, correct, originalIndex }, i) => {
        const choiceId = originalIndex ?? i
        const isSelected = selectedIds.includes(choiceId)
        return (
          <Choice
            key={i}
            singleAnswer={question.answer.length === 1}
            selected={isSelected}
            review={isReview}
            correct={correct}
            disabled={isReview || (!isSelected && selectedIds.length >= question.answer.length)}
            label={formatChoiceLabel(i, langCode as LangCode)}
            text={text}
            onClick={() => onChoose(i)}
          />
        )
      })}
    </div>
  )
}

export default MultipleChoiceComponent

export interface MultipleChoiceProps {
  isReview: boolean
}
