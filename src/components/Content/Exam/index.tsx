import React, { useContext } from 'react'
import styled from 'styled-components'
import { Slide } from '../../../styles/Slide'
import TopDisplay from './TopDisplay'
import Question from './Question'
import MultipleChoice from './MultipleChoice'
import Progress from './Progress'
import { ExamContext } from '../../../exam'
import { SessionContext } from '../../../session'
import { LangContext } from '../../../settings'

const TestStyles = styled.div`
  width: 100%;
  height: calc(100vh - 14rem);
  overflow-x: hidden;
  overflow-y: auto;
`

const ExamComponent: React.FC<object> = ({}) => {
  const exam = useContext(ExamContext)
  const session = useContext(SessionContext)
  const lang = useContext(LangContext)

  if (!exam) return null

  const question = exam.test[session.index]

  return (
    <TestStyles id="exam" dir={lang.dir}>
      <TopDisplay exam={exam} session={session} lang={lang} />

      <Progress exam={exam} session={session} />

      <Slide id="question-slide" key={session.index} direction="right">
        <Question {...question} />

        <MultipleChoice exam={exam} session={session} lang={lang} />
      </Slide>
    </TestStyles>
  )
}

export default ExamComponent
