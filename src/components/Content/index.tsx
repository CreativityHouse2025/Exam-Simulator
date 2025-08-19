import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { SessionExamContext } from '../../session'

export const MainStyles = styled.main<MainStylesProps>`
  position: fixed;
  top: 5rem;
  bottom: 5rem;
  right: ${({ $open }) => ($open ? '-24rem' : '-5rem')};
  z-index: 2;
  width: 100%;
  height: calc(100vh - 10rem);
  transition: 0.3s;
  background: white;
`

const ContentStyles = styled.div<ThemedStyles>`
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  padding-right: 25rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ exam, open }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">
        {finished && summary ? <Summary exam={exam} /> : <ExamComponent exam={exam} isReview={finished} />}
      </ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  exam: Exam
  session: Session
  open: boolean
}

export interface MainStylesProps {
  $open: boolean
}
