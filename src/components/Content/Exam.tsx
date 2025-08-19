import type { Exam } from '../../types'

import React from 'react'
import styled from 'styled-components'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'
import { SessionDataContext, SessionNavigationContext } from '../../session'

const ExamStyles = styled.div`
  width: 100%;
`

const ExamComponent: React.FC<ExamProps> = ({ exam, isReview }) => {
  const { index } = React.useContext(SessionNavigationContext)
  const { answers } = React.useContext(SessionDataContext)

  const question = exam.test[index]

  return (
    <ExamStyles id="exam">
      <TopDisplay exam={exam} />

      {!isReview && <Progress exam={exam} />}

      <Question {...question} />

      <MultipleChoice exam={exam} isReview={isReview} />

      {isReview && <Explanation question={question} answer={answers[index]} />}
    </ExamStyles>
  )
}

export default ExamComponent

export interface ExamProps {
  exam: Exam
  isReview: boolean
}
