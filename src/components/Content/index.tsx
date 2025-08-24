import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import Exam from './Exam'
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

const ContentComponent: React.FC<ContentProps> = ({ open }) => {
  const { examState, reviewState } = React.useContext(SessionExamContext)

  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">{finished && summary ? <Summary /> : <Exam isReview={finished} />}</ContentStyles>
    </MainStyles>
  )
}

export default ContentComponent

export interface ContentProps {
  open: boolean
}

export interface MainStylesProps {
  $open: boolean
}
