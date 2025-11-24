import React, { createContext, useContext, useMemo } from 'react'
import type { Session, SessionDispatch } from '../types'
import { useSession } from '../hooks/useSession'

// Split contexts for better performance
const SessionStateContext = createContext<Session | null>(null)
const SessionDispatchContext = createContext<SessionDispatch | null>(null)

// Specific contexts for components that only need certain parts
const SessionTimerContext = createContext<{
  time: number
  maxTime: number
  paused: boolean
  update: SessionDispatch
} | null>(null)

const SessionNavigationContext = createContext<{
  index: number
  update: SessionDispatch
} | null>(null)

const SessionExamContext = createContext<{
  examState: Session['examState']
  reviewState: Session['reviewState']
  update: SessionDispatch
} | null>(null)

const SessionDataContext = createContext<{
  bookmarks: number[]
  answers: Session['answers']
  examID?: Session['examID']
  update: SessionDispatch
} | null>(null)

interface SessionProviderProps {
  children: React.ReactNode
  initialSession?: Session
  onSessionUpdate?: (session: Session) => void
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children, initialSession, onSessionUpdate }) => {
  const { session, updateSession, getSession, setPersistedSession } = useSession(initialSession)

  // Wrap updateSession to call onSessionUpdate
  const wrappedUpdateSession = useMemo(() => {
    if (!onSessionUpdate) return updateSession

    return ((...actions) => {
      updateSession(...actions)
      // Use getSession to get the most up-to-date state
      setTimeout(() => onSessionUpdate(getSession()), 0)
    }) as SessionDispatch
  }, [updateSession, onSessionUpdate, getSession])

  // Memoize context values to prevent unnecessary re-renders
  const timerValue = useMemo(
    () => ({
      time: session.time,
      maxTime: session.maxTime,
      paused: session.paused,
      update: wrappedUpdateSession
    }),
    [session.time, session.maxTime, session.paused, wrappedUpdateSession]
  )

  const navigationValue = useMemo(
    () => ({
      index: session.index,
      update: wrappedUpdateSession
    }),
    [session.index, wrappedUpdateSession]
  )

  const examValue = useMemo(
    () => ({
      examState: session.examState,
      reviewState: session.reviewState,
      update: wrappedUpdateSession
    }),
    [session.examState, session.reviewState, wrappedUpdateSession]
  )

  const dataValue = useMemo(
    () => ({
      bookmarks: session.bookmarks,
      answers: session.answers,
      examID: session.examID,
      update: wrappedUpdateSession
    }),
    [session.bookmarks, session.answers, session.examID, wrappedUpdateSession]
  )

  return (
    <SessionStateContext.Provider value={session}>
      <SessionDispatchContext.Provider value={wrappedUpdateSession}>
        <SessionTimerContext.Provider value={timerValue}>
          <SessionNavigationContext.Provider value={navigationValue}>
            <SessionExamContext.Provider value={examValue}>
              <SessionDataContext.Provider value={dataValue}>{children}</SessionDataContext.Provider>
            </SessionExamContext.Provider>
          </SessionNavigationContext.Provider>
        </SessionTimerContext.Provider>
      </SessionDispatchContext.Provider>
    </SessionStateContext.Provider>
  )
}

// Custom hooks for accessing specific parts of session
export const useSessionState = () => {
  const session = useContext(SessionStateContext)
  if (!session) {
    throw new Error('useSessionState must be used within a SessionProvider')
  }
  return session
}

export const useSessionDispatch = () => {
  const dispatch = useContext(SessionDispatchContext)
  if (!dispatch) {
    throw new Error('useSessionDispatch must be used within a SessionProvider')
  }
  return dispatch
}

export const useSessionTimer = () => {
  const timer = useContext(SessionTimerContext)
  if (!timer) {
    throw new Error('useSessionTimer must be used within a SessionProvider')
  }
  return timer
}

export const useSessionNavigation = () => {
  const navigation = useContext(SessionNavigationContext)
  if (!navigation) {
    throw new Error('useSessionNavigation must be used within a SessionProvider')
  }
  return navigation
}

export const useSessionExam = () => {
  const exam = useContext(SessionExamContext)
  if (!exam) {
    throw new Error('useSessionExam must be used within a SessionProvider')
  }
  return exam
}

export const useSessionData = () => {
  const data = useContext(SessionDataContext)
  if (!data) {
    throw new Error('useSessionData must be used within a SessionProvider')
  }
  return data
}

// Export contexts for backward compatibility
export { SessionTimerContext, SessionNavigationContext, SessionExamContext, SessionDataContext }
