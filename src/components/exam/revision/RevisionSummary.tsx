import type { Results } from '../../../types'

import React from 'react'
import { useNavigate } from 'react-router-dom'
import SummaryRow from '../shared/SummaryRow'
import { formatDate, formatTimer } from '../../../utils/format'
import { translate } from '../../../utils/translation'
import { ROUTES } from '../../../config/routes'
import useResults from '../../../hooks/useResults'

const RevisionSummary: React.FC = () => {
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
    <div id="summary" className="flex flex-col gap-10">
      <div id="title" className="justify-self-center text-4xl font-bold text-center text-black">{translated.title}</div>

      <div id="columns" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="column" className="grid w-full">
          {pass !== undefined && (
            <SummaryRow type="status" value={translated.status} status={pass} isStatus />
          )}

          {passPercent && (
            <SummaryRow type="passing" value={`${passPercent} %`} status={pass} />
          )}

          <SummaryRow type="time" value={formatTimer(elapsedTime)} status={pass} />
          <SummaryRow type="date" value={formatDate(date)} status={pass} />
          {sourceLabel && <SummaryRow type={sourceType} value={sourceLabel} status={pass} />}
        </div>

        <div id="column" className="pt-12.5 grid w-full">
          <SummaryRow type="score" value={`${score} %`} status={pass} />
          <SummaryRow type="correct" value={`${correctCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incorrect" value={`${incorrectCount} / ${totalQuestions}`} status={pass} />
          <SummaryRow type="incomplete" value={`${incompleteCount} / ${totalQuestions}`} status={pass} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center mt-5 gap-2.5">
        <button
          id="restart-button"
          title="Homepage"
          className="no-select bg-primary text-white py-3 px-4 text-lg font-semibold rounded-lg transition-all duration-300 cursor-pointer min-w-65 w-full max-w-75 inline-block hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => navigate(ROUTES.home)}
        >
          {translated.home}
        </button>
      </div>
    </div>
  )
}

export default RevisionSummary
