import React from 'react'
import { Timer } from 'lucide-react'
import { formatTimer } from '../../../utils/format'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'
import { useFullExamSession } from '../../../hooks/examSession/useFullExamSession'

const TimerComponent: React.FC = () => {
  const { examState } = useExamSessionCore()
  const { time, paused, preview, setTime } = useFullExamSession()
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval if timer is active
    if (!paused && time > 0 && examState !== 'completed') {
      intervalRef.current = setInterval(() => {
        setTime(Math.max(0, time - 1))
      }, 1000)
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paused, time])

  // Handle timer expiration
  React.useEffect(() => {
    if (time <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [time])

  const warning = time < 120

  return (
    <div id="timer" className={`flex items-center justify-center ${warning ? "text-secondary" : "text-black"}`}>
      <div data-test="Timer" className="text-xl font-bold p-1.25">{formatTimer(time, preview)}</div>

      <Timer size={30} className="m-1.25" />
    </div>
  )
}

export default TimerComponent
