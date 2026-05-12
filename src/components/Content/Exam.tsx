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
  const { index } = useSessionNavigation()
  const { answers } = useSessionData()
  const { exam } = useExam()
  const questions = exam!

  const question = questions[index]
  const answer = answers[index] || []

  return (
    <ExamStyles id="exam">
      <TopDisplay questionCount={questions.length} />

      {!isReview && <Progress questionCount={questions.length} />}

      <Question {...question} />

      <MultipleChoice isReview={isReview} />

      {isReview && <Explanation question={question} answer={answer} />}
    </ExamStyles>
  )
}

export default ExamComponent

export interface ExamProps {
  isReview: boolean
}
