import React from 'react'
import FullExamTopDisplay from './FullExamTopDisplay'
import Question from '../shared/Question'
import MultipleChoice from '../shared/MultipleChoice'
import Progress from '../shared/Progress'
import Explanation from '../shared/Explanation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const FullExamContent: React.FC<FullExamContentProps> = ({ isReview }) => {
  const { exam, index: questionIndex, selectedOriginalIndices } = useExamSessionCore()
  const question = exam[questionIndex]
  const userAnswer = selectedOriginalIndices[questionIndex] || []

  return (
    <div id="exam" className="w-full h-full">
      <FullExamTopDisplay questionCount={exam.length} isReview={isReview} />

      {!isReview && <Progress questionCount={exam.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} />

      {isReview && <Explanation question={question} userAnswer={userAnswer} />}
    </div>
  )
}

export default FullExamContent

export interface FullExamContentProps {
  isReview: boolean
}
