import { useSessionTimer, useSessionData, useSessionControl } from '../../contexts'
import { SESSION_ACTION_TYPES } from '../../constants'
import type { FullExamSession } from '../../types'

/**
 * Facade hook for full exam-specific state and actions.
 * Exposes timer, break management, sync, submit, and revision start for the full exam tree.
 */
export function useFullExamSession() {
  const { time, maxTime, paused, update: timerUpdate } = useSessionTimer()
  const { break1OfferedAt, break2OfferedAt, isSyncing, update: dataUpdate } = useSessionData()
  const { session, syncProgress, submitExam, saveBreakOffer, startRevision } = useSessionControl()
  const full = session as FullExamSession

  const setPaused = (value: boolean) => {
    timerUpdate!([SESSION_ACTION_TYPES.SET_TIMER_PAUSED, value])
  }

  const setTime = (value: number) => {
    timerUpdate!([SESSION_ACTION_TYPES.SET_TIME, value])
  }

  const recordBreakOffered = (breakNumber: 1 | 2, offeredAt: string) => {
    const actionType =
      breakNumber === 1 ? SESSION_ACTION_TYPES.SET_BREAK1_OFFERED_AT : SESSION_ACTION_TYPES.SET_BREAK2_OFFERED_AT
    dataUpdate!([actionType, offeredAt])
    saveBreakOffer(breakNumber, offeredAt)
  }

  return {
    examId: full?.examId ?? null,
    time,
    maxTime,
    paused,
    setPaused,
    setTime,
    break1OfferedAt,
    break2OfferedAt,
    recordBreakOffered,
    isSyncing,
    syncProgress,
    submitExam,
    startRevision,
  }
}
