import type { Exam, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import ExamComponent from './Exam'
import Summary from './Summary'
import { SessionExamContext } from '../../session'

export const MainStyles = styled.main<MainStylesProps>`
  height: 100%;
  overflow: hidden;
  background: white;
`

const ContentStyles = styled.div<ThemedStyles>`
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  transition: 0.3s;
`

const ContentComponent: React.FC<ContentProps> = ({ exam, open }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open} dir={document.documentElement.dir}>
      <ContentStyles id="content">
        {finished && summary ? <Summary exam={exam} /> : <ExamComponent exam={exam} isReview={finished} />}
      </ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  exam: Exam
  open: boolean
}

export interface MainStylesProps {
  $open: boolean
}
