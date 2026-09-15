import React from 'react'
import RevisionContent from './RevisionContent'
import RevisionSummary from './RevisionSummary'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const RevisionMain: React.FC<{ open: boolean }> = () => {
  const { examState, reviewState } = useExamSessionCore()
  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <main id="main" className="w-full overflow-hidden bg-white">
      <div id="content" className="w-full h-full overflow-y-auto box-border grid justify-items-center items-center p-5 transition-all duration-300">
        {finished && summary ? <RevisionSummary /> : <RevisionContent isReview={finished} />}
      </div>
    </main>
  )
}

export default RevisionMain
