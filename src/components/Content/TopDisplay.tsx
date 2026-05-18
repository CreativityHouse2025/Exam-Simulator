import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import BookmarkButton from './Bookmark'
import SaveButtonWithReminder from './SaveButtonWithReminder'
import { translate } from '../../utils/translation'
import { useSessionNavigation, useSessionExam, useSessionData } from '../../contexts'
import useCategoryLabel from '../../hooks/useCategoryLabel'
import useFullExamLabel from '../../hooks/useFullExamLabel'

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

const CategoryExamChip = styled.div<ThemedStyles>`
  padding: 0.6rem 1rem;
  font-family: ${({ theme }) => theme.fontFamily};
  background-color: ${({ theme }) => theme.grey[1]};
  color: ${({ theme }) => theme.grey[10]};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.5rem);
  font-weight: 600;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.grey[2]};
  width: auto;
`

const ChipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const RightControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-inline-end: 0.5rem;

  @media (min-width: 768px) {
    gap: 1rem;
    margin-inline-end: 2rem;
  }
`

export const QuestionTextStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

const TopDisplayComponent: React.FC<TopDisplayProps> = ({ questionCount, isReview = false }) => {
  const { index } = useSessionNavigation()
  const { categoryId, examId } = useSessionExam()
  const { examType } = useSessionData()

  let categoryExamLabel: string | undefined;

  const isFullExam = examId !== null;

  if (isFullExam) {
    categoryExamLabel = useFullExamLabel(examId)
  } else {
    categoryExamLabel = useCategoryLabel(categoryId!);
  }

  const question = translate('content.top-display.question', [index + 1, questionCount])

  const translations = {
    category: translate('content.top-display.category'),
    exam: translate('content.top-display.exam'),
  }

  // Save button is only meaningful during an active in-progress exam —
  // not in review mode (post-completion) and not in revision sessions (ephemeral, not persisted).
  const showSaveButton = !isReview && examType !== 'revision'

  return (
    <ExamHeader id="exam-header">
      <TopDisplayStyles id="top-display">
        <QuestionTextStyles id="question-text">{question}</QuestionTextStyles>

        {!isReview && (
          <RightControls>
            {showSaveButton && <SaveButtonWithReminder />}
            <BookmarkButton />
          </RightControls>
        )}
      </TopDisplayStyles>
      <ChipRow>
        <CategoryExamChip>
          {isFullExam ? translations.exam : translations.category}: {categoryExamLabel ?? "undefined exam/category label"}
        </CategoryExamChip>
      </ChipRow>
    </ExamHeader>
  )
}

export default TopDisplayComponent

export interface TopDisplayProps {
  questionCount: number
  isReview?: boolean
}
