import React from 'react'
import Legend from './Legend'
import { useExamSessionCore } from '../../../../hooks/examSession/useExamSessionCore'

const LegendsComponent: React.FC = () => {
  const { examState } = useExamSessionCore()

  const inProgress = examState === 'in-progress'
  const completed = examState === 'completed'

  return (
    <div className="h-7.5 flex justify-center items-center border-y border-grey-200">
      <Legend type="marked" />
      <Legend type="incomplete" />
      {inProgress && <Legend type="complete" />}
      {completed && (
        <>
          <Legend type="incorrect" />
          <Legend type="correct" />
        </>
      )}
    </div>
  )
}

export default LegendsComponent
