import type { Exam, ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import SummaryRow from './SummaryRow'
import { translate } from '../../settings'
import { formatDate, formatTimer } from '../../utils/format'
import { SessionDataContext, SessionTimerContext } from '../../session'

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

const SummaryComponent: React.FC<SummaryProps> = ({ exam }) => {
  const { answers } = React.useContext(SessionDataContext)
  const { time } = React.useContext(SessionTimerContext)

  const questions = React.useMemo(() => {
    // @ts-expect-error
    const qArr: { incomplete: any[]; completed: any[]; correct: any[]; incorrect: any[] } = {
      incomplete: answers.filter((a) => a === null),
      completed: answers.filter((a) => a !== null),
      correct: answers.filter((a, i) => a === exam.test[i].answer)
    }

    qArr.incorrect = qArr.completed.filter((a, i) => a !== exam.test[i].answer)
    return qArr
  }, [exam, answers])

  const score = Math.round((questions.correct.length / exam.test.length) * 100)
  const status = score >= exam.pass
  const date = new Date()
  const elapsed = exam.time * 60 - time

  const [title, _status] = React.useMemo(
    () => [translate('content.review.summary.title'), translate(`content.review.summary.${status ? 'pass' : 'fail'}`)],
    [document.documentElement.lang, translate, status]
  )

  return (
    <div id="summary">
      <TitleStyles id="title">{title}</TitleStyles>

      <div id="columns">
        <ColumnStyles id="column">
          <SummaryRow type="status" value={_status} status={status} isStatus />
          <SummaryRow type="passing" value={`${exam.pass} %`} status={status} />
          <SummaryRow type="time" value={formatTimer(elapsed)} status={status} />
          <SummaryRow type="date" value={formatDate(date)} status={status} />
        </ColumnStyles>

        <ColumnStyles id="column">
          <SummaryRow type="score" value={`${score} %`} status={status} />
          <SummaryRow type="correct" value={`${questions.correct.length} / ${exam.test.length}`} status={status} />
          <SummaryRow type="incorrect" value={`${questions.incorrect.length} / ${exam.test.length}`} status={status} />
          <SummaryRow
            type="incomplete"
            value={`${questions.incomplete.length} / ${exam.test.length}`}
            status={status}
          />
        </ColumnStyles>
      </div>
    </div>
  )
}

export default SummaryComponent

export interface SummaryProps {
  exam: Exam
}
