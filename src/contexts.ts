import React from "react";

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);
import type { AuthContextType, Exam, SessionDispatch, SessionNavigation, SessionTimer, SessionExam, SessionData, SettingsContextType, ToastContextType } from './types'

import { createContext } from 'react'
import { GENERAL_CATEGORY_ID, RANDOM_EXAM_ID } from './constants'

// Auth context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  authStatus: "pending",
  setUser: () => {},
  setAuthStatus: () => {},
  cancelSessionCheck: () => {},
})

// Exam context
export const ExamContext = createContext<Exam>({} as Exam)

// Settings context
export const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType)

// Fallback no-op for context defaults — these are never actually called because
// all consuming components only render inside a Navigation Provider that supplies real values.
const noopUpdate = (() => {}) as SessionDispatch

// Split session contexts for better performance
export const SessionNavigationContext = createContext<SessionNavigation>({
  index: 0,
  update: noopUpdate
})

export const SessionTimerContext = createContext<SessionTimer>({
  time: 0,
  maxTime: 0,
  paused: false,
  update: noopUpdate
})

export const SessionExamContext = createContext<SessionExam>({
  examState: 'in-progress',
  reviewState: 'summary',
  categoryId: GENERAL_CATEGORY_ID, // add category to the context for metadata during exam
  examId: RANDOM_EXAM_ID,
  update: noopUpdate
})

export const SessionDataContext = createContext<SessionData>({
  bookmarks: [],
  answers: [],
  emailSent: false,
  update: noopUpdate
})
