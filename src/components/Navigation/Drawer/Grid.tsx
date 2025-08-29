import type { QuestionFilter, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import Cell from './Cell'
import { ExamContext, SessionDataContext } from '../../../contexts'

const GridStyles = styled.div<ThemedStyles>`
  height: calc(100vh - 50rem);
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 1rem;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
`

const GridComponent: React.FC<GridProps> = ({ filter }) => {
  const exam = React.useContext(ExamContext)
  const { bookmarks, answers } = React.useContext(SessionDataContext)

  if (!exam || exam.length === 0) return null

  const categorizedAnswers = React.useMemo(() => {
    const answered: number[] = []
    const correct: number[] = []
    const incorrect: number[] = []

    answers.forEach((answer, i) => {
      const hasAnswer = answer.length > 0

      if (hasAnswer) {
        answered.push(i)

        // Check if answer is correct
        const examAnswer = exam[i].answer
        const isCorrect = answer.length === examAnswer.length && answer.every((val) => examAnswer.includes(val))

        if (isCorrect) {
          correct.push(i)
        } else {
          incorrect.push(i)
        }
      }
    })

    const incomplete = Array.from({ length: exam.length }, (_, i) => i).filter((i) => !answered.includes(i))

    return { answered, correct, incorrect, incomplete }
  }, [exam, answers])

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
        return Array.from({ length: exam.length }, (_, i) => i)
    }
  }, [filter, exam.length, bookmarks, categorizedAnswers])

  return (
    <GridStyles id="grid">
      {visibleQuestions.map((i) => (
        <Cell key={i} index={i} bookmarks={bookmarks} answered={categorizedAnswers.answered} />
      ))}
    </GridStyles>
  )
}

export default GridComponent

export interface GridProps {
  filter: QuestionFilter
}
