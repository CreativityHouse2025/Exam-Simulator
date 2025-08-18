import type { Exam, ThemedStyles } from '../../types'
import type { Lang } from '../../settings'

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

const TopDisplayComponent: React.FC<TopDisplayProps> = ({ exam, lang, isReview = false }) => {
  const { index } = React.useContext(SessionNavigationContext)

  const question = React.useMemo(
    () => translate('content.exam.top-display.question', [index + 1, exam.test.length]),
    [document.documentElement.lang, translate, index, exam.test.length]
  )

  return (
    <TopDisplayStyles id="top-display">
      <QuestionTextStyles id="question-text" dir={lang.dir}>
        {question}
      </QuestionTextStyles>

      {!isReview && <BookmarkButton />}
    </TopDisplayStyles>
  )
}

export default TopDisplayComponent

export interface TopDisplayProps {
  exam: Exam
  lang: Lang
  isReview?: boolean
}
