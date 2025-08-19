import type { Exam } from '../../types'

import React from 'react'
import styled from 'styled-components'
import { Slide } from '../../styles/Slide'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'
import { LangContext } from '../../settings'
import { SessionDataContext, SessionNavigationContext } from '../../session'

const ExamStyles = styled.div`
  width: 100%;
  height: calc(100vh - 14rem);
  overflow-x: hidden;
  overflow-y: auto;
`

const ExamComponent: React.FC<ExamProps> = ({ exam, isReview }) => {
  const { index } = React.useContext(SessionNavigationContext)
  const { answers } = React.useContext(SessionDataContext)
  const { dir } = React.useContext(LangContext)

  const question = exam.test[index]

  return (
    <ExamStyles id="exam" dir={dir}>
      <TopDisplay exam={exam} />

      {!isReview && <Progress exam={exam} />}

      <Slide id="question-slide" key={index} direction="right">
        <Question {...question} />

        <MultipleChoice exam={exam} isReview={isReview} />

        {isReview && (
          <Slide direction="bottom">
            <Explanation question={question} answer={answers[index]} />
          </Slide>
        )}
      </Slide>
    </ExamStyles>
  )
}

export default ExamComponent

export interface ExamProps {
  exam: Exam
  isReview: boolean
}
