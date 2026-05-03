import React from "react"
import type { AuthContextType, SessionDispatch, SessionNavigation, SessionTimer, SessionExam, SessionData, SettingsContextType, ToastContextType, ExamContextType } from './types'
import { GENERAL_CATEGORY_ID, RANDOM_EXAM_ID } from './constants'

// Auth context
export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  authStatus: "pending",
  setUser: () => {},
  setAuthStatus: () => {},
  cancelSessionCheck: () => {},
})

// Exam context
export const ExamContext = React.createContext<ExamContextType>({} as ExamContextType)

// Settings context
export const SettingsContext = React.createContext<SettingsContextType>({} as SettingsContextType)

// Toast context
export const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

// Fallback no-op for context defaults — these are never actually called because
// all consuming components only render inside a Navigation Provider that supplies real values.
const noopUpdate = (() => {}) as SessionDispatch

// Split session contexts for better performance
export const SessionNavigationContext = React.createContext<SessionNavigation>({
  index: 0,
  update: noopUpdate
})

export const SessionTimerContext = React.createContext<SessionTimer>({
  time: 0,
  maxTime: 0,
  paused: false,
  update: noopUpdate
})

export const SessionExamContext = React.createContext<SessionExam>({
  examState: 'in-progress',
  reviewState: 'summary',
  categoryId: GENERAL_CATEGORY_ID, // add category to the context for metadata during exam
  examId: RANDOM_EXAM_ID,
  update: noopUpdate
})

export const SessionDataContext = React.createContext<SessionData>({
  bookmarks: [],
  answers: [],
  emailSent: false,
  update: noopUpdate
})
