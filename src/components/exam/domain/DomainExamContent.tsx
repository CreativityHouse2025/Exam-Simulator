import React from 'react'
import styled from 'styled-components'
import DomainExamTopDisplay from './DomainExamTopDisplay'
import Question from '../shared/Question'
import MultipleChoice from '../shared/MultipleChoice'
import Progress from '../shared/Progress'
import Explanation from '../shared/Explanation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const ExamStyles = styled.div`
  width: 100%;
  height: 100%;
`

const DomainExamContent: React.FC<DomainExamContentProps> = ({ isReview }) => {
  const { exam, index: questionIndex, selectedOriginalIndices } = useExamSessionCore()
  const question = exam[questionIndex]
  const userAnswer = selectedOriginalIndices[questionIndex] || []

  const [isAnswerRevealed, setIsAnswerRevealed] = React.useState(false)
  const explanationRef = React.useRef<HTMLDivElement | null>(null)

  // Reset reveal whenever the user navigates to a different question.
  React.useEffect(() => {
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

  const shouldShowExplanation = isReview || (!isReview && isAnswerRevealed)

  return (
    <ExamStyles id="exam">
      <DomainExamTopDisplay
        questionCount={exam.length}
        isReview={isReview}
        isAnswerRevealed={isAnswerRevealed}
        onToggleAnswerReveal={toggleAnswerReveal}
      />

      {!isReview && <Progress questionCount={exam.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} isAnswerRevealed={isAnswerRevealed} />

      {shouldShowExplanation && (
        <Explanation
          ref={explanationRef}
          question={question}
          userAnswer={userAnswer}
          onHide={!isReview ? toggleAnswerReveal : undefined}
        />
      )}
    </ExamStyles>
  )
}

export default DomainExamContent

export interface DomainExamContentProps {
  isReview: boolean
}
