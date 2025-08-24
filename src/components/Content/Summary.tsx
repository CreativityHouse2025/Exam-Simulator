import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import SummaryRow from './SummaryRow'
import { translate } from '../../settings'
import { formatDate, formatTimer } from '../../utils/format'
import { ExamContext } from '../../exam'
import { SessionDataContext, SessionTimerContext } from '../../session'

const passPercent = 85

export const TitleStyles = styled.div<ThemedStyles>`
  justify-self: center;
  padding-top: 5rem;
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

export const ColumnStyles = styled.div`
  padding-top: 5rem;
  display: grid;
  grid-template-rows: repeat(4, 3rem);
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
  const { answers } = React.useContext(SessionDataContext)
  const { maxTime, time } = React.useContext(SessionTimerContext)
  const exam = React.useContext(ExamContext)

  const questions = React.useMemo(() => {
    // @ts-expect-error
    const qArr: { incomplete: any[]; completed: any[]; correct: any[]; incorrect: any[] } = {
      incomplete: answers.filter((a) => a === null),
      completed: answers.filter((a) => a !== null),
      correct: answers.filter((a, i) => a === exam[i].answer)
    }

    qArr.incorrect = qArr.completed.filter((a, i) => a !== exam[i].answer)
    return qArr
  }, [exam, answers])

  const onRestart = React.useCallback(() => {
    window.location.reload()
  }, [])

  const score = Math.round((questions.correct.length / exam.length) * 100)
  const status = score >= passPercent
  const date = new Date()
  const elapsed = maxTime * 60 - time

  const [title, _status, home] = React.useMemo(
    () => [
      translate('content.review.summary.title'),
      translate(`content.review.summary.${status ? 'pass' : 'fail'}`),
      translate('content.review.summary.home')
    ],
    [document.documentElement.lang, translate, status]
  )

  return (
    <div id="summary">
      <TitleStyles id="title">{title}</TitleStyles>

      <div id="columns">
        <ColumnStyles id="column">
          <SummaryRow type="status" value={_status} status={status} isStatus />
          <SummaryRow type="passing" value={`${passPercent} %`} status={status} />
          <SummaryRow type="time" value={formatTimer(elapsed)} status={status} />
          <SummaryRow type="date" value={formatDate(date)} status={status} />
        </ColumnStyles>

        <ColumnStyles id="column">
          <SummaryRow type="score" value={`${score} %`} status={status} />
          <SummaryRow type="correct" value={`${questions.correct.length} / ${exam.length}`} status={status} />
          <SummaryRow type="incorrect" value={`${questions.incorrect.length} / ${exam.length}`} status={status} />
          <SummaryRow type="incomplete" value={`${questions.incomplete.length} / ${exam.length}`} status={status} />
        </ColumnStyles>
      </div>

      <RestartButton id="restart-button" onClick={onRestart}>
        {home}
      </RestartButton>
    </div>
  )
}

export default SummaryComponent
