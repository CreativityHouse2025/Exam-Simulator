import React from 'react'
import styled from 'styled-components'
import FullExamTopDisplay from './FullExamTopDisplay'
import Question from '../shared/Question'
import MultipleChoice from '../shared/MultipleChoice'
import Progress from '../shared/Progress'
import Explanation from '../shared/Explanation'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const ExamStyles = styled.div`
  width: 100%;
  height: 100%;
`

const FullExamContent: React.FC<FullExamContentProps> = ({ isReview }) => {
  const { exam, index: questionIndex, selectedOriginalIndices } = useExamSessionCore()
  const question = exam[questionIndex]
  const userAnswer = selectedOriginalIndices[questionIndex] || []

  return (
    <ExamStyles id="exam">
      <FullExamTopDisplay questionCount={exam.length} isReview={isReview} />

      {!isReview && <Progress questionCount={exam.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} />

      {isReview && <Explanation question={question} userAnswer={userAnswer} />}
    </ExamStyles>
  )
}

export default FullExamContent

export interface FullExamContentProps {
  isReview: boolean
}
