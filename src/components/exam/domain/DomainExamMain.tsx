import React from 'react'
import styled from 'styled-components'
import DomainExamContent from './DomainExamContent'
import DomainExamSummary from './DomainExamSummary'
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
  scrollbar-gutter: stable;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  align-items: center;
  padding: 2rem;
  transition: 0.3s;
`

const DomainExamMain: React.FC<{ open: boolean }> = ({ open }) => {
  const { examState, reviewState } = useExamSessionCore()
  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <MainStyles id="main" $open={open}>
      <ContentStyles id="content">
        {finished && summary ? <DomainExamSummary /> : <DomainExamContent isReview={finished} />}
      </ContentStyles>
    </MainStyles>
  )
}

export default DomainExamMain
