import type { QuestionFilter } from '../../../../types'

import React from 'react'
import Cell from './Cell'
import { useExamSessionCore } from '../../../../hooks/examSession/useExamSessionCore'
import { isAnswerCorrect } from '../../../../utils/results'

const GridComponent: React.FC<GridProps> = ({ filter }) => {
  const { exam, bookmarks, selectedOriginalIndices } = useExamSessionCore()

  // Pre-existing bug fix (unrelated to this migration): hooks below must run unconditionally.
  // `exam` used to be null-checked with an early return BEFORE these useMemo calls, which
  // violates rules-of-hooks — if `exam` transitions from null to populated without a remount,
  // React throws "rendered fewer hooks than expected". `examList` keeps the hooks unconditional;
  // the null/empty check moves below them and still short-circuits the render identically.
  const examList = exam ?? []

  const categorizedAnswers = React.useMemo(() => {
    const answered: number[] = []
    const correct: number[] = []
    const incorrect: number[] = []

    selectedOriginalIndices.forEach((userAnswer, i) => {
      const hasAnswer = userAnswer.length > 0

      if (hasAnswer) {
        answered.push(i)

        const isCorrect = isAnswerCorrect(userAnswer, examList[i].answer)

        if (isCorrect) {
          correct.push(i)
        } else {
          incorrect.push(i)
        }
      }
    })

    const incomplete = Array.from({ length: examList.length }, (_, i) => i).filter((i) => !answered.includes(i))

    return { answered, correct, incorrect, incomplete }
  }, [examList, selectedOriginalIndices])

  const visibleQuestions = React.useMemo(() => {
    switch (filter) {
      case 'marked':
        return bookmarks
      case 'complete':
        return categorizedAnswers.answered
      case 'incorrect':
        return categorizedAnswers.incorrect
      case 'correct':
        return categorizedAnswers.correct
      case 'incomplete':
        return categorizedAnswers.incomplete
      case 'all':
      default:
        return Array.from({ length: examList.length }, (_, i) => i)
    }
  }, [filter, examList.length, bookmarks, categorizedAnswers])

  if (!exam || exam.length === 0) return null

  return (
    <div id="grid" className="max-h-50 flex flex-wrap content-start p-2.5 overflow-y-auto border-y border-grey-200">
      {visibleQuestions.map((i) => (
        <Cell key={i} index={i} bookmarks={bookmarks} answered={categorizedAnswers.answered} />
      ))}
    </div>
  )
}

export default GridComponent

export interface GridProps {
  filter: QuestionFilter
}
