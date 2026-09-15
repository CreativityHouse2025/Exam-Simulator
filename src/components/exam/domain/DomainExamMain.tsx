import React from 'react'
import DomainExamContent from './DomainExamContent'
import DomainExamSummary from './DomainExamSummary'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const DomainExamMain: React.FC<{ open: boolean }> = () => {
  const { examState, reviewState } = useExamSessionCore()
  const finished = examState === 'completed'
  const summary = reviewState === 'summary'

  return (
    <main id="main" className="w-full overflow-hidden bg-white">
      <div id="content" className="w-full h-full overflow-y-auto scrollbar-gutter-stable box-border grid justify-items-center items-center p-5 transition-all duration-300">
        {finished && summary ? <DomainExamSummary /> : <DomainExamContent isReview={finished} />}
      </div>
    </main>
  )
}

export default DomainExamMain
