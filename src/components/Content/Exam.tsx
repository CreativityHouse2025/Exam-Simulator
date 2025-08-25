import React from 'react'
import styled from 'styled-components'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'
import { ExamContext, SessionDataContext, SessionNavigationContext } from '../../contexts'

const ExamStyles = styled.div`
  width: 100%;
  height: 100%;
`

const ExamComponent: React.FC<ExamProps> = ({ isReview }) => {
  const { index } = React.useContext(SessionNavigationContext)
  const { answers } = React.useContext(SessionDataContext)
  const exam = React.useContext(ExamContext)

  const question = exam[index]
  const answer = answers[index]

  return (
    <ExamStyles id="exam">
      <TopDisplay questionCount={exam.length} />

      {!isReview && <Progress questionCount={exam.length} />}

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
