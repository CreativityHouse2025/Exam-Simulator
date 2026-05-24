import type { Results, ThemedStyles } from '../../../types'

import React from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import SummaryRow from '../shared/SummaryRow'
import { formatDate, formatTimer } from '../../../utils/format'
import { translate } from '../../../utils/translation'
import useResults from '../../../hooks/useResults'

const TitleStyles = styled.div<ThemedStyles>`
  justify-self: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.black};
`

const TopColumnStyles = styled.div`
  display: grid;
  grid-template-rows: repeat(5, auto);
  width: 100%;
`

const ColumnStyles = styled.div`
  padding-top: 5rem;
  display: grid;
  grid-template-rows: repeat(4, auto);
  width: 100%;
`

const SummaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4rem;
`

const RestartButton = styled.button<ThemedStyles>`
  background: ${({ theme }) => theme.primary};
  color: white;
  border: none;
  padding: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 200px;
  width: 100%;
  max-width: 300px;
  display: inline-block;
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  gap: 1rem;
`

const DomainExamSummary: React.FC = () => {
  const {
    pass,
    passPercent,
    score,
    elapsedTime,
    date,
    sourceLabel,
    sourceType,
    correctCount,
    incorrectCount,
    incompleteCount,
    totalQuestions,
  } = useResults() as Results

  const translated = {
    title: translate('content.summary.title'),
    status:
      pass !== undefined
        ? translate(`content.summary.${pass ? 'pass' : 'fail'}`)
        : '',
    home: translate('content.summary.home'),
  }

  const navigate = useNavigate()

  return (
    <SummaryContainer id="summary">
      <TitleStyles id="title">{translated.title}</TitleStyles>

      <div id="columns" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TopColumnStyles id="column">
          {pass !== undefined && (
            <SummaryRow type="status" value={translated.status} status={pass} isStatus />
          )}

          {passPercent && (
            <SummaryRow type="passing" value={`${passPercent} %`} status={pass} />
          )}

          <SummaryRow type="time" value={formatTimer(elapsedTime)} status={pass} />
          <SummaryRow type="date" value={formatDate(date)} status={pass} />
          {sourceLabel && <SummaryRow type={sourceType} value={sourceLabel} status={pass} />}
        </TopColumnStyles>

        <ColumnStyles id="column">
          <SummaryRow type="score" value={`${score} %`} status={pass} />
          <SummaryRow type="correct" value={`${correctCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incorrect" value={`${incorrectCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incomplete" value={`${incompleteCount} / ${totalQuestions}`} status={pass} />
        </ColumnStyles>
      </div>

      <ButtonsContainer>
        <RestartButton id="restart-button" title="Homepage" className="no-select" onClick={() => navigate('/')}>
          {translated.home}
        </RestartButton>
      </ButtonsContainer>
    </SummaryContainer>
  )
}

export default DomainExamSummary
