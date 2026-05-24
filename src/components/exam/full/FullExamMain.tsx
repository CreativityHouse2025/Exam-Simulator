import React from 'react'
import styled from 'styled-components'
import FullExamContent from './FullExamContent'
import FullExamSummary from './FullExamSummary'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const MainStyles = styled.main<{ $open: boolean }>`
  width: 100%;
  overflow: hidden;
  background: white;
`

const ContentStyles = styled.div`
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

const FullExamMain: React.FC<{ open: boolean }> = ({ open }) => {
  const { examState, reviewState } = useExamSessionCore()
  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">
        {finished && summary ? <FullExamSummary /> : <FullExamContent isReview={finished} />}
      </ContentStyles>
    </MainStyles>
  )
}

export default FullExamMain
