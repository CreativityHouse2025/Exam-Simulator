import React from 'react'
import styled from 'styled-components'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'
import { useSessionNavigation, useSessionData, useExam } from '../../contexts'

const ExamStyles = styled.div`
  width: 100%;
  height: 100%;
`

const ExamComponent: React.FC<ExamProps> = ({ isReview }) => {
  const { index: questionIndex } = useSessionNavigation()
  const { selectedOriginalIndices } = useSessionData()
  const { exam } = useExam()
  const questions = exam!

  const question = questions[questionIndex]
  const userAnswer = selectedOriginalIndices[questionIndex] || []

  return (
    <ExamStyles id="exam">
      <TopDisplay questionCount={questions.length} />

      {!isReview && <Progress questionCount={questions.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} />

      {isReview && <Explanation question={question} userAnswer={userAnswer} />}
    </ExamStyles>
  )
}

export default ExamComponent

export interface ExamProps {
  isReview: boolean
}
