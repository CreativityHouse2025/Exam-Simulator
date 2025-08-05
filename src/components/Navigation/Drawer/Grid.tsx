import type { GridTagTypes, QuestionFilter, ThemedStyles } from '../../../types'

import React, { useContext, useEffect } from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import { gridItemBackgroundColor } from '../../../utils/color'
import { ExamContext } from '../../../exam'
import { SessionActionTypes, SessionContext } from '../../../session'
import { translate } from '../../../settings'

export const GridStyles = styled.div<ThemedStyles>`
  height: calc(100vh - 45rem);
  border-top: 1px solid ${({ theme }) => theme.grey[2]};
  border-bottom: 1px solid ${({ theme }) => theme.grey[2]};
`

export const LegendStyles = styled.div<ThemedStyles>`
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  .complete,
  .correct {
    background: ${({ theme }) => lighten(0.2, theme.primary)};
  }
  .bookmarked {
    background: ${({ theme }) => theme.quatro};
  }
  .incorrect {
    background: ${({ theme }) => lighten(0.2, theme.secondary)};
  }
  .incomplete {
    background: ${({ theme }) => theme.grey[2]};
  }
`

export const LegendItemStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  & > :first-child {
    width: 1rem;
    height: 1rem;
    margin-right: 0.25rem;
    border: 0.5px solid ${({ theme }) => theme.grey[2]};
  }
  & > :last-child {
    font: 0.9rem 'Open Sans';
    font-weight: 600;
  }
`

export const InnerGridStyles = styled.div`
  height: calc(100vh - 50rem);
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 1rem;
  overflow-y: auto;
`

export const GridItem = styled.div<GridItemStylesProps>`
  width: 4.5rem;
  height: 4.5rem;
  display: grid;
  justify-items: center;
  align-items: center;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  background: ${({ $background }) => $background};
  color: #333;
  border: 1px solid ${({ theme }) => theme.grey[3]};
  font: 1rem 'Open Sans';
  font-weight: 700;
  outline: 3px solid ${({ $selected, theme }) => ($selected ? theme.grey[10] : 'transparent')};
  cursor: pointer;
`

const GridComponent: React.FC<GridProps> = ({ open, show }) => {
  const exam = useContext(ExamContext)
  const session = useContext(SessionContext)
  const [bookmarks, setBookmarks] = React.useState<number[]>(session.bookmarks)

  useEffect(() => {
    setBookmarks(session.bookmarks)
  }, [session])

  if (!open || !exam || exam.test.length === 0) return null

  const answered = session.answers
    .map((answer, i) => {
      const isMultipleChoiceAnswered = answer !== null && !Number.isNaN(answer)
      const isMultipleAnswerAnswered = Array.isArray(answer) && answer.length > 0

      if (isMultipleChoiceAnswered || isMultipleAnswerAnswered) {
        return i
      }
    })
    .filter((i) => i !== undefined)
  const answeredCorrectly = session.answers
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
  const answeredIncorrectly = answered.filter((i) => !answeredCorrectly.includes(i))

  const onClickGridItem = (question: number) => {
    if (question === session.index) return
    session.update!(SessionActionTypes.SET_INDEX, question)
    session.update!(SessionActionTypes.SET_REVIEW_STATE, 'question')
  }

  const getVisibleQuestions = () => {
    switch (show) {
      case 'marked':
        return bookmarks
      case 'complete':
        return answered
      case 'incorrect':
        return answeredIncorrectly
      case 'correct':
        return answeredCorrectly
      case 'incomplete':
        return Array.from({ length: exam.test.length }, (_, i) => i).filter((i) => !answered.includes(i))
      case 'all':
      default:
        return Array.from({ length: exam.test.length }, (_, i) => i)
    }
  }

  return (
    <GridStyles id="grid">
      <LegendStyles>
        <LegendItem type="marked" />
        <LegendItem type="incomplete" />
        {session.examState === 'in-progress' && <LegendItem type="complete" />}
        {session.examState === 'completed' && (
          <>
            <LegendItem type="incorrect" />
            <LegendItem type="correct" />
          </>
        )}
      </LegendStyles>

      <InnerGridStyles>
        {getVisibleQuestions().map((questionIndex) => (
          <GridItem
            key={`grid-item-${questionIndex}`} // More descriptive key
            data-test={`Grid Item ${questionIndex}`}
            $background={gridItemBackgroundColor(questionIndex, bookmarks, answered)}
            $selected={questionIndex === session.index}
            onClick={() => onClickGridItem(questionIndex)}
          >
            {questionIndex + 1}
          </GridItem>
        ))}
      </InnerGridStyles>
    </GridStyles>
  )
}

export default GridComponent

const LegendItem: React.FC<GridTagProps> = ({ type }) => {
  return (
    <LegendItemStyles>
      <div className={type} />
      <div>{translate(`nav.grid.${type}`)}</div>
    </LegendItemStyles>
  )
}

export interface GridProps {
  open: boolean
  show: QuestionFilter
}

export interface GridTagProps {
  type: GridTagTypes
}

export interface GridItemStylesProps extends ThemedStyles {
  $background: string
  $selected: boolean
}
