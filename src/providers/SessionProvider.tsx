import React from 'react'
import Confirms from '../components/Navigation/Confirms'
import {
  SessionControlContext,
  SessionDataContext,
  SessionExamContext,
  SessionNavigationContext,
  SessionTimerContext,
} from '../contexts'
import useAttempts from '../hooks/useAttempts'
import useLatestAttemptId from '../hooks/useLatestAttempt'
import useToast from '../hooks/useToast'
import useExamSession from '../hooks/useExamSession'
import { translate } from '../utils/translation'
import { loadDomainExam, loadFullExam } from '../utils/exam'
import { adaptAttemptToSession } from '../utils/attemptAdapter'
import { AppApiError } from '../hooks/useAuth'
import { DEFAULT_SESSION } from '../constants'
import type { Session, SessionDispatch, SessionControlContextType } from '../types'
import useSettings from '../hooks/useSettings'

const noopDispatch = (() => { }) as SessionDispatch

interface ActiveSessionProps {
  startingSession: Session
  startNewExam: SessionControlContextType['startNewExam']
  resumeAttempt: SessionControlContextType['resumeAttempt']
  startRevision: SessionControlContextType['startRevision']
  children: React.ReactNode
}

// Thin component that wires the exam session into the 4 split context providers.
// Keyed by sessionMountKey (attemptId + mode) in the parent so that remounting this
// component resets useExamSession's reducer to the new startingSession, giving each
// exam attempt a clean slate without needing to reset individual state slices manually.
const ActiveSession: React.FC<ActiveSessionProps> = ({ startingSession, startNewExam, resumeAttempt, startRevision, children }) => {
  const { session, sessionUpdate, contextValues } = useExamSession(startingSession)  

  return (
    <SessionControlContext.Provider value={{ session, update: sessionUpdate, startNewExam, resumeAttempt, startRevision }}>
      <SessionNavigationContext.Provider value={contextValues.navigation}>
        <SessionTimerContext.Provider value={contextValues.timer}>
          <SessionExamContext.Provider value={contextValues.exam}>
            <SessionDataContext.Provider value={contextValues.data}>
              <>
                {children}
                <Confirms session={session} update={sessionUpdate} />
              </>
            </SessionDataContext.Provider>
          </SessionExamContext.Provider>
        </SessionTimerContext.Provider>
      </SessionNavigationContext.Provider>
    </SessionControlContext.Provider>
  )
}

/**
 * Outer shell: manages the full Session lifecycle.
 *
 * When no session is active, provides a minimal context that exposes
 * `startNewExam` and `resumeAttempt` to child routes (e.g. CoverPage, AttemptHistoryPage).
 *
 * When either method succeeds it sets `sessionMountKey` + `startingSession`, which
 * causes `ActiveSession` to mount (keyed so future calls reset the reducer cleanly).
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionMountKey, setSessionMountKey] = React.useState<string | null>(null)
  const [startingSession, setStartingSession] = React.useState<Session | null>(null)
  const { showToast } = useToast()
  const { startAttempt, getAttempt } = useAttempts()
  const [, setLatestAttemptId] = useLatestAttemptId()
  const langCode = useSettings().settings.language

  /**
   * Loads the exam file, persists the initial attempt snapshot to the DB, builds the
   * full Session from DEFAULT_SESSION + attempt config, and mounts the active session.
   * Sets the attemptId in the localStorage for "continue latest exam" on cover page
   *
   * ExamProvider reads the session config and re-fetches the same file on mount.
   * SessionProvider owns Session state, ExamProvider owns exam data in memory.
   * TODO: need to add a cache inside the examBuilder or localStorage for better performance (single read)
   *
   * Returns the new attemptId on success, or null on failure.
   */
  const startNewExam = React.useCallback(
    async (type: Session['examType'], examOrCategoryId: number): Promise<string | null> => {
      try {
        const examDetails =
          type === 'full'
            ? await loadFullExam(examOrCategoryId, langCode)
            : await loadDomainExam(examOrCategoryId, langCode)

        const resolvedQuestions = examDetails.questionList
        if (resolvedQuestions === null) {
          showToast(translate('cover.invalid-exam-message'), 5000)
          return null
        }

        // TODO: replace with real shuffle — reversed as a temporary smoke-test for order mapping
        const choiceOrders = resolvedQuestions.map(
          (q) => q.choices.map((_, i) => i).reverse()
        )

        const questionChoiceOrders: Record<number, number[]> = Object.fromEntries(
          resolvedQuestions.map(
            (q, i) => [q.id, choiceOrders[i]]
          )
        )

        const questionIds = resolvedQuestions.map((q) => q.id)

        // attempt body, if full exam then category must be null and vice versa
        const startAttemptRequestBody =
          type === 'full'
            ? {
              exam_type: 'full' as const,
              exam_id: examOrCategoryId,
              category_id: null,
              question_ids: questionIds,
              choices_orders: choiceOrders,
              duration_minutes: examDetails.durationMinutes,
            }
            : {
              exam_type: 'domain' as const,
              category_id: examOrCategoryId,
              exam_id: null,
              question_ids: questionIds,
              choices_orders: choiceOrders,
              duration_minutes: examDetails.durationMinutes,
            }

        // const { attempt_id } = await startAttempt(startAttemptRequestBody)
        const maxTime = examDetails.durationMinutes * 60

        const nextSession: Session = {
          ...DEFAULT_SESSION,
          id: "attempt1",
          examType: type,
          examId: type === 'full' ? examOrCategoryId : null,
          categoryId: type === 'domain' ? examOrCategoryId : null,
          questionChoiceOrders,
          selectedOriginalIndices: Array.from({ length: resolvedQuestions.length }, () => []),
          maxTime,
          time: maxTime,
        }

        // `att` indicates new attempt, need to have it because revisions have same attemptId
        setSessionMountKey(`${"attempt1"}:att`)
        setStartingSession(nextSession)
        setLatestAttemptId("attempt1")
        return "attempt1"
      } catch (error) {
        if (error instanceof AppApiError) {
          showToast(error.message, 5000)
        } else {
          showToast(translate('attempts.errors.server-unknown'), 5000)
        }
        return null
      }
    },
    [startAttempt, showToast, setLatestAttemptId, langCode]
  )

  /**
   * Fetches an in-progress attempt snapshot from the DB, hydrates the full Session state,
   * mounts the active session, and sets the attemptId in the localStorage for "continue latest exam" on cover page
   * Navigation to /app/exam is the caller's responsibility.
   *
   * Returns the attemptId on success, or null on failure so callers can reset their loading/disabled state.
   */
  const resumeAttempt = React.useCallback(
    async (attemptId: string): Promise<string | null> => {
      try {
        const attemptSnapshot = await getAttempt(attemptId)
        const nextSession = adaptAttemptToSession(attemptSnapshot, { revision: false })

        if (!nextSession) {
          showToast(translate('cover.invalid-exam-message'), 5000)
          return null
        }

        setSessionMountKey(`${attemptId}:att`)
        setStartingSession(nextSession)
        setLatestAttemptId(attemptId)
        return attemptId
      } catch (error) {
        if (error instanceof AppApiError) {
          showToast(error.message, 5000)
        } else {
          showToast(translate('attempts.errors.server-unknown'), 5000)
        }
        return null
      }
    },
    [getAttempt, showToast, setLatestAttemptId]
  )

  /**
   * Fetches a completed full-exam attempt snapshot from the DB, filters to wrong/unanswered
   * questions only (via adaptAttemptToSession with revision: true), and mounts an ephemeral
   * revision session (not persisted to localStorage).
   * Navigation to /app/exam is the caller's responsibility.
   *
   * Returns the attemptId on success, or null on failure so callers can reset their loading/disabled state.
   */
  const startRevision = React.useCallback(
    async (attemptId: string): Promise<string | null> => {
      try {
        const attemptSnapshot = await getAttempt(attemptId)
        // revision: true filters to wrong/unanswered questions and stamps examType as 'revision'
        const nextSession = adaptAttemptToSession(attemptSnapshot, { revision: true })

        if (!nextSession) {
          showToast(translate('cover.invalid-exam-message'), 5000)
          return null
        }

        // `rev` suffix distinguishes this mount key from a regular attempt with the same id,
        // ensuring the reducer resets cleanly even if the user retries the same exam twice.
        setSessionMountKey(`${attemptId}:rev`)
        setStartingSession(nextSession)
        return attemptId
      } catch (error) {
        if (error instanceof AppApiError) {
          showToast(error.message, 5000)
        } else {
          showToast(translate('attempts.errors.server-unknown'), 5000)
        }
        return null
      }
    },
    [getAttempt, showToast]
  )

  if (startingSession !== null && sessionMountKey !== null) {
    return (
      <ActiveSession key={sessionMountKey} startingSession={startingSession} startNewExam={startNewExam} resumeAttempt={resumeAttempt} startRevision={startRevision}>
        {children}
      </ActiveSession>
    )
  }

  // No active session — expose a minimal context so CoverPage and AttemptHistoryPage
  // can still call startNewExam / resumeAttempt / startRevision before any session is mounted.
  return (
    <SessionControlContext.Provider value={{ session: null, update: noopDispatch, startNewExam, resumeAttempt, startRevision }}>
      {children}
    </SessionControlContext.Provider>
  )
}
