import type { Exam, Lang, SessionNavigation, SessionTimer, SessionExam, SessionData } from './types'

import { createContext } from 'react'
import { LANGUAGES } from './constants'

// Exam context
export const ExamContext = createContext<Exam>({} as Exam)

// Language context
export const LangContext = createContext<Lang>(LANGUAGES.ar)

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
  reviewState: 'summary'
})

export const SessionDataContext = createContext<SessionData>({
  bookmarks: [],
  answers: []
})
