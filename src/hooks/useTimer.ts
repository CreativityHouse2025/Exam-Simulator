import { useEffect, useRef } from 'react'
import { useSessionTimer } from '../providers/SessionProvider'

export function useTimer() {
  const { time, paused, update } = useSessionTimer()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeRef = useRef(time)

  // Keep time ref in sync
  timeRef.current = time

  useEffect(() => {
    if (!paused && time > 0) {
      intervalRef.current = setInterval(() => {
        if (timeRef.current > 0) {
          update(['SET_TIME', Math.max(0, timeRef.current - 1)])
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [paused, update]) // Remove time from dependencies to prevent restarts

  return { time, paused }
}
