import type { Exam, ThemedStyles } from '../../types'

import React, { useContext } from 'react'
import styled from 'styled-components'
import { formatDate, formatTimer } from '../../utils/format'
import { translate } from '../../settings'
import { SessionDataContext, SessionTimerContext } from '../../session'

const SummaryStyles = styled.div`
  width: 100%;
  height: calc(100vh - 14rem);
  display: grid;
  grid-template-rows: 8rem 2fr;
  justify-items: center;
  align-items: center;
`

export const TitleStyles = styled.div<ThemedStyles>`
  font: 4rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

export const ColumnStyles = styled.div`
  display: grid;
  grid-template-rows: repeat(4, 3rem);
  margin-bottom: 5rem;
  padding-left: 5rem;
`

export const RowStyles = styled.div<SummaryStylesProps>`
  display: grid;
  grid-template-columns: 15rem 15rem;
  .status {
    color: ${({ $status, theme }) => ($status ? theme.correct : theme.incorrect)};
  }
`

export const RowKeyStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  font-weight: 700;
  padding-left: 5rem;
  color: ${({ theme }) => theme.grey[10]};
`

export const RowValueStyles = styled.div<ThemedStyles>`
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
`

const SummaryComponent: React.FC<SummaryProps> = ({ exam }) => {
  const { answers } = useContext(SessionDataContext)
  const { time } = useContext(SessionTimerContext)

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
    <SummaryStyles id="summary">
      <TitleStyles id="title">{title}</TitleStyles>

      <div id="columns">
        <ColumnStyles id="column">
          {SummaryRow('status', _status, status, true)}
          {SummaryRow('passing', `${exam.pass} %`, status)}
          {SummaryRow('time', formatTimer(elapsed), status)}
          {SummaryRow('date', formatDate(date), status)}
        </ColumnStyles>

        <ColumnStyles id="column">
          {SummaryRow('score', `${score} %`, status)}
          {SummaryRow('correct', `${questions.correct.length} / ${exam.test.length}`, status)}
          {SummaryRow('incorrect', `${questions.incorrect.length} / ${exam.test.length}`, status)}
          {SummaryRow('incomplete', `${questions.incomplete.length} / ${exam.test.length}`, status)}
        </ColumnStyles>
      </div>
    </SummaryStyles>
  )
}

export default SummaryComponent

const SummaryRow = (key: string, value: string, status: boolean, isStatus?: boolean) => {
  const className = isStatus ? 'status' : ''

  const _key = React.useMemo(
    () => translate(`content.review.summary.${key}`),
    [document.documentElement.lang, translate, key]
  )

  return (
    <RowStyles data-test={`summary-row-${key}`} $status={status}>
      <RowKeyStyles>{_key}</RowKeyStyles>
      <RowValueStyles className={className}>{value}</RowValueStyles>
    </RowStyles>
  )
}

export interface SummaryProps {
  exam: Exam
}

export interface SummaryStylesProps extends ThemedStyles {
  $status: boolean
}
