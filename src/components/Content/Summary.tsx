import type { Results, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import SummaryRow from './SummaryRow'
import { formatDate, formatTimer } from '../../utils/format'
import { translate } from '../../utils/translation'
import useSettings from '../../hooks/useSettings'
import useResults from '../../hooks/useResults'

export const TitleStyles = styled.div<ThemedStyles>`
  justify-self: center;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

export const TopColumnStyles = styled.div`
  padding-top: 5rem;
  display: grid;
  grid-template-rows: repeat(5, auto);
`

export const ColumnStyles = styled.div`
  padding-top: 5rem;
  display: grid;
  grid-template-rows: repeat(4, auto);
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
  min-width: 300px;
  margin: 3rem auto 2rem auto;
  margin-top: 7rem;
  display: block;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

const SummaryComponent: React.FC = () => {
  const { settings } = useSettings()
  const langCode = settings.language

  const {
    pass,
    passPercent,
    score,
    elapsedTime,
    date,
    categoryLabel,
    correctCount,
    incorrectCount,
    incompleteCount,
    totalQuestions
  } = useResults(true) as Results // use true because it will only render when exam is finished

  const translated = React.useMemo(
    () => ({
      title: translate('content.summary.title'),
      status:
        pass !== undefined
          ? translate(`content.summary.${pass ? 'pass' : 'fail'}`)
          : '',
      home: translate('content.summary.home')
    }),
    [langCode, pass]
  )

  const onRestart = React.useCallback(() => window.location.reload(), [])

  return (
    <div id="summary">
      <TitleStyles id="title">{translated.title}</TitleStyles>

      <div id="columns">
        <TopColumnStyles id="column">
          {pass !== undefined && (
            <SummaryRow type="status" value={translated.status} status={pass} isStatus />
          )}

          {passPercent && (
            <SummaryRow type="passing" value={`${passPercent} %`} status={pass} />
          )}

          <SummaryRow type="time" value={formatTimer(elapsedTime)} status={pass} />
          <SummaryRow type="date" value={formatDate(date)} status={pass} />
          <SummaryRow type="category" value={categoryLabel} status={pass} />
        </TopColumnStyles>

        <ColumnStyles id="column">
          <SummaryRow type="score" value={`${score} %`} status={pass} />
          <SummaryRow type="correct" value={`${correctCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incorrect" value={`${incorrectCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incomplete" value={`${incompleteCount} / ${totalQuestions}`} status={pass} />
        </ColumnStyles>
      </div>

      <RestartButton id="restart-button" className="no-select" onClick={onRestart}>
        {translated.home}
      </RestartButton>
    </div>
  )
}

export default SummaryComponent
