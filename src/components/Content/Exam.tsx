import type { Exam } from '../../types'
import type { Session } from '../../session'
import type { Lang } from '../../settings'

import React from 'react'
import styled from 'styled-components'
import { Slide } from '../../styles/Slide'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import Explanation from './Explanation'

const ExamStyles = styled.div`
  width: 100%;
  height: calc(100vh - 14rem);
  overflow-x: hidden;
  overflow-y: auto;
`

const ExamComponent: React.FC<ExamProps> = ({ exam, session, lang, isReview }) => {
  const question = exam.test[session.index]

  return (
    <ExamStyles id="exam" dir={lang.dir}>
      <TopDisplay exam={exam} session={session} lang={lang} />

      {!isReview && <Progress exam={exam} session={session} />}

      <Slide id="question-slide" key={session.index} direction="right">
        <Question {...question} />

        <MultipleChoice exam={exam} session={session} lang={lang} isReview={isReview} />

        {isReview && (
          <Slide direction="bottom">
            <Explanation question={question} answer={session.answers[session.index]} lang={lang} />
          </Slide>
        )}
      </Slide>
    </ExamStyles>
  )
}

export default ExamComponent

export interface ExamProps {
  exam: Exam
  session: Session
  lang: Lang
  isReview: boolean
}
