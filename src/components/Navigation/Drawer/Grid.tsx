import type { QuestionFilter, ThemedStyles } from '../../../types'

import React, { useContext, useEffect } from 'react'
import styled from 'styled-components'
import Cell from './Cell'
import { ExamContext } from '../../../exam'
import { SessionContext } from '../../../session'

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
  const exam = useContext(ExamContext)
  const session = useContext(SessionContext)
  const [bookmarks, setBookmarks] = React.useState<number[]>(session.bookmarks)

  useEffect(() => {
    setBookmarks(session.bookmarks)
  }, [session])

  if (!exam || exam.test.length === 0) return null

  const answered = React.useMemo(() => {
    return session.answers
      .map((answer, i) => {
        const isMultipleChoiceAnswered = answer !== null && !Number.isNaN(answer)
        const isMultipleAnswerAnswered = Array.isArray(answer) && answer.length > 0

        if (isMultipleChoiceAnswered || isMultipleAnswerAnswered) {
          return i
        }
      })
      .filter((i) => i !== undefined)
  }, [exam, session])

  const getAnsweredCorrectly = React.useCallback(() => {
    return session.answers
      .map((answer, i) => {
        let isCorrect = false
        if (Array.isArray(answer) && Array.isArray(exam.test[i].answer)) {
          const arr: number[] = exam.test[i].answer
          isCorrect = answer.length === arr.length && answer.every((val) => arr.includes(val))
        } else {
          isCorrect = answer === exam.test[i].answer
        }

        if (isCorrect) return i
      })
      .filter((i) => i !== undefined)
  }, [exam, session])

  const getAnsweredIncorrectly = React.useCallback(() => {
    return answered.filter((i) => !getAnsweredCorrectly().includes(i))
  }, [answered, getAnsweredCorrectly])

  const getVisibleQuestions = React.useCallback(() => {
    switch (filter) {
      case 'marked':
        return bookmarks
      case 'complete':
        return answered
      case 'incorrect':
        return getAnsweredIncorrectly()
      case 'correct':
        return getAnsweredCorrectly()
      case 'incomplete':
        return Array.from({ length: exam.test.length }, (_, i) => i).filter((i) => !answered.includes(i))
      case 'all':
      default:
        return Array.from({ length: exam.test.length }, (_, i) => i)
    }
  }, [exam, answered, getAnsweredCorrectly, getAnsweredIncorrectly, bookmarks, filter])

  return (
    <GridStyles id="grid">
      {getVisibleQuestions().map((i) => (
        <Cell key={i} index={i} bookmarks={bookmarks} answered={answered} />
      ))}
    </GridStyles>
  )
}

export default GridComponent

export interface GridProps {
  filter: QuestionFilter
}
