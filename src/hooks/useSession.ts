import { useCallback, useReducer, useRef } from 'react'
import { useLocalStorage } from '@mantine/hooks'
import type { Session, SessionDispatch, SessionActions } from '../types'
import { SessionReducer } from '../utils/session'
import { DEFAULT_SESSION } from '../constants'

export function useSession(initialSession?: Session) {
  const [persistedSession, setPersistedSession] = useLocalStorage<Session>({
    key: 'session',
    defaultValue: initialSession || DEFAULT_SESSION
  })

  const [session, updateSessionState] = useReducer(SessionReducer, persistedSession)
  const sessionRef = useRef(session)

  // Keep ref in sync with state
  sessionRef.current = session

  const updateSession = useCallback(
    ((...actions) => {
      const actionArray = actions.map(([type, payload]) => ({ type, payload }))

      // Update local state
      updateSessionState(actionArray)

      // Get the new state by applying reducer to current ref
      const newSession = SessionReducer(sessionRef.current, actionArray)

      // Only persist non-timer updates to localStorage to avoid performance issues
      const hasNonTimerUpdates = actionArray.some((action) => action.type !== 'SET_TIME')
      if (hasNonTimerUpdates) {
        setPersistedSession(newSession)
      }

      // Update ref
      sessionRef.current = newSession
    }) as SessionDispatch,
    [setPersistedSession]
  )

  const getSession = useCallback(() => sessionRef.current, [])

  return {
    session,
    updateSession,
    getSession,
    setPersistedSession
  }
}
