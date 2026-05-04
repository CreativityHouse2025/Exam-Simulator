import type { ExamType, ThemedStyles, RevisionExamOptions } from '../../types'

import React from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { SessionDataContext, SessionExamContext } from '../../contexts'

export const MainStyles = styled.main<MainStylesProps>`
  width: 100%;
  overflow: hidden;
  background: white;
`

const ContentStyles = styled.div<ThemedStyles>`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ open, onRevision }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)
  const { examType } = React.useContext(SessionDataContext)

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">{finished && summary ? <Summary onRevision={onRevision} examType={examType as ExamType} /> : <ExamComponent isReview={finished} />}</ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  open: boolean
  onRevision: (options: RevisionExamOptions) => void
}

export interface MainStylesProps {
  $open: boolean
}
