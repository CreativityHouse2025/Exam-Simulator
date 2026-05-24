import { useSessionTimer, useSessionData, useSessionControl } from '../../contexts'
import { SESSION_ACTION_TYPES } from '../../constants'
import type { DomainExamSession } from '../../types'

/**
 * Facade hook for domain exam-specific state and actions.
 * Exposes timer, sync, and submit for the domain exam tree (no break logic, no revision).
 */
export function useDomainExamSession() {
  const { time, maxTime, paused, update: timerUpdate } = useSessionTimer()
  const { isSyncing } = useSessionData()
  const { session, syncProgress, submitExam } = useSessionControl()
  const domain = session as DomainExamSession

  const setPaused = (value: boolean) => {
    timerUpdate!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, value])
  }

  const setTime = (value: number) => {
    timerUpdate!([SESSION_ACTION_TYPES.SET_TIME, value])
  }

  return {
    categoryId: domain?.categoryId ?? 0,
    time,
    maxTime,
    paused,
    setPaused,
    setTime,
    isSyncing,
    syncProgress,
    submitExam,
  }
}
