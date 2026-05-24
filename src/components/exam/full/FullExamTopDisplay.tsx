import type { ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import BookmarkButton from '../shared/BookmarkButton'
import SaveButtonWithReminder from '../shared/SaveButtonWithReminder'
import { translate } from '../../../utils/translation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'
import useFullExamLabel from '../../../hooks/useFullExamLabel'

const TopDisplayStyles = styled.div`
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

const QuestionTextStyles = styled.div<ThemedStyles>`
  display: flex;
  align-items: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.grey[10]};
`

const FullExamTopDisplay: React.FC<TopDisplayProps> = ({ questionCount, isReview = false }) => {
  const { index, dirtyQuestions } = useExamSessionCore()
  const { examId, isSyncing, syncProgress } = useFullExamSession()
  const examLabel = useFullExamLabel(examId ?? 0)

  const question = translate('content.top-display.question', [index + 1, questionCount])
  const examChipLabel = translate('content.top-display.exam')

  return (
    <ExamHeader id="exam-header">
      <TopDisplayStyles id="top-display">
        <QuestionTextStyles id="question-text">{question}</QuestionTextStyles>

        {!isReview && (
          <RightControls>
            <SaveButtonWithReminder
              isSyncing={isSyncing}
              dirtyCount={Object.keys(dirtyQuestions).length}
              syncProgress={syncProgress}
            />
            <BookmarkButton />
          </RightControls>
        )}
      </TopDisplayStyles>
      <ChipRow>
        <CategoryExamChip>
          {examChipLabel}: {examLabel ?? 'undefined exam label'}
        </CategoryExamChip>
      </ChipRow>
    </ExamHeader>
  )
}

export default FullExamTopDisplay

export interface TopDisplayProps {
  questionCount: number
  isReview?: boolean
}
