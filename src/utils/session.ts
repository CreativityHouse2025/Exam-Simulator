import type { Session, SessionReducerFunc, SessionActions } from '../types'
import { SESSION_ACTION_PROPS } from '../constants'

export const SessionReducer: SessionReducerFunc = (state: Session, actions: SessionActions): Session => {
  // Handle single action
  if (!Array.isArray(actions)) {
    const { type, payload } = actions
    if (type === 'RESET_SESSION') return payload as Session

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

    const key = SESSION_ACTION_PROPS[type]

    if (payload !== state[key]) {
      return { ...state, [key]: payload }
    }
    return state
  }

  // Handle multiple actions
  let newState = state
  let hasChanges = false

  for (const action of actions) {
    const { type, payload } = action

    if (type === 'RESET_SESSION') { newState = payload as Session; hasChanges = true; continue }

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

    const key = SESSION_ACTION_PROPS[type]

    if (payload !== newState[key]) {
      if (!hasChanges) {
        // Only create a new object on first change
        newState = { ...newState }
        hasChanges = true
      }

      // @ts-expect-error
      newState[key] = payload
    }
  }

  return newState
}