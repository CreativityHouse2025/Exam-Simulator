import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import BookmarkButton from './Bookmark'
import { translate } from '../../utils/translation'
import { useSessionNavigation, useSessionExam, useSessionData, useSessionControl } from '../../contexts'
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
  margin-right: 3rem;
  gap: 1rem;
`

const SaveButton = styled.button<ThemedStyles>`
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.6rem;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: calc(${({ theme }) => theme.fontSize} + 0.5rem);
  font-weight: 600;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => lighten(0.05, theme.primary)};
  }

  &:disabled {
    background: ${({ theme }) => theme.grey[3]};
    color: ${({ theme }) => theme.grey[7]};
    cursor: not-allowed;
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
  const { isSyncing, dirtyQuestions, examType } = useSessionData()
  const { syncProgress } = useSessionControl()

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
    save: translate('content.top-display.save'),
  }

  const hasDirtyQuestions = Object.keys(dirtyQuestions).length > 0
  // Save button is only meaningful during an active in-progress exam —
  // not in review mode (post-completion) and not in revision sessions (ephemeral, not persisted).
  const showSaveButton = !isReview && examType !== 'revision'

  return (
    <ExamHeader id="exam-header">
      <TopDisplayStyles id="top-display">
        <QuestionTextStyles id="question-text">{question}</QuestionTextStyles>

        {!isReview && (
          <RightControls>
            {showSaveButton && (
              <SaveButton
                onClick={syncProgress}
                disabled={isSyncing || !hasDirtyQuestions}
                aria-label={translations.save}
              >
                {translations.save}
              </SaveButton>
            )}
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
