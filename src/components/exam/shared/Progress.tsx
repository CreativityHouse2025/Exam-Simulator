import React from 'react'
import { calculateProgressStats } from '../../../utils/progress'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const ProgressComponent: React.FC<ProgressProps> = ({ questionCount }) => {
  const { selectedOriginalIndices } = useExamSessionCore()

  const { answeredCount, percentage } = React.useMemo(() => {
    return calculateProgressStats(questionCount, selectedOriginalIndices)
  }, [questionCount, selectedOriginalIndices])

  return (
    <div id="progress" className="no-select flex flex-col gap-1.25 p-2.5 rounded-sm mb-2.5">
      <span className="text-xl font-bold text-primary">{`✍️ ${answeredCount} (${percentage}%)`}</span>

      <div id="progress-bar" className="w-full h-1.25 bg-secondary rounded-sm overflow-hidden">
        <div id="progress-fill" className="h-full bg-primary rounded-sm transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default ProgressComponent

export interface ProgressProps {
  questionCount: number
}
