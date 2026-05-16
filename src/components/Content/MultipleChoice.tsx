import type { AnswerOfMultipleChoice, LangCode } from '../../types'

import React from 'react'
import Choice from './Choice'
import { formatChoiceLabel } from '../../utils/format'
import { SESSION_ACTION_TYPES } from '../../constants'
import { useSessionNavigation, useSessionData, useExam } from '../../contexts'
import useSettings from '../../hooks/useSettings'

const MultipleChoiceComponent: React.FC<MultipleChoiceProps> = ({ isReview }) => {
  const { index: questionIndex, update } = useSessionNavigation()
  const { selectedOriginalIndices } = useSessionData()
  const { exam } = useExam()
  const questions = exam!

  const { settings } = useSettings();
  const langCode = settings.language;

  const question = questions[questionIndex]
  // Selected choice IDs (original indices) for the current question.
  const selectedIds: AnswerOfMultipleChoice = selectedOriginalIndices[questionIndex] || []

  const onChoose = React.useCallback(
    (displayIdx: number) => {
      if (isReview) return

      const choiceId = question.choices[displayIdx].originalIndex ?? displayIdx
      const current = selectedOriginalIndices[questionIndex] || []
      // compares selected choiceId with existing choiceIds in the already-selected
      const isAlreadySelected = current.includes(choiceId)
      const maxChoicesReached = current.length >= question.answer.length

      let newValues: AnswerOfMultipleChoice

      if (isAlreadySelected) {
        // if it's already selected then de-select the choice
        newValues = current.filter((id) => id !== choiceId)
      } else if (!maxChoicesReached) {
        // if have answer capacity then append it to the selectedOriginalIndices array
        newValues = [...current, choiceId]
      } else {
        return
      }

      const newSelected = selectedOriginalIndices.map(
        (a, i) => (i === questionIndex ? newValues : a)
      )

      console.log(`[Q${questionIndex}] id=${question.id} | correct=${question.answer.join(',')} | selected=${newSelected[questionIndex]?.join(',') ?? '—'}`)


      update!([SESSION_ACTION_TYPES.SET_ANSWERS, newSelected], [SESSION_ACTION_TYPES.MARK_DIRTY, questionIndex])
    },
    [questionIndex, selectedOriginalIndices, question.choices, question.answer.length, isReview, update]
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
