import type { DisclosedAttemptQuestion } from '../../apiTypes'

import React from 'react'
import ExamTopDisplay from './ExamTopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'
import { useExamSession } from '../../hooks/examSession/useExamSession'

const ExamContent: React.FC<ExamContentProps> = ({ isReview }) => {
  const { questions, question, index: questionIndex, selectedChoices, canReveal } = useExamSession()
  const userAnswer = selectedChoices[questionIndex] || []

  const [isAnswerRevealed, setIsAnswerRevealed] = React.useState(false)
  const explanationRef = React.useRef<HTMLDivElement | null>(null)

  // Reset reveal whenever the user navigates to a different question.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing, unrelated to this change
    setIsAnswerRevealed(false)
  }, [questionIndex])

  // Auto-scroll the explanation into view after the user reveals it,
  // so they don't have to manually scroll down to see it.
  React.useEffect(() => {
    if (isAnswerRevealed && explanationRef.current) {
      explanationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isAnswerRevealed])

  const toggleAnswerReveal = React.useCallback(() => {
    setIsAnswerRevealed((previousValue) => !previousValue)
  }, [])

  // canReveal (ExamConfig.canRevealAnswers) means the backend already disclosed this session's
  // questions from the moment it started (questionService.getQuestions) — the button only
  // toggles LOCAL visibility of data already in memory, never a fetch. A full exam's config sets
  // this false, so it never gets the button; domain and revision both set it true.
  const canToggleReveal = canReveal && !isReview
  const shouldShowExplanation = isReview || (canToggleReveal && isAnswerRevealed)

  // Only reachable with an empty question set — hooks above stay unconditional.
  if (!question) return null

  return (
    <div id="exam" className="w-full h-full">
      <ExamTopDisplay
        questionCount={questions.length}
        isReview={isReview}
        isAnswerRevealed={isAnswerRevealed}
        onToggleAnswerReveal={canToggleReveal ? toggleAnswerReveal : undefined}
      />

      {!isReview && <Progress questionCount={questions.length} />}

      <Question text={question.text} />

      <MultipleChoice isReview={isReview} isAnswerRevealed={isAnswerRevealed} />

      {shouldShowExplanation && (
        <Explanation
          ref={explanationRef}
          // Disclosed whenever this renders: isReview is only true once completed (the backend
          // always discloses by then), and canToggleReveal is only true when canReveal already
          // means the backend disclosed this session's content from the start.
          question={question as DisclosedAttemptQuestion}
          userAnswer={userAnswer}
          onHide={!isReview ? toggleAnswerReveal : undefined}
        />
      )}
    </div>
  )
}

export default ExamContent

export interface ExamContentProps {
  isReview: boolean
}
