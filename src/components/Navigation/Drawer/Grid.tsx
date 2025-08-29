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

  const answered = React.useMemo(() => {
    return answers
      .map((a, i) => {
        switch (exam[i].type) {
          case 'multiple-choice':
            return Array.isArray(a) && a.length > 0 ? i : undefined

          default:
            return a !== null && a !== undefined ? i : undefined
        }
      })
      .filter((i) => i !== undefined)
  }, [exam, answers])

  const getAnsweredCorrectly = React.useCallback(() => {
    return answers
      .map((a, i) => {
        let isCorrect = false
        if (Array.isArray(a) && Array.isArray(exam[i].answer)) {
          const arr: number[] = exam[i].answer
          isCorrect = a.length === arr.length && a.every((val) => arr.includes(val))
        } else {
          isCorrect = a === exam[i].answer
        }

        if (isCorrect) return i
      })
      .filter((i) => i !== undefined)
  }, [exam, answers])

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
        return Array.from({ length: exam.length }, (_, i) => i).filter((i) => !answered.includes(i))
      case 'all':
      default:
        return Array.from({ length: exam.length }, (_, i) => i)
    }
  }, [filter, exam, bookmarks, answered, getAnsweredCorrectly, getAnsweredIncorrectly])

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
