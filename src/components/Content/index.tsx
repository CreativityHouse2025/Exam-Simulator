import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React, { useContext } from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { LangContext } from '../../settings'

const ContentStyles = styled.div<ThemedStyles>`
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  padding-right: 25rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ exam, session }) => {
  const lang = useContext(LangContext)

  const finished = session.examState === 'completed'
  const summary = session.reviewState === 'summary'

  return (
    <ContentStyles id="content">
      {finished && summary ? (
        <Summary exam={exam} session={session} />
      ) : (
        <ExamComponent exam={exam} session={session} lang={lang} isReview={finished} />
      )}
    </ContentStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  exam: Exam
  session: Session
}
