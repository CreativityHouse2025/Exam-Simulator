import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { SessionExamContext } from '../../session'
import { LangContext } from '../../settings'

const ContentStyles = styled.div<ThemedStyles>`
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  padding-right: 25rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ exam }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)
  const lang = React.useContext(LangContext)

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <ContentStyles id="content">
      {finished && summary ? <Summary exam={exam} /> : <ExamComponent exam={exam} lang={lang} isReview={finished} />}
    </ContentStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  exam: Exam
  session: Session
}
