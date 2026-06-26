import type { AnswerOfMultipleChoice, LangCode } from '../../../types'

import React from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../../utils/format'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import useSettings from '../../../hooks/useSettings'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ isReview, isAnswerRevealed = false }) => {
  const { index: questionIndex, selectedOriginalIndices, exam, setAnswer } = useExamSessionCore()
  const { settings } = useSettings()
  const langCode = settings.language

  const question = exam[questionIndex]
  const selectedIds: AnswerOfMultipleChoice = selectedOriginalIndices[questionIndex] || []

  const shouldShowCorrectness = isReview || isAnswerRevealed
  const isChoiceInteractionLocked = isReview
  const isSingleAnswer = question.answer.length === 1
  const maxAnswersReached = selectedIds.length >= question.answer.length

  const onChoose = React.useCallback(
    (displayIdx: number) => {
      if (isChoiceInteractionLocked) return

      const choiceId = question.choices[displayIdx].originalIndex ?? displayIdx
      const current = selectedOriginalIndices[questionIndex] || []

      let newValues: AnswerOfMultipleChoice

      if (isSingleAnswer) {
        newValues = [choiceId]
      } else {
        const isAlreadySelected = current.includes(choiceId)
        if (isAlreadySelected) {
          newValues = current.filter((id) => id !== choiceId)
        } else if (!maxAnswersReached) {
          newValues = [...current, choiceId]
        } else {
          return
        }
      }

      setAnswer(questionIndex, newValues)
    },
    [questionIndex, selectedOriginalIndices, question.choices, question.answer.length, isChoiceInteractionLocked, setAnswer, isSingleAnswer, maxAnswersReached]
  )

  return (
    <div id={question.type}>
      {question.choices.map(({ text, correct, originalIndex }, i) => {
        const choiceId = originalIndex ?? i
        const isSelected = selectedIds.includes(choiceId)
        return (
          <Choice
            key={i}
            singleAnswer={isSingleAnswer}
            selected={isSelected}
            review={shouldShowCorrectness}
            correct={correct}
            disabled={isChoiceInteractionLocked || (!isSingleAnswer && !isSelected && maxAnswersReached)}
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
  isAnswerRevealed?: boolean
}
