import type { Exam, SessionNavigation, SessionTimer, SessionExam, SessionData, SettingsContextType } from './types'

import { createContext } from 'react'
import { GENERAL_CATEGORY_ID } from './constants'

// Exam context
export const ExamContext = createContext<Exam>({} as Exam)

// Settings context
export const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType)

// Split session contexts for better performance
export const SessionNavigationContext = createContext<SessionNavigation>({
  index: 0
})

export const SessionTimerContext = createContext<SessionTimer>({
  time: 0,
  maxTime: 0,
  paused: false
})

export const SessionExamContext = createContext<SessionExam>({
  examState: 'not-started',
  reviewState: 'summary',
  categoryId: GENERAL_CATEGORY_ID // add category to the context for metadata during exam
})

export const SessionDataContext = createContext<SessionData>({
  bookmarks: [],
  answers: [],
  emailSent: false
})
