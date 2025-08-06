import type { Exam, ThemedStyles } from '../../types'
import type { Session } from '../../session'

import React from 'react'
import styled from 'styled-components'
import { formatDate, formatTimer } from '../../utils/format'
import { translate } from '../../settings'

const SummaryStyles = styled.div`
  width: 100%;
  height: calc(100vh - 14rem);
  display: grid;
  grid-template-rows: 3rem 1.5fr 3rem 2fr;
`

export const TitleStyles = styled.div<ThemedStyles>`
  justify-self: center;
  font: 2rem 'Open Sans';
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  transform: translateX(-3rem);
`

export const InnerSummaryStyles = styled.div`
  justify-self: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
`

export const ColumnStyles = styled.div`
  align-self: center;
  display: grid;
  grid-template-rows: repeat(4, 3rem);
`

export const RowStyles = styled.div<SummaryStylesProps>`
  display: grid;
  grid-template-columns: 10rem 10rem;
  align-items: center;
  & > :first-child {
    font: 1.2rem 'Open Sans';
    font-weight: 700;
    color: ${({ theme }) => theme.grey[10]};
  }
  .status {
    color: ${({ $status, theme }) => ($status ? theme.correct : theme.incorrect)};
  }
`

export const DataStyles = styled.div<ThemedStyles>`
    font: 1.25rem 'Open Sans';
    font-weight: 700;
    color: ${({ theme }) => theme.black};
  }
`

const SummaryComponent: React.FC<SummaryProps> = ({ exam, session }) => {
  const incompleteQuestions = session.answers.filter((a) => a === null)
  const completedQuestions = session.answers.filter((a) => a !== null)
  const conrrectQuestions = completedQuestions.filter((a, i) => a === exam.test[i].answer)
  const incorrectQuestions = completedQuestions.filter((a, i) => a !== exam.test[i].answer)

  const score = Math.round((conrrectQuestions.length / exam.test.length) * 100)
  const status = score >= exam.pass
  const date = new Date()
  const elapsed = exam.time * 60 - session.time

  return (
    <SummaryStyles>
      <TitleStyles id="title">{translate('content.review.summary.title')}</TitleStyles>

      <InnerSummaryStyles id="summary">
        <ColumnStyles id="column">
          {SummaryRow(
            'status',
            status ? translate('content.review.summary.pass') : translate('content.review.summary.fail'),
            status,
            true
          )}
          {SummaryRow('passing', `${exam.pass} %`, status)}
          {SummaryRow('time', formatTimer(elapsed), status)}
          {SummaryRow('date', formatDate(date), status)}
        </ColumnStyles>

        <ColumnStyles id="column">
          {SummaryRow('score', `${score} %`, status)}
          {SummaryRow('correct', `${conrrectQuestions.length} / ${exam.test.length}`, status)}
          {SummaryRow('incorrect', `${incorrectQuestions.length} / ${exam.test.length}`, status)}
          {SummaryRow('incomplete', `${incompleteQuestions.length} / ${exam.test.length}`, status)}
        </ColumnStyles>
      </InnerSummaryStyles>
    </SummaryStyles>
  )
}

export default SummaryComponent

const SummaryRow = (key: string, value: string, status: boolean, isStatus?: boolean) => {
  const className = isStatus ? 'status' : ''

  return (
    <RowStyles data-test={`summary-row-${key}`} $status={status}>
      <div>{translate(`content.review.summary.${key}`)}</div>
      <DataStyles className={className}>{value}</DataStyles>
    </RowStyles>
  )
}

export interface SummaryProps {
  exam: Exam
  session: Session
}

export interface SummaryStylesProps extends ThemedStyles {
  $status: boolean
}
