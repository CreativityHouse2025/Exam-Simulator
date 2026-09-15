import React from 'react'
import RevisionTopDisplay from './RevisionTopDisplay'
import Question from '../shared/Question'
import MultipleChoice from '../shared/MultipleChoice'
import Progress from '../shared/Progress'
import Explanation from '../shared/Explanation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const RevisionContent: React.FC<RevisionContentProps> = ({ isReview }) => {
  const { exam, index: questionIndex, selectedOriginalIndices } = useExamSessionCore()
  const question = exam[questionIndex]
  const userAnswer = selectedOriginalIndices[questionIndex] || []

  return (
    <div id="exam" className="w-full h-full">
      <RevisionTopDisplay questionCount={exam.length} isReview={isReview} />

      {!isReview && <Progress questionCount={exam.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} />

      {isReview && <Explanation question={question} userAnswer={userAnswer} />}
    </div>
  )
}

export default RevisionContent

export interface RevisionContentProps {
  isReview: boolean
}
