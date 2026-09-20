import type { Session, SessionReducerFunc, SessionActions, SessionAction } from '../types'
import { SESSION_ACTION_PROPS } from '../constants'

function applyOffered(state: Session, action: SessionAction<'SET_OFFERED_BREAK'>): Session {
  const showAtIndex = action.payload
  if (state.offeredBreaks.includes(showAtIndex)) return state
  return { ...state, offeredBreaks: [...state.offeredBreaks, showAtIndex] }
}

export const SessionReducer: SessionReducerFunc = (state: Session | null, actions: SessionActions): Session | null => {
  // Handle single action
  if (!Array.isArray(actions)) {
    const { type, payload } = actions
    if (type === 'RESET_SESSION') return payload as Session

    // No session mounted — every other action is a stray dispatch from an unmounting tree.
    if (state === null) return null

    if (type === 'MARK_DIRTY') {
      const questionIndex = payload as number
      // No-op if the question is already in the dirty set (avoids an unnecessary re-render)
      if (state.dirtyQuestions[questionIndex]) return state
      return { ...state, dirtyQuestions: { ...state.dirtyQuestions, [questionIndex]: true } }
    }

    if (type === 'CLEAR_DIRTY') {
      if (Object.keys(state.dirtyQuestions).length === 0) return state
      return { ...state, dirtyQuestions: {} }
    }

    if (type === 'SET_OFFERED_BREAK') {
      return applyOffered(state, actions as SessionAction<'SET_OFFERED_BREAK'>)
    }

    const key = SESSION_ACTION_PROPS[type]

    if (payload !== state[key as keyof typeof state]) {
      return { ...state, [key]: payload } as Session
    }
    return state
  }

  // Handle multiple actions
  const reset = actions.find((action): action is SessionAction<'RESET_SESSION'> => action.type === 'RESET_SESSION')

  // No session mounted and nothing in this batch mounts one — every action here is a stray
  // dispatch from an unmounting tree.
  if (state === null && !reset) return null

  let newState: Session = reset ? (reset.payload as Session) : (state as Session)
  let hasChanges = reset !== undefined

  for (const action of actions) {
    const { type, payload } = action

    if (type === 'RESET_SESSION') continue

    if (type === 'MARK_DIRTY') {
      const questionIndex = payload as number
      if (!newState.dirtyQuestions[questionIndex]) {
        newState = { ...newState, dirtyQuestions: { ...newState.dirtyQuestions, [questionIndex]: true } }
        hasChanges = true
      }
      continue
    }

    if (type === 'CLEAR_DIRTY') {
      if (Object.keys(newState.dirtyQuestions).length > 0) {
        newState = { ...newState, dirtyQuestions: {} }
        hasChanges = true
      }
      continue
    }

    if (type === 'SET_OFFERED_BREAK') {
      const updated = applyOffered(newState, action as SessionAction<'SET_OFFERED_BREAK'>)
      if (updated !== newState) { newState = updated; hasChanges = true }
      continue
    }

    const key = SESSION_ACTION_PROPS[type]

    if (payload !== newState[key as keyof typeof newState]) {
      if (!hasChanges) {
        // Only create a new object on first change
        newState = { ...newState }
        hasChanges = true
      }

      // @ts-expect-error -- pre-existing, unrelated to this change
      newState[key] = payload
    }
  }

  return newState
}
