import type { ExamID, QuestionTypes } from './types'
import { createContext } from 'react'

// Answer types
export type AnswerOf = {
  'single-answer': number | null
  'multiple-answer': number[]
}

export type Answer<QT extends QuestionTypes> = AnswerOf[QT]
export type AnswerOfMultipleChoice = AnswerOf['single-answer']
export type AnswerOfMultipleAnswer = AnswerOf['multiple-answer']
export type Answers = (AnswerOfMultipleChoice | AnswerOfMultipleAnswer)[]

// State types
export type ExamState = 'not-started' | 'in-progress' | 'completed'
export type ReviewState = 'summary' | 'question'

// Session interface
export interface Session {
  /** the question number */
  index: number
  /** the maximum time allowed for the exam */
  maxTime: number
  /** the time elapsed */
  time: number
  /** the state of the timer */
  paused: boolean
  /** the state of the exam */
  examState: ExamState
  /** the state of the review */
  reviewState: ReviewState
  /** the list of bookmarked questions */
  bookmarks: number[]
  /** the list of answers */
  answers: Answers
  /** the ID of the exam */
  examID?: ExamID
  /** session update function - will be injected by reducer */
  update?: SessionDispatch
}

// Action types
export const SessionActionTypes = {
  SET_INDEX: 'SET_INDEX' as const,
  SET_BOOKMARKS: 'SET_BOOKMARKS' as const,
  SET_ANSWERS: 'SET_ANSWERS' as const,
  SET_TIME: 'SET_TIME' as const,
  SET_TIMER_PAUSED: 'SET_TIMER_PAUSED' as const,
  SET_EXAM_STATE: 'SET_EXAM_STATE' as const,
  SET_REVIEW_STATE: 'SET_REVIEW_STATE' as const
} as const

export type SessionActionTypes = keyof typeof SessionActionTypes

// Session actions mapping
type SessionActionsMap = {
  SET_INDEX: { payload: number; prop: 'index' }
  SET_BOOKMARKS: { payload: number[]; prop: 'bookmarks' }
  SET_ANSWERS: { payload: Answers; prop: 'answers' }
  SET_TIME: { payload: number; prop: 'time' }
  SET_TIMER_PAUSED: { payload: boolean; prop: 'paused' }
  SET_EXAM_STATE: { payload: ExamState; prop: 'examState' }
  SET_REVIEW_STATE: { payload: ReviewState; prop: 'reviewState' }
}

export interface SessionAction<T extends SessionActionTypes = SessionActionTypes> {
  type: T
  payload: SessionActionsMap[T]['payload']
}

// Add support for multiple actions
export type SessionActions = SessionAction | SessionAction[]

// Function types
export type SessionReducerFunc = (state: Session, actions: SessionActions) => Session
export type SessionDispatch = <T extends SessionActionTypes>(...actions: [T, SessionActionsMap[T]['payload']][]) => void

// Property mapping
export const SessionActionProps: { [K in SessionActionTypes]: SessionActionsMap[K]['prop'] } = {
  SET_INDEX: 'index' as const,
  SET_BOOKMARKS: 'bookmarks' as const,
  SET_ANSWERS: 'answers' as const,
  SET_TIME: 'time' as const,
  SET_TIMER_PAUSED: 'paused' as const,
  SET_EXAM_STATE: 'examState' as const,
  SET_REVIEW_STATE: 'reviewState' as const
} as const

// Default session
export const defaultSession: Session = {
  index: 0 as const,
  maxTime: 0 as const,
  time: 0 as const,
  paused: false as const,
  examState: 'not-started' as const,
  reviewState: 'summary' as const,
  bookmarks: [] as const,
  answers: [] as const
} as const

export type SessionNavigation = Pick<Session, 'index' | 'update'>
export type SessionTimer = Pick<Session, 'time' | 'maxTime' | 'paused' | 'update'>
export type SessionExam = Pick<Session, 'examState' | 'reviewState' | 'update'>
export type SessionData = Pick<Session, 'bookmarks' | 'answers' | 'examID' | 'update'>

// Split contexts for better performance
export const SessionNavigationContext = createContext<SessionNavigation>({ index: 0 })
export const SessionTimerContext = createContext<SessionTimer>({ time: 0, maxTime: 0, paused: false })
export const SessionExamContext = createContext<SessionExam>({ examState: 'not-started', reviewState: 'summary' })
export const SessionDataContext = createContext<SessionData>({ bookmarks: [], answers: [] })

export const SessionReducer: SessionReducerFunc = (state: Session, actions: SessionActions): Session => {
  // Handle single action
  if (!Array.isArray(actions)) {
    const { type, payload } = actions
    const key = SessionActionProps[type]

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
    const key = SessionActionProps[type]

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
