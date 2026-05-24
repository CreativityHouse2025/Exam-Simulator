import React from 'react'
import { SessionReducer } from '../utils/session'
import { DEFAULT_FULL_SESSION, SESSION_ACTION_TYPES } from '../constants'
import { saveAttempt, submitAttempt } from '../services/attempt.service'
import { AppApiError } from '../hooks/useAuth'
import { translate } from '../utils/translation'
import useToast from '../hooks/useToast'
import type { Session, SessionDispatch } from '../types'

export default function useSessionReducer(startingSession: Session | null) {
  const [session, updateSession] = React.useReducer(SessionReducer, DEFAULT_FULL_SESSION)
  const [isSyncing, setIsSyncing] = React.useState(false)
  // Ref guards against a second click landing while the first request is in flight
  const isSyncingRef = React.useRef(false)

  const { showToast } = useToast()

  // When startingSession changes (new exam, resume, or revision), reset the reducer to that session
  React.useEffect(() => {
    if (!startingSession) return
    updateSession({ type: SESSION_ACTION_TYPES.RESET_SESSION, payload: startingSession })
  }, [startingSession])

  const sessionUpdate = React.useCallback<SessionDispatch>(
    (...actions) => {
      // Drop all component-dispatched actions while a sync is in flight.
      // This prevents mid-flight edits from being wiped when CLEAR_DIRTY fires on success.
      // Internal calls (RESET_SESSION, CLEAR_DIRTY) bypass this by calling updateSession directly.
      if (isSyncingRef.current) return
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))
      updateSession(actionArray)
    },
    []
  )

  /**
   * Sends only the dirty questions (changed answers/bookmark state) to the DB.
   * On success, clears the dirty set so subsequent saves won't re-send unchanged data.
   * No-op when nothing is dirty or a sync is already in flight.
   */
  const syncProgress = React.useCallback(async () => {
    // revision sessions are ephemeral (not persisted to the DB) — should not be reachable
    // because the Save button is hidden for revision exams, but guard defensively
    if (isSyncingRef.current || session.examType === 'revision') return

    const dirtyIndices = Object.keys(session.dirtyQuestions).map(Number)
    if (dirtyIndices.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      const answers = dirtyIndices.map((questionIndex) => ({
        question_index: questionIndex,
        selected_choices: session.selectedOriginalIndices[questionIndex] ?? [],
        is_bookmarked: session.bookmarks.includes(questionIndex),
      }))      

      const b1 = session.examType === 'full' ? session.break1OfferedAt : null
      const b2 = session.examType === 'full' ? session.break2OfferedAt : null

      await saveAttempt(session.id, {
        current_index: session.index,
        time_remaining: session.time,
        review_state: session.reviewState,
        answers,
        break_1_offered_at: b1,
        break_2_offered_at: b2,
      })

      updateSession({ type: SESSION_ACTION_TYPES.CLEAR_DIRTY, payload: null })
    } catch (error) {
      if (error instanceof AppApiError) {
        showToast(error.message, 5000)
      } else {
        showToast(translate('attempts.errors.server-unknown'), 5000)
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [session, showToast])

  /**
 * Saves the break offer timestamp to the DB immediately, regardless of dirty questions.
 * Takes the fresh `offeredAt` value as a parameter to avoid reading from a stale closure —
 * the React state update for SET_BREAK1/2_OFFERED_AT hasn't propagated yet when this is called.
 */
  const saveBreakOffer = React.useCallback(async (breakNumber: 1 | 2, offeredAt: string) => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true
    setIsSyncing(true)

    const b1 = session.examType === 'full' ? session.break1OfferedAt : null
    const b2 = session.examType === 'full' ? session.break2OfferedAt : null
    const breakField = breakNumber === 1
      ? ({ break_1_offered_at: offeredAt, break_2_offered_at: b2 })
      : ({ break_1_offered_at: b1, break_2_offered_at: offeredAt })

    try {
      const dirtyIndices = Object.keys(session.dirtyQuestions).map(Number)
      const answers = dirtyIndices.map((questionIndex) => ({
        question_index: questionIndex,
        selected_choices: session.selectedOriginalIndices[questionIndex] ?? [],
        is_bookmarked: session.bookmarks.includes(questionIndex),
      }))

      await saveAttempt(session.id, {
        current_index: session.index,
        time_remaining: session.time,
        review_state: session.reviewState,
        answers,
        ...breakField,
      })

      updateSession({ type: SESSION_ACTION_TYPES.CLEAR_DIRTY, payload: null })
    } catch (error) {
      if (error instanceof AppApiError) {
        showToast(error.message, 5000)
      } else {
        showToast(translate('attempts.errors.server-unknown'), 5000)
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [session, showToast])

  /**
   * Flushes dirty answers and marks the attempt as completed in the DB.
   * Dispatches SET_EXAM_STATE 'completed' only on success so the session
   * stays in-progress if the network call fails (allowing the user to retry).
   */
  const submitExam = React.useCallback(async (score: number, status: 'pass' | 'fail') => {
    if (isSyncingRef.current) return

    // Revision sessions transition state locally with no DB write.
    if (session.examType === 'revision') {
      updateSession([
        { type: SESSION_ACTION_TYPES.SET_TIMER_PAUSED, payload: true },
        { type: SESSION_ACTION_TYPES.SET_EXAM_STATE, payload: 'completed' },
      ])
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      const dirtyIndices = (Object.keys(session.dirtyQuestions)).map(Number)
      const answers = dirtyIndices.map((questionIndex) => ({
        question_index: questionIndex,
        selected_choices: session.selectedOriginalIndices[questionIndex] ?? [],
        is_bookmarked: session.bookmarks.includes(questionIndex),
      }))

      await submitAttempt(session.id, {
        current_index: session.index,
        time_remaining: session.time,
        review_state: session.reviewState,
        answers,
        score,
        status,
      })

      updateSession([
        { type: SESSION_ACTION_TYPES.CLEAR_DIRTY, payload: null },
        { type: SESSION_ACTION_TYPES.SET_TIMER_PAUSED, payload: true },
        { type: SESSION_ACTION_TYPES.SET_EXAM_STATE, payload: 'completed' },
      ])
    } catch (error) {
      if (error instanceof AppApiError) {
        // ATTEMPT_SAVE_FAILED is the backend code for RPC failures on this endpoint;
        // surface a submit-specific message so the user knows to retry the submit, not a mid-exam save.
        const msg = error.code === 'ATTEMPT_SAVE_FAILED'
          ? translate('attempts.errors.server-submit-failed')
          : error.message
        showToast(msg, 5000)
      } else {
        showToast(translate('attempts.errors.server-unknown'), 5000)
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [session, showToast])

  const break1OfferedAt = session.examType === 'full' ? session.break1OfferedAt : null
  const break2OfferedAt = session.examType === 'full' ? session.break2OfferedAt : null

  const contextValues = {
    navigation: { index: session.index, update: sessionUpdate },
    timer: { time: session.time, maxTime: session.maxTime, paused: session.paused, update: sessionUpdate },
    exam: { examState: session.examState, reviewState: session.reviewState, update: sessionUpdate, categoryId: session.categoryId, examId: session.examId },
    data: {
      bookmarks: session.bookmarks,
      selectedOriginalIndices: session.selectedOriginalIndices,
      examType: session.examType,
      dirtyQuestions: session.dirtyQuestions,
      isSyncing,
      break1OfferedAt,
      break2OfferedAt,
      update: sessionUpdate,
    },
  }

  return { session, sessionUpdate, contextValues, syncProgress, submitExam, saveBreakOffer }
}
