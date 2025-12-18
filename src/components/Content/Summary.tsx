import type { ThemedStyles } from '../../types'

import React from 'react'
import styled from 'styled-components'
import SummaryRow from './SummaryRow'
import { formatDate, formatTimer } from '../../utils/format'
import { translate } from '../../utils/translation'
import { ExamContext, SessionDataContext, SessionExamContext, SessionTimerContext } from '../../contexts'
import useCategoryLabel from '../../hooks/useCategoryLabel'
import { useReport } from '../../hooks/useReport'
import useSettings from '../../hooks/useSettings'

const passPercent = 85

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
  const { answers } = React.useContext(SessionDataContext)
  const { maxTime, time } = React.useContext(SessionTimerContext)
  const { categoryId } = React.useContext(SessionExamContext)
  const exam = React.useContext(ExamContext)

  const { settings } = useSettings();
  const langCode = settings.language;

  const questions = React.useMemo(() => {
    const arraysEqual = (a: number[] | null, b: number[]): boolean =>
      a !== null && a.length === b.length && a.every((val, index) => val === b[index])

    const categorized = answers.reduce(
      (acc, givenAnswer, i) => {
        const correctAnswer = exam[i].answer

        if (!givenAnswer || givenAnswer.length === 0) {
          acc.incomplete.push(i)
        } else {
          acc.completed.push(i)
          if (arraysEqual(givenAnswer, correctAnswer as number[])) {
            acc.correct.push(i)
          } else {
            acc.incorrect.push(i)
          }
        }

        return acc
      },
      { incomplete: [] as number[], completed: [] as number[], correct: [] as number[], incorrect: [] as number[] }
    )

    return categorized
  }, [exam, answers])

  const score = Math.round((questions.correct.length / exam.length) * 100)
  const status = score >= passPercent
  const elapsed = maxTime - time  
  const date = new Date()
  const categoryLabel: string | undefined = useCategoryLabel(categoryId);  

  const translated = React.useMemo(
    () => ({
      title: translate('content.summary.title'),
      status: translate(`content.summary.${status ? 'pass' : 'fail'}`),
      home: translate('content.summary.home')
    }),
    [langCode, translate, status]
  )

  const { error: reportError, loading, generateReport, downloadReport } = useReport();
  async function hanldeSaveReport() {
    try {
      await generateReport({
        exam,
        userAnswers: answers,
        langCode,
        userFullName: "Mohammed Alsadawi"
      })
      downloadReport()
      
    } catch (error) {
      console.log(error);
      
    }
  }

  const onRestart = React.useCallback(() => window.location.reload(), [])

  return (
    <div id="summary">
      <TitleStyles id="title">{translated.title}</TitleStyles>

      <div id="columns">
        <TopColumnStyles id="column">
          <SummaryRow type="status" value={translated.status} status={status} isStatus />
          <SummaryRow type="passing" value={`${passPercent} %`} status={status} />
          <SummaryRow type="time" value={formatTimer(elapsed)} status={status} />
          <SummaryRow type="date" value={formatDate(date)} status={status} />
          <SummaryRow type="category" value={categoryLabel as string} status={status} />
        </TopColumnStyles>

        <ColumnStyles id="column">
          <SummaryRow type="score" value={`${score} %`} status={status} />
          <SummaryRow type="correct" value={`${questions.correct.length} / ${exam.length}`} status={status} />
          <SummaryRow type="incorrect" value={`${questions.incorrect.length} / ${exam.length}`} status={status} />
          <SummaryRow type="incomplete" value={`${questions.incomplete.length} / ${exam.length}`} status={status} />
        </ColumnStyles>
      </div>

      <RestartButton id="restart-button" className="no-select" onClick={onRestart}>
        {translated.home}
      </RestartButton>

      <button onClick={hanldeSaveReport}>Save Report</button>
    </div>
  )
}

export default SummaryComponent
