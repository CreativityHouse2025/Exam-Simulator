import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import BookmarkButton from './Bookmark'
import { translate } from '../../settings'
import { SessionNavigationContext } from '../../session'

export const TopDisplayStyles = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`

export const QuestionTextStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

const TopDisplayComponent: React.FC<TopDisplayProps> = ({ questionCount, isReview = false }) => {
  const { index } = React.useContext(SessionNavigationContext)

  const question = React.useMemo(
    () => translate('content.exam.top-display.question', [index + 1, questionCount]),
    [document.documentElement.lang, translate, index, questionCount]
  )

  return (
    <TopDisplayStyles id="top-display">
      <QuestionTextStyles id="question-text">{question}</QuestionTextStyles>

      {!isReview && <BookmarkButton />}
    </TopDisplayStyles>
  )
}

export default TopDisplayComponent

export interface TopDisplayProps {
  questionCount: number
  isReview?: boolean
}
