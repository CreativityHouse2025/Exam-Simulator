import type { Session, SessionReducerFunc, SessionActions } from '../types'
import { SESSION_ACTION_PROPS } from '../constants'

export const SessionReducer: SessionReducerFunc = (state: Session, actions: SessionActions): Session => {
  // Handle single action
  if (!Array.isArray(actions)) {
    const { type, payload } = actions
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