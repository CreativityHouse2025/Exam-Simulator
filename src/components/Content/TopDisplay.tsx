import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import BookmarkButton from './Bookmark'
import { translate } from '../../utils/translation'
import {  SessionExamContext, SessionNavigationContext } from '../../contexts'
import useCategoryLabel from '../../hooks/useCategoryLabel'

export const TopDisplayStyles = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 100%;
`

const ExamHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 3rem;
`

const CategoryLabel = styled.div<ThemedStyles>`
  padding: 0.6rem 1rem;
  font-family: ${({ theme }) => theme.fontFamily};
  background-color: ${({ theme }) => theme.grey[1]};
  color: ${({ theme }) => theme.grey[10]};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.5rem);
  font-weight: 600;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  width: auto;
`;

export const QuestionTextStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

const TopDisplayComponent: React.FC<TopDisplayProps> = ({ questionCount, isReview = false }) => {
  const { index } = React.useContext(SessionNavigationContext)
  const { categoryId } = React.useContext(SessionExamContext)

  let categoryLabel: string | undefined = useCategoryLabel(categoryId);
  

  const question = React.useMemo(
    () => translate('content.top-display.question', [index + 1, questionCount]),
    [document.documentElement.lang, translate, index, questionCount]
  )

  const category = React.useMemo(
    () => translate('content.summary.category'),
    [document.documentElement.lang, translate]
  )

  return (
    <ExamHeader id="exam-header">
      <TopDisplayStyles id="top-display">
        <QuestionTextStyles id="question-text">{question}</QuestionTextStyles>

        {!isReview && <BookmarkButton />}
      </TopDisplayStyles>
      <CategoryLabel>
        {category}: {categoryLabel ?? "undefined category"}
      </CategoryLabel>
    </ExamHeader>
  )
}

export default TopDisplayComponent

export interface TopDisplayProps {
  questionCount: number
  isReview?: boolean
}
