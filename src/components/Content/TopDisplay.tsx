import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React from 'react'
import styled from 'styled-components'
import BookmarkButton from './Bookmark'
import { type Lang, translate } from '../../settings'

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

const TopDisplayComponent: React.FC<TopDisplayProps> = ({ exam, session, lang, isReview = false }) => {
  return (
    <TopDisplayStyles id="top-display">
      <QuestionTextStyles id="question-text" dir={lang.dir}>
        {translate('content.exam.top-display.question', [session.index + 1, exam.test.length])}
      </QuestionTextStyles>

      {!isReview && <BookmarkButton session={session} />}
    </TopDisplayStyles>
  )
}

export default TopDisplayComponent

export interface TopDisplayProps {
  exam: Exam
  session: Session
  lang: Lang
  isReview?: boolean
}
