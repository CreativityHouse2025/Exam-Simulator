import React from 'react'
import BookmarkButton from '../shared/BookmarkButton'
import SaveButtonWithReminder from '../shared/SaveButtonWithReminder'
import RevealAnswerButton from './RevealAnswerButton'
import { translate } from '../../../utils/translation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useDomainExamSession } from '../../../hooks/examSession/useDomainExamSession'
import useCategoryLabel from '../../../hooks/useCategoryLabel'

const DomainExamTopDisplay: React.FC<TopDisplayProps> = ({
  questionCount,
  isReview = false,
  isAnswerRevealed,
  onToggleAnswerReveal,
}) => {
  const { index, dirtyQuestions } = useExamSessionCore()
  const { categoryId, isSyncing, syncProgress } = useDomainExamSession()
  const categoryLabel = useCategoryLabel(categoryId)

  const question = translate('content.top-display.question', [index + 1, questionCount])
  const categoryChipLabel = translate('content.top-display.category')

  return (
    <div id="exam-header" className="flex flex-col items-start justify-center gap-1.25 mb-7.5">
      <div id="top-display" className="flex items-center justify-between min-w-full">
        <div id="question-text" className="flex items-center text-4xl font-bold text-grey-950">{question}</div>

        {!isReview && (
          <div className="flex items-center justify-end flex-wrap gap-1.25 me-1.25 md:gap-2.5 md:me-5">
            <SaveButtonWithReminder
              isSyncing={isSyncing}
              dirtyCount={Object.keys(dirtyQuestions).length}
              syncProgress={syncProgress}
            />
            <RevealAnswerButton
              isAnswerRevealed={isAnswerRevealed}
              onToggleAnswerReveal={onToggleAnswerReveal}
            />
            <BookmarkButton />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="py-1.5 px-2.5 font-sans bg-grey-100 text-grey-950 text-base font-semibold rounded-3xl border border-grey-200 w-auto">
          {categoryChipLabel}: {categoryLabel ?? 'undefined category label'}
        </div>
      </div>
    </div>
  )
}

export default DomainExamTopDisplay

export interface TopDisplayProps {
  questionCount: number
  isReview?: boolean
  isAnswerRevealed: boolean
  onToggleAnswerReveal: () => void
}
